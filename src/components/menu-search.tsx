import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowDown, ArrowUp, Clock, CornerDownLeft, Search, Smile, X } from 'lucide-react'
import { match } from 'pinyin-pro'
import { useTranslation } from 'react-i18next'
import { collectContentEntries, type ContentEntry } from '@/lib/content-search'
import { flattenNavigation, isLeavingApp, type NavigationGroup } from '@/lib/navigation'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { cn } from '@/lib/utils'
import { storageKey } from '@/lib/storage-key'
import { Kbd, KbdGroup } from './ui/kbd'

const recentKey = storageKey('menu-search.recent')

/** 索引当前页面内容；只取可见文本，去重并限制数量，避免长页面拖慢搜索。 */
let cachedPath = ''
let cachedEntries: ContentEntry[] = []
/** 页面内容变化（筛选、切页签、异步渲染完）后置为 true，下次搜索重建索引。 */
let indexDirty = true

function indexPageContent(): ContentEntry[] {
  // 同一路由且内容没变时复用索引，避免每次按键都重新扫描 DOM。
  if (!indexDirty && cachedPath === location.pathname && cachedEntries.length) return cachedEntries
  const root = document.getElementById('main-content')
  if (!root) return []
  const entries = collectContentEntries(root)
  cachedPath = location.pathname
  cachedEntries = entries
  indexDirty = false
  return entries
}

/** 内容变化时调用：下次搜索重建索引（比每次按键都重建便宜）。 */
function invalidateContentIndex() {
  indexDirty = true
}

/** 命中后滚动到该元素并短暂高亮。 */
function flash(element: HTMLElement) {
  element.scrollIntoView({ block: 'center', behavior: 'smooth' })
  element.classList.add('content-search-hit')
  window.setTimeout(() => element.classList.remove('content-search-hit'), 1600)
}

function readRecent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(recentKey) ?? '[]')
    return Array.isArray(raw) ? raw.filter((item) => typeof item === 'string').slice(0, 5) : []
  } catch {
    return []
  }
}

/** 命中片段高亮，便于在拼音/模糊匹配后确认结果。 */
function highlight(text: string, query: string) {
  if (!query) return text
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-primary/15 px-0.5 text-primary">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  )
}

/** 顶部命令面板：支持名称、拼音和路径模糊匹配，全键盘可用。 */
export function MenuSearch({ groups }: { groups: NavigationGroup[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selection, setSelection] = useState({ key: '', index: 0 })
  const [recent, setRecent] = useState<string[]>(readRecent)
  /** 页面数据异步渲染，用版本号驱动结果刷新。 */
  const [contentVersion, setContentVersion] = useState(0)
  const [contentOpen, setContentOpen] = useState(true)
  const listId = useId()
  const list = useRef<HTMLDivElement>(null)
  const results = useMemo(
    () =>
      groups
        .flatMap((group) =>
          flattenNavigation(group.items).map(({ item, parents }) => ({
            ...item,
            title: t(item.label),
            // 层级用「分组 / 父级…」表达，搜索子菜单时能看出它在哪一层
            parent: [t(group.label), ...parents.map((parent) => t(parent.label))].join(' / '),
          })),
        )
        .filter(
          (item) =>
            query !== '' &&
            (item.path.includes(query) ||
              [item.title, item.parent].some(
                (text) =>
                  text.includes(query) ||
                  (match(text, query, { continuous: true })?.length ?? 0) > 0,
              )),
        ),
    [groups, query, t],
  )
  const resultKey = JSON.stringify([
    query,
    results.map((item) => [item.path, item.title, item.parent]),
  ])
  const active = selection.key === resultKey ? selection.index : 0
  if (selection.key !== resultKey) setSelection({ key: resultKey, index: 0 })
  const contentResults = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!open || keyword.length < 2) return []
    // contentVersion 仅用于在页面内容变化时重新计算。
    void contentVersion
    // 实时读取当前页面内容，保证与页面状态一致。
    // 内容条目同样支持拼音：先按子串，再按拼音连续匹配。
    return (
      indexPageContent()
        .filter(
          (entry) =>
            entry.text.toLowerCase().includes(keyword) ||
            // 拼音匹配只对短文本有意义，长段落既慢又几乎不会命中
            (entry.text.length <= 40 &&
              (match(entry.text, query.trim(), { continuous: true })?.length ?? 0) > 0),
        )
        // 短文本更可能是"要点的那个词"，长段落排后面
        .sort((a, b) => a.text.length - b.text.length)
        .slice(0, 8)
    )
  }, [open, query, contentVersion])
  useEffect(() => {
    if (!open) return
    const root = document.getElementById('main-content')
    if (!root) return
    const observer = new MutationObserver(() => {
      // 页面内容变了：标脏 + 触发一次重算（结果里用到的正是重建后的索引）
      invalidateContentIndex()
      setContentVersion((value) => value + 1)
    })
    observer.observe(root, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [open])
  const totalResults = results.length + contentResults.length
  function setActive(index: number) {
    setSelection({ key: resultKey, index })
  }
  function changeOpen(value: boolean) {
    setOpen(value)
    if (value) {
      setQuery('')
      setActive(0)
    }
  }
  useEffect(() => {
    const hotkey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      // 主快捷键 ⌘/Ctrl + K：命令面板的通行做法，也和文档站的搜索键一致。
      // ⌘/Ctrl + Shift + S 作为兼容别名保留（`⌘S` 被浏览器"保存网页"占用）。
      const primary = mod && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k'
      const legacy = mod && !event.altKey && event.shiftKey && event.key.toLowerCase() === 's'
      if ((primary || legacy) && !event.isComposing) {
        // 业务弹窗打开时不抢占输入，避免打断正在进行的表单填写。
        if (document.querySelector('[role="dialog"]')) return
        event.preventDefault()
        setQuery('')
        setSelection({ key: '', index: 0 })
        setOpen(true)
      }
    }
    window.addEventListener('keydown', hotkey)
    return () => window.removeEventListener('keydown', hotkey)
  }, [])
  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, results, open])
  function choose(index: number) {
    if (!totalResults) return
    // 结果会随输入实时变化，回调里的下标可能已经越界：夹到有效范围，避免"按了回车没反应"
    const safe = Math.max(0, Math.min(index, totalResults - 1))
    const item = results[safe]
    if (!item) {
      const entry = contentResults[safe - results.length]
      if (!entry) return
      changeOpen(false)
      window.setTimeout(() => flash(entry.element), 80)
      return
    }
    if (query.trim()) {
      const next = [query.trim(), ...recent.filter((entry) => entry !== query.trim())].slice(0, 5)
      setRecent(next)
      try {
        localStorage.setItem(recentKey, JSON.stringify(next))
      } catch {
        /* 忽略隐私模式下的存储失败。 */
      }
    }
    changeOpen(false)
    // 外链菜单按配置的打开方式打开；站内（含 iframe 内嵌）走路由。
    if (isLeavingApp(item) && item.external) {
      if (item.external.target === 'self') window.location.assign(item.external.url)
      else window.open(item.external.url, '_blank', 'noopener,noreferrer')
      return
    }
    void navigate(item.path)
  }
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('menuSearch.title')}
          title={t('menuSearch.title')}
        >
          <Search className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="top-[8dvh] flex max-h-[84dvh] translate-y-0 flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">{t('menuSearch.title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('menuSearch.hint')}</DialogDescription>
        <div className="flex shrink-0 items-center gap-3 border-b px-5">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={t('menuSearch.placeholder')}
            className="h-16 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 md:text-base dark:bg-transparent"
            role="combobox"
            aria-label={t('menuSearch.title')}
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                if (totalResults)
                  setActive(
                    (active + (event.key === 'ArrowDown' ? 1 : -1) + totalResults) % totalResults,
                  )
              } else if (event.key === 'Enter') {
                event.preventDefault()
                choose(active)
              }
            }}
          />
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-3">
          <div
            ref={list}
            id={listId}
            role="listbox"
            aria-label={t('menuSearch.results')}
            className="max-h-80 overflow-y-auto overscroll-contain"
          >
            {results.map((item, index) => (
              <div
                key={item.path}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onClick={() => choose(index)}
                onMouseMove={() => setActive(index)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 [&>span]:min-w-0 [&>span]:break-words',
                  index === active && 'bg-accent text-accent-foreground',
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-medium">{highlight(item.title, query)}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.parent} · {item.path}
                  </span>
                </span>
              </div>
            ))}
            {contentResults.length > 0 && (
              <>
                <div className="flex items-center justify-between px-3 pb-1 pt-3">
                  <p className="text-xs text-muted-foreground">{t('menuSearch.contentTitle')}</p>
                  <button
                    type="button"
                    aria-expanded={contentOpen}
                    className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setContentOpen((value) => !value)}
                  >
                    {t(contentOpen ? 'collapse' : 'expand')} · {contentResults.length}
                  </button>
                </div>
                {contentOpen &&
                  contentResults.map((entry, offset) => {
                    const index = results.length + offset
                    return (
                      <div
                        key={entry.key}
                        id={`${listId}-${index}`}
                        role="option"
                        aria-selected={index === active}
                        onClick={() => choose(index)}
                        onMouseMove={() => setActive(index)}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 text-sm [&>span]:min-w-0 [&>span]:break-words',
                          index === active && 'bg-accent text-accent-foreground',
                        )}
                      >
                        <span className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {t('menuSearch.contentTag')}
                        </span>
                        <span className="min-w-0 flex-1">{highlight(entry.text, query)}</span>
                      </div>
                    )
                  })}
              </>
            )}
          </div>
          {query === '' && recent.length > 0 && (
            <div className="mt-3 border-t pt-3">
              <div className="flex items-center justify-between gap-2 px-2 pb-1">
                <p className="text-xs text-muted-foreground">{t('recentSearch')}</p>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setRecent([])
                    try {
                      localStorage.removeItem(recentKey)
                    } catch {
                      /* 忽略存储失败。 */
                    }
                  }}
                >
                  <X aria-hidden="true" className="size-3" />
                  {t('recentClear')}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 p-1">
                {recent.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs hover:border-primary/40 hover:bg-accent/40"
                    onClick={() => setQuery(entry)}
                  >
                    <Clock aria-hidden="true" className="size-3 text-muted-foreground" />
                    {entry}
                  </button>
                ))}
              </div>
            </div>
          )}
          {totalResults === 0 && (
            <div
              role="status"
              className="flex flex-col items-center justify-center gap-4 px-3 py-8 text-center text-muted-foreground"
            >
              <Smile className="size-9" aria-hidden="true" />
              <p className="text-sm">{t(query ? 'menuSearch.empty' : 'menuSearch.prompt')}</p>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-5 border-t px-4 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Kbd>
              <CornerDownLeft className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
            </Kbd>
            {t('menuSearch.visit')}
          </span>
          <span className="flex items-center gap-1.5">
            <KbdGroup>
              <Kbd>
                <ArrowUp className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
              </Kbd>
              <Kbd>
                <ArrowDown className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
              </Kbd>
            </KbdGroup>
            {t('menuSearch.switch')}
          </span>
          <DialogClose className="ml-auto flex items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-ring">
            <Kbd>Esc</Kbd>
            {t('menuSearch.exit')}
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

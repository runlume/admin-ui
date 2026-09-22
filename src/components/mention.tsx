import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useUiTranslation } from '../lib/use-ui-translation'
import { match } from 'pinyin-pro'
import { cn } from '@/lib/utils'

export type MentionOption = { value: string; label: string; description?: string }

/** 候选列表与输入框的间距，对应 mt-1 / mb-1。 */
const listGap = 4
/** 候选列表的最小可用高度（约两行带描述的候选加内边距）：下方放不下它就改为向上展开。 */
const listMinHeight = 112

/**
 * 提及输入：输入触发字符（默认 `@`）后弹出候选，
 * 采纳后插入**内联标签**（不是纯文本），↑/↓ 选择、Enter 采纳、Esc 关闭。
 * 用 contentEditable 承载，`value` 仍然是可以直接提交的纯文本。
 */
export function Mention({
  value,
  onValueChange,
  options,
  trigger = '@',
  label,
  placeholder,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  options: MentionOption[]
  trigger?: string
  label: string
  placeholder?: string
  className?: string
}) {
  const { t } = useUiTranslation()
  const editor = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState<string>()
  const [active, setActive] = useState(0)
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom')
  const matches = options.filter(
    (option) =>
      query !== undefined &&
      (option.label.toLowerCase().includes(query.toLowerCase()) ||
        (match(option.label, query, { continuous: true })?.length ?? 0) > 0),
  )
  const suggestion = query !== undefined && matches.length > 0

  /** 取光标前一个文本节点里的触发词，用于判断是否弹出候选。 */
  function currentQuery() {
    const selection = window.getSelection()
    if (!selection?.rangeCount) return undefined
    const node = selection.anchorNode
    if (!node || node.nodeType !== Node.TEXT_NODE) return undefined
    const before = (node.textContent ?? '').slice(0, selection.anchorOffset)
    const from = before.lastIndexOf(trigger)
    if (from < 0 || before.slice(from + trigger.length).includes(' ')) return undefined
    return before.slice(from + trigger.length)
  }

  function sync() {
    onValueChange(editor.current?.textContent ?? '')
    setQuery(currentQuery())
    setActive(0)
  }

  /** 下方剩余空间不足列表最小样式时向上展开；两侧都不足时选空间更大的一侧。 */
  function place() {
    const box = editor.current?.getBoundingClientRect()
    if (!box) return
    const below = window.innerHeight - box.bottom - listGap
    const above = box.top - listGap
    setPlacement(below < listMinHeight && above > below ? 'top' : 'bottom')
  }

  /** 采纳候选：把触发词替换成不可编辑的标签节点，并把光标移到标签之后。 */
  function apply(option: MentionOption) {
    const selection = window.getSelection()
    const node = selection?.anchorNode
    if (!selection || !node || node.nodeType !== Node.TEXT_NODE) return
    const text = node.textContent ?? ''
    const caret = selection.anchorOffset
    const before = text.slice(0, caret)
    const from = before.lastIndexOf(trigger)
    if (from < 0) return
    const range = document.createRange()
    range.setStart(node, from)
    range.setEnd(node, caret)
    range.deleteContents()

    const tag = document.createElement('span')
    tag.dataset.mention = option.value
    tag.contentEditable = 'false'
    tag.className = 'mention-tag'
    tag.textContent = `${trigger}${option.label}`
    const space = document.createTextNode('\u00A0')
    range.insertNode(space)
    range.insertNode(tag)
    const after = document.createRange()
    after.setStart(space, space.length)
    after.collapse(true)
    selection.removeAllRanges()
    selection.addRange(after)
    setQuery(undefined)
    window.requestAnimationFrame(() => {
      sync()
      editor.current?.focus()
    })
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Backspace 在标签右侧时整块删除标签，而不是逐字删。
    if (event.key === 'Backspace' && !suggestion) {
      const selection = window.getSelection()
      if (selection?.isCollapsed && selection.anchorNode) {
        const previous = selection.anchorNode.previousSibling
        if (previous instanceof HTMLElement && previous.dataset.mention) {
          event.preventDefault()
          previous.remove()
          sync()
          return
        }
        if (selection.anchorOffset === 0 && selection.anchorNode.parentElement?.dataset.mention) {
          event.preventDefault()
          selection.anchorNode.parentElement.remove()
          sync()
          return
        }
      }
    }
    if (!suggestion) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((active + 1) % matches.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((active - 1 + matches.length) % matches.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const option = matches[active]
      if (option) apply(option)
    } else if (event.key === 'Escape') {
      setQuery(undefined)
    }
  }

  // 候选打开时以及视口变化（窗口缩放、页面或容器滚动）后重新判断展开方向。
  useEffect(() => {
    if (!suggestion) return
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [suggestion])

  return (
    <div data-slot="mention" className={cn('relative', className)}>
      <div
        ref={editor}
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder ?? t('mention.placeholder', { trigger })}
        className="mention-editor min-h-20 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
        onInput={sync}
        onKeyDown={onKeyDown}
        onBlur={() => setQuery(undefined)}
        onPaste={(event) => {
          // 只接受纯文本，避免把外部样式粘进来。
          event.preventDefault()
          const text = event.clipboardData.getData('text/plain')
          document.execCommand('insertText', false, text)
        }}
      />
      {suggestion && (
        <ul
          role="listbox"
          aria-label={t('mention.title')}
          className={cn(
            'absolute z-30 max-h-48 w-64 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md',
            placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
          )}
        >
          {matches.map((option, index) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={index === active}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                  index === active && 'bg-accent text-accent-foreground',
                )}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => apply(option)}
              >
                <span className="min-w-0 flex-1 truncate">
                  <span className="block">{option.label}</span>
                  {option.description && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <span className="sr-only">{value}</span>
    </div>
  )
}

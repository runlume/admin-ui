import { storageKey as environmentStorageKey } from '@/lib/storage-key'
import { useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { GripVertical, Star, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { flattenNavigation, type NavigationItem } from '@/lib/navigation'
import { Button } from './ui/button'
import { Popover } from 'radix-ui'

export function FavoritesMenu({
  userId,
  navigation,
}: {
  userId: string
  navigation: NavigationItem[]
}) {
  const { t } = useTranslation()
  const content = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const location = useLocation()
  const navigate = useNavigate()
  const storageKey = environmentStorageKey(`favorites.v1.${encodeURIComponent(userId)}`)
  function readSaved(): { paths: string[]; failed: boolean } {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
      if (!Array.isArray(value) || !value.every((item) => typeof item === 'string'))
        return { paths: [], failed: true }
      return { paths: [...new Set(value)], failed: false }
    } catch {
      return { paths: [], failed: true }
    }
  }
  const [saved, setSaved] = useState(readSaved)
  const [open, setOpen] = useState(false)
  const [dragged, setDragged] = useState<string>()
  /** 收藏按路径匹配，层级菜单要先展开成平铺列表。 */
  const flat = flattenNavigation(navigation).map((entry) => entry.item)
  const visible = saved.paths.flatMap((path) => {
    const item = flat.find((item) => item.path === path)
    return item ? [item] : []
  })
  const currentPath = location.pathname + location.search + location.hash
  const canAdd = flat.some((item) => item.path === currentPath)
  const added = saved.paths.includes(currentPath)
  function save(paths: string[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(paths))
      setSaved({ paths, failed: false })
    } catch {
      setSaved((current) => ({ ...current, failed: true }))
    }
  }
  function move(path: string, destination: string) {
    const paths = [...saved.paths]
    const from = paths.indexOf(path),
      to = paths.indexOf(destination)
    if (from < 0 || to < 0 || from === to) return
    const [moved] = paths.splice(from, 1)
    if (moved === undefined) return
    paths.splice(to, 0, moved)
    save(paths)
  }
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setSaved(readSaved())
        setOpen(next)
      }}
    >
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('favorites.title')}
          title={t('favorites.title')}
        >
          <Star className="size-4" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          ref={content}
          side="bottom"
          align="start"
          sideOffset={20}
          collisionPadding={12}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            content.current?.focus()
          }}
          className="z-50 flex max-h-[min(32rem,var(--radix-popover-content-available-height))] w-[min(22.5rem,calc(100vw-24px))] flex-col gap-3 overflow-hidden rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg outline-none"
        >
          <div className="flex shrink-0 items-center justify-between gap-3">
            <h2 id={titleId} className="font-semibold">
              {t('favorites.title')}
            </h2>
            <Popover.Close asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </Popover.Close>
          </div>
          <p id={descriptionId} className="shrink-0 text-sm text-muted-foreground">
            {t('favorites.hint')}
          </p>
          {saved.failed && (
            <p role="alert" className="text-sm text-destructive">
              {t('favorites.storageFailed')}
            </p>
          )}
          {canAdd && (
            <Button
              variant="outline"
              className="shrink-0"
              onClick={() =>
                save(
                  added
                    ? saved.paths.filter((path) => path !== currentPath)
                    : [...saved.paths, currentPath],
                )
              }
            >
              {t(added ? 'favorites.removeCurrent' : 'favorites.addCurrent')}
            </Button>
          )}
          {visible.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('favorites.empty')}</p>
          )}
          <ul
            className="min-h-0 space-y-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]"
            aria-label={t('favorites.title')}
          >
            {visible.map((item) => (
              <li
                key={item.path}
                draggable
                onDragStart={() => setDragged(item.path)}
                onDragEnd={() => setDragged(undefined)}
                onDragOver={(event) => {
                  if (dragged) event.preventDefault()
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  if (dragged) move(dragged, item.path)
                  setDragged(undefined)
                }}
                className="flex items-center gap-1 rounded-md border p-2"
              >
                <GripVertical
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <Button
                  variant="ghost"
                  className="min-w-0 flex-1 justify-start"
                  onClick={() => {
                    setOpen(false)
                    void navigate(item.path)
                  }}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="truncate">{t(item.label)}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('favorites.remove', { name: t(item.label) })}
                  onClick={() => save(saved.paths.filter((path) => path !== item.path))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

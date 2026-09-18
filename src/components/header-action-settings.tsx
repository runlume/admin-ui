import { useState } from 'react'
import type { ComponentType } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Bell,
  GripVertical,
  Languages,
  Maximize,
  RefreshCw,
  Search,
  Sun,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppearance, type HeaderActionId } from '@/lib/appearance'
import { GithubMark } from './github-link'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

/** 图标只需要 className：lucide 图标与自绘的 GitHub 标识都能放进来。 */
const icons: Record<HeaderActionId, ComponentType<{ className?: string }>> = {
  search: Search,
  reload: RefreshCw,
  notifications: Bell,
  fullscreen: Maximize,
  language: Languages,
  theme: Sun,
  github: GithubMark,
}

export function HeaderActionSettings() {
  const { t } = useTranslation()
  const actions = useAppearance((state) => state.headerActions)
  const [dragging, setDragging] = useState<HeaderActionId | null>(null)
  const [dropTarget, setDropTarget] = useState<HeaderActionId | null>(null)
  function move(index: number, target: number) {
    useAppearance.setState((state) => {
      const next = [...state.headerActions]
      if (index < 0 || target < 0 || target >= next.length || index === target) return state
      const [moved] = next.splice(index, 1)
      if (!moved) return state
      next.splice(target, 0, moved)
      return { headerActions: next }
    })
  }
  return (
    <fieldset className="space-y-2">
      <legend className="mb-3 font-medium">{t('headerActions.title')}</legend>
      <div role="list" className="space-y-2">
        {actions.map((action, index) => {
          const name = t(`headerActions.${action.id}`)
          const Icon = icons[action.id]
          return (
            <div
              key={action.id}
              role="listitem"
              aria-label={name}
              draggable
              className={cn(
                'flex items-center gap-2 rounded-md',
                dragging === action.id && 'opacity-50',
                dropTarget === action.id &&
                  dragging !== action.id &&
                  'bg-accent ring-1 ring-primary',
              )}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', action.id)
                setDragging(action.id)
              }}
              onDragOver={(event) => {
                if (!dragging) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setDropTarget(action.id)
              }}
              onDrop={(event) => {
                if (!dragging) return
                event.preventDefault()
                move(
                  actions.findIndex((item) => item.id === dragging),
                  index,
                )
                setDragging(null)
                setDropTarget(null)
              }}
              onDragEnd={() => {
                setDragging(null)
                setDropTarget(null)
              }}
            >
              <GripVertical
                className="size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
                aria-hidden="true"
              />
              <label className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{name}</span>
                </span>
                <input
                  className="size-4 shrink-0 accent-primary"
                  type="checkbox"
                  checked={action.visible}
                  onChange={(event) => {
                    const visible = event.target.checked
                    useAppearance.setState((state) => ({
                      headerActions: state.headerActions.map((item) =>
                        item.id === action.id ? { ...item, visible } : item,
                      ),
                    }))
                  }}
                />
              </label>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                disabled={index === 0}
                aria-label={t('headerActions.up', { name })}
                onClick={() => move(index, index - 1)}
              >
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                disabled={index === actions.length - 1}
                aria-label={t('headerActions.down', { name })}
                onClick={() => move(index, index + 1)}
              >
                <ArrowDown />
              </Button>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

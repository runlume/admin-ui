import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GripVertical, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { storageKey } from '@/lib/storage-key'

/**
 * 布局容器：主内容 + 可折叠侧栏（三栏详情常用右侧详情面板）。
 * 侧栏折叠状态只影响当前视图，不写入偏好。
 */
export function LayoutContainer({
  children,
  aside,
  asideLabel,
  defaultCollapsed = false,
  storageId,
  onWidthChange,
  className,
}: {
  children: ReactNode
  aside?: ReactNode
  /** 侧栏的访问名称。 */
  asideLabel?: string
  defaultCollapsed?: boolean
  /** 传入后把宽度保存在浏览器，并与业务共享当前宽度。 */
  storageId?: string
  onWidthChange?: (width: number) => void
  className?: string
}) {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [width, setWidth] = useState(() => {
    if (!storageId) return 288
    const saved = Number(localStorage.getItem(storageKey(`aside.${storageId}`)))
    return Number.isFinite(saved) && saved >= 200 && saved <= 560 ? saved : 288
  })
  useEffect(() => {
    onWidthChange?.(width)
    if (!storageId) return
    try {
      localStorage.setItem(storageKey(`aside.${storageId}`), String(width))
    } catch {
      /* 忽略隐私模式下的写入失败。 */
    }
  }, [storageId, width, onWidthChange])
  const drag = useRef<{ x: number; width: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const minWidth = 200
  const maxWidth = 560
  return (
    <div data-slot="layout-container" className={cn('flex min-h-0 w-full gap-4', className)}>
      <div className="min-w-0 flex-1">{children}</div>
      {aside && (
        <aside
          aria-label={asideLabel ?? t('layoutContainer.aside')}
          style={{ width: collapsed ? 48 : width }}
          className={cn(
            'relative shrink-0 overflow-hidden border-l pl-4',
            !dragging && 'transition-[width] duration-200',
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-expanded={!collapsed}
            aria-label={t(collapsed ? 'layoutContainer.expand' : 'layoutContainer.collapse')}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
          </Button>
          {!collapsed && (
            <>
              {/* 拖拽手柄：向左变宽，最宽 560px，最窄 200px。 */}
              <span
                role="separator"
                aria-orientation="vertical"
                aria-label={t('layoutContainer.resize')}
                aria-valuenow={width}
                aria-valuemin={minWidth}
                aria-valuemax={maxWidth}
                tabIndex={0}
                className="absolute inset-y-0 left-0 w-1.5 cursor-col-resize hover:bg-primary/30"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId)
                  drag.current = { x: event.clientX, width }
                  setDragging(true)
                }}
                onPointerMove={(event) => {
                  if (!drag.current) return
                  const next = drag.current.width - (event.clientX - drag.current.x)
                  setWidth(Math.min(maxWidth, Math.max(minWidth, next)))
                }}
                onPointerUp={() => {
                  drag.current = null
                  setDragging(false)
                }}
                onDoubleClick={() => setWidth(288)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
                  event.preventDefault()
                  setWidth((value) =>
                    Math.min(
                      maxWidth,
                      Math.max(minWidth, value + (event.key === 'ArrowRight' ? 16 : -16)),
                    ),
                  )
                }}
              />
              <div className="mt-3 space-y-3 text-sm">{aside}</div>
              <GripVertical aria-hidden="true" className="sr-only" />
            </>
          )}
        </aside>
      )}
    </div>
  )
}

'use client'

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { avoidInitialCloseFocus } from '@/lib/dialog-focus'
import { cn } from '@/lib/utils'
import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'

import { Button } from '@/components/ui/button'

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onOpenAutoFocus,
  draggable = false,
  zIndex,
  top,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Content>, 'draggable'> & {
  showCloseButton?: boolean
  /**
   * 允许拖动标题栏：`true` 只在精细指针（鼠标/触控板）生效；
   * `'always'` 连大触摸屏也允许拖动（标题栏设 touch-action: none）。
   */
  draggable?: boolean | 'always'
  /** 覆盖浮层层级，仅在与第三方浮层叠加时使用。 */
  zIndex?: number
  /** 距顶部的距离（px）；不传则垂直居中。 */
  top?: number
}) {
  const { t } = useTranslation()
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })
  // 拖动期间禁用过渡：否则 translate 会以 200ms 过渡，跟手会有明显滞后。
  const [dragging, setDragging] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef<{ x: number; y: number; origin: { x: number; y: number } } | null>(null)
  React.useEffect(() => {
    const node = contentRef.current
    if (!node) return
    if (dragging) node.style.transitionProperty = 'none'
    else node.style.removeProperty('transition-property')
  }, [dragging])
  React.useEffect(() => {
    const node = contentRef.current
    if (!node) return
    if (top === undefined) return
    node.style.top = `${top}px`
  }, [top])
  const canDrag = Boolean(draggable)
  const touchDrag = String(draggable) === 'always'
  /**
   * 拖动位移叠加在居中之上：直接用 `translate` 属性写位移会盖掉 Tailwind 的
   * `translate-x/y-[-50%]` 居中，表现就是"一按下弹窗就跳半个身位"。
   * 这里改写 Tailwind 用的那两个变量，居中与位移同时生效。
   */
  const dragVars = canDrag
    ? {
        '--tw-translate-x': `calc(-50% + ${offset.x}px)`,
        '--tw-translate-y': top === undefined ? `calc(-50% + ${offset.y}px)` : `${offset.y}px`,
      }
    : undefined
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay style={zIndex ? { zIndex } : undefined} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-draggable={canDrag || undefined}
        data-drag-touch={touchDrag || undefined}
        data-dragging={dragging || undefined}
        ref={contentRef}
        style={{ ...(zIndex ? { zIndex } : {}), ...dragVars }}
        onDoubleClick={() => {
          if (!canDrag) return
          setOffset({ x: 0, y: 0 })
        }}
        onKeyDown={(event) => {
          if (!canDrag || event.metaKey || event.ctrlKey || event.altKey) return
          const target = event.target as HTMLElement
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
          const step = event.shiftKey ? 48 : 16
          const delta = {
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
          }[event.key]
          if (!delta) return
          event.preventDefault()
          setOffset((current) => ({
            x: Math.max(-320, Math.min(320, current.x + (delta[0] ?? 0) * step)),
            y: Math.max(-320, Math.min(320, current.y + (delta[1] ?? 0) * step)),
          }))
        }}
        className={cn(
          'fixed left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg',
          top !== undefined
            ? 'translate-x-[-50%]'
            : 'top-[50%] translate-x-[-50%] translate-y-[-50%]',
          className,
        )}
        {...props}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event)
          if (!event.defaultPrevented) avoidInitialCloseFocus(event)
        }}
      >
        {canDrag && (
          <span
            data-slot="dialog-drag-handle"
            aria-hidden="true"
            onPointerDown={(event) => {
              if (!touchDrag && !window.matchMedia('(hover: hover) and (pointer: fine)').matches)
                return
              event.currentTarget.setPointerCapture(event.pointerId)
              // 记录按下点，移动超过阈值才算拖动，避免弹窗在指针下打开时"飘走"。
              drag.current = { x: event.clientX, y: event.clientY, origin: offset }
            }}
            onPointerMove={(event) => {
              if (!drag.current) return
              const moved = Math.hypot(
                event.clientX - drag.current.x,
                event.clientY - drag.current.y,
              )
              if (!dragging && moved < 4) return
              if (!dragging) setDragging(true)
              const next = {
                x: drag.current.origin.x + (event.clientX - drag.current.x),
                y: drag.current.origin.y + (event.clientY - drag.current.y),
              }
              const limit = 320
              setOffset({
                x: Math.max(-limit, Math.min(limit, next.x)),
                y: Math.max(-limit, Math.min(limit, next.y)),
              })
            }}
            onPointerUp={() => {
              drag.current = null
              setDragging(false)
            }}
            onPointerCancel={() => {
              drag.current = null
              setDragging(false)
            }}
            className="absolute inset-x-0 top-0 h-14 cursor-grab active:cursor-grabbing"
          />
        )}
        {children}
        {canDrag && (offset.x !== 0 || offset.y !== 0) && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="absolute bottom-3 left-4 text-xs text-muted-foreground"
            onClick={() => setOffset({ x: 0, y: 0 })}
          >
            {t('resetPosition')}
          </Button>
        )}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 z-10 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

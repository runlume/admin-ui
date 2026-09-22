import { useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/utils'

export type ResizablePanelProps = {
  first: ReactNode
  second: ReactNode
  direction?: 'horizontal' | 'vertical'
  defaultSize?: number
  minSize?: number
  maxSize?: number
  onSizeChange?: (size: number) => void
  firstLabel?: string
  secondLabel?: string
  className?: string
}

export function ResizablePanel({
  first,
  second,
  direction = 'horizontal',
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  onSizeChange,
  firstLabel = '第一个面板',
  secondLabel = '第二个面板',
  className,
}: ResizablePanelProps) {
  const root = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(defaultSize)

  function change(next: number) {
    const resolved = Math.min(maxSize, Math.max(minSize, next))
    setSize(resolved)
    onSizeChange?.(resolved)
  }

  function startDrag(event: React.PointerEvent) {
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function drag(event: React.PointerEvent) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !root.current) return
    const rect = root.current.getBoundingClientRect()
    const next =
      direction === 'horizontal'
        ? ((event.clientX - rect.left) / rect.width) * 100
        : ((event.clientY - rect.top) / rect.height) * 100
    change(next)
  }

  const horizontal = direction === 'horizontal'
  return (
    <div
      ref={root}
      className={cn(
        'flex min-h-56 overflow-hidden rounded-lg border',
        !horizontal && 'flex-col',
        className,
      )}
    >
      <section
        aria-label={firstLabel}
        className="min-h-0 min-w-0 overflow-auto p-4"
        style={{ flexBasis: `${size}%` }}
      >
        {first}
      </section>
      <div
        role="separator"
        tabIndex={0}
        aria-label="调整面板大小"
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        aria-valuemin={minSize}
        aria-valuemax={maxSize}
        aria-valuenow={Math.round(size)}
        className={cn(
          'relative shrink-0 bg-border hover:bg-primary focus-visible:bg-primary focus-visible:outline-none',
          horizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
        )}
        onDoubleClick={() => change(defaultSize)}
        onPointerDown={startDrag}
        onPointerMove={drag}
        onKeyDown={(event) => {
          const decrement = horizontal ? event.key === 'ArrowLeft' : event.key === 'ArrowUp'
          const increment = horizontal ? event.key === 'ArrowRight' : event.key === 'ArrowDown'
          if (decrement || increment) {
            event.preventDefault()
            change(size + (increment ? 5 : -5))
          }
        }}
      />
      <section aria-label={secondLabel} className="min-h-0 min-w-0 flex-1 overflow-auto p-4">
        {second}
      </section>
    </div>
  )
}

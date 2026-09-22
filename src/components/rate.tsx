import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '../lib/utils'

export type RateProps = {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  max?: number
  precision?: 1 | 0.5
  clearable?: boolean
  disabled?: boolean
  label?: string
  className?: string
}

export function Rate({
  value,
  defaultValue = 0,
  onValueChange,
  max = 5,
  precision = 1,
  clearable = true,
  disabled,
  label = '评分',
  className,
}: RateProps) {
  const [internal, setInternal] = useState(defaultValue)
  const [preview, setPreview] = useState<number>()
  const current = value ?? internal
  const shown = preview ?? current

  function change(next: number) {
    if (disabled) return
    const resolved = clearable && next === current ? 0 : next
    if (value === undefined) setInternal(resolved)
    onValueChange?.(resolved)
  }

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={current}
      aria-disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1 rounded-md focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      onBlur={() => setPreview(undefined)}
      onKeyDown={(event) => {
        const step = precision
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
          event.preventDefault()
          change(Math.min(max, current + step))
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
          event.preventDefault()
          change(Math.max(0, current - step))
        } else if (event.key === 'Home') change(0)
        else if (event.key === 'End') change(max)
      }}
      onMouseLeave={() => setPreview(undefined)}
    >
      {Array.from({ length: max }, (_, index) => {
        const fullValue = index + 1
        const fill = shown >= fullValue ? 100 : shown >= fullValue - 0.5 ? 50 : 0
        return (
          <button
            key={fullValue}
            type="button"
            disabled={disabled}
            aria-label={`${fullValue} ${label}`}
            className="relative size-7 text-muted-foreground transition-transform hover:scale-110 disabled:pointer-events-none"
            onMouseMove={(event) => {
              const half =
                precision === 0.5 && event.nativeEvent.offsetX < event.currentTarget.offsetWidth / 2
              setPreview(half ? fullValue - 0.5 : fullValue)
            }}
            onClick={() => change(preview ?? fullValue)}
          >
            <Star className="absolute inset-1 size-5" aria-hidden="true" />
            <span
              className="absolute inset-1 overflow-hidden text-warning"
              style={{ width: `${fill}%` }}
            >
              <Star className="size-5 fill-current" aria-hidden="true" />
            </span>
          </button>
        )
      })}
    </div>
  )
}

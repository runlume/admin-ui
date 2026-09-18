import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

const tones = {
  default: '',
  soft: '',
  outline: 'border',
} as const

/**
 * 指标涨跌徽标。`reverse` 表示"数值上升是坏事"（如待处理数）。
 */
export function Trend({
  value,
  direction,
  reverse = false,
  variant = 'soft',
  suffix = '%',
  className,
}: {
  /** 百分比数值，undefined 时显示持平。 */
  value?: number
  direction: 'up' | 'down' | 'flat'
  reverse?: boolean
  variant?: keyof typeof tones
  suffix?: string
  className?: string
}) {
  const good = direction === 'flat' ? undefined : (direction === 'up') !== reverse
  const Icon = direction === 'flat' ? Minus : direction === 'up' ? ArrowUpRight : ArrowDownRight
  const text = value === undefined ? '' : `${value > 0 ? '+' : ''}${value.toFixed(1)}${suffix}`
  return (
    <span
      data-slot="trend"
      data-direction={direction}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums',
        good === undefined && 'bg-muted text-muted-foreground',
        good === true && 'bg-success-soft text-success',
        good === false && 'bg-danger-soft text-danger',
        variant === 'outline' && 'border-current/30 bg-transparent',
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3" />
      {direction === 'flat' ? '0.0' + suffix : text}
    </span>
  )
}

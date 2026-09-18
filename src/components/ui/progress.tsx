import { Progress as ProgressPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

const tones = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
} as const

/** 进度条：上传、额度、任务完成度。 */
function Progress({
  className,
  value = 0,
  max = 100,
  tone = 'primary',
  label,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  tone?: keyof typeof tones
  label?: string
}) {
  const current = value ?? 0
  const percent = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      max={max}
      aria-label={label}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full w-full flex-1 transition-transform', tones[tone])}
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }

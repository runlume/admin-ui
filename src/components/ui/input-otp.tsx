import { useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * 分格验证码输入。
 * 用一个真实 input 承担输入与粘贴，分格只负责展示，避免焦点在格子间跳转的可访问性问题。
 */
function InputOTP({
  value,
  onValueChange,
  length = 6,
  id,
  label,
  fill = false,
  invalid = false,
  describedBy,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  length?: number
  id?: string
  /** 输入框的访问名称。 */
  label: string
  /** 铺满整行：格子按等分拉伸，适合表单里与其它输入框等宽对齐。 */
  fill?: boolean
  /** 错误态：描红并交给读屏。 */
  invalid?: boolean
  /** 错误说明元素的 id。 */
  describedBy?: string
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const digits = Array.from({ length }, (_, index) => value[index] ?? '')
  return (
    <div className={cn('relative', className)}>
      <input
        ref={ref}
        id={id}
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        value={value}
        className="absolute inset-0 z-10 h-full w-full cursor-text appearance-none border-0 bg-transparent p-0 text-transparent caret-transparent shadow-none outline-none focus:border-0 focus:ring-0 focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none"
        onChange={(event) => onValueChange(event.target.value.replace(/\D/g, '').slice(0, length))}
      />
      <div
        aria-hidden="true"
        className={cn('flex items-center gap-2', fill && 'w-full')}
        onClick={() => ref.current?.focus()}
      >
        {digits.map((digit, index) => (
          <span
            key={index}
            className={cn(
              'flex h-10 items-center justify-center rounded-lg border bg-card text-base font-medium tabular-nums',
              fill ? 'min-w-0 flex-1' : 'size-10',
              digit && 'border-primary/50',
              invalid && 'border-destructive',
              index === value.length && 'border-ring ring-2 ring-ring/20',
            )}
          >
            {digit}
          </span>
        ))}
      </div>
    </div>
  )
}

export { InputOTP }

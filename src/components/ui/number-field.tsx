import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'
import { cn } from '@/lib/utils'

/** 数字步进输入。 */
function NumberField({
  value,
  onValueChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  disabled = false,
  label,
  unit,
  className,
}: {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  label: string
  /** 数值单位，显示在输入框右侧，例如 个 / 秒 / %。 */
  unit?: string
  className?: string
}) {
  const { t } = useTranslation()
  const clamp = (next: number) =>
    Number(Math.min(max, Math.max(min, next)).toFixed(step < 1 ? 2 : 0))
  return (
    <div
      data-slot="number-field"
      className={cn(
        'inline-flex h-10 items-center rounded-lg border border-input bg-card',
        disabled && 'opacity-50',
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`${label} ${t('numberField.decrease')}`}
        disabled={disabled || value <= min}
        onClick={() => onValueChange(clamp(value - step))}
      >
        <Minus aria-hidden="true" />
      </Button>
      {unit && <span className="pl-1 text-xs text-muted-foreground">{unit}</span>}
      <input
        aria-label={label}
        inputMode="decimal"
        value={value}
        disabled={disabled}
        className="h-full w-16 min-w-0 border-x border-input bg-transparent text-center text-sm tabular-nums outline-none"
        onChange={(event) => {
          const parsed = Number(event.target.value)
          if (!Number.isNaN(parsed)) onValueChange(clamp(parsed))
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`${label} ${t('numberField.increase')}`}
        disabled={disabled || value >= max}
        onClick={() => onValueChange(clamp(value + step))}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  )
}

export { NumberField }

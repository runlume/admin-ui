import { DateInput } from './date-input'
import { TimeInput } from './time-input'
import { cn } from '@/lib/utils'

/**
 * 日期 + 时间组合控件：一次填完 `YYYY-MM-DDTHH:mm`，
 * 两个子输入共用同一行标签，避免业务里再拼两个字段。
 */
function DateTimeInput({
  value,
  onValueChange,
  label,
  className,
}: {
  /** `YYYY-MM-DDTHH:mm`，可只填日期或只填时间。 */
  value: string
  onValueChange: (value: string) => void
  label: string
  className?: string
}) {
  const [date = '', time = ''] = (value ?? '').split('T')
  return (
    <div data-slot="date-time-input" className={cn('flex gap-2', className)}>
      <DateInput
        aria-label={`${label}·日期`}
        value={date}
        onChange={(event) => onValueChange(`${event.target.value}T${time}`)}
      />
      <TimeInput
        aria-label={`${label}·时间`}
        value={time}
        onChange={(event) => onValueChange(`${date}T${event.target.value}`)}
      />
    </div>
  )
}

export { DateTimeInput }

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { dayKey, monthGrid } from '../lib/range'

export type CalendarProps = {
  value?: string
  onValueChange?: (value: string) => void
  locale?: string
  weekStartsOn?: 0 | 1
  min?: string
  max?: string
  disabledDates?: (date: Date) => boolean
  todayLabel?: string
  className?: string
}

export function Calendar({
  value,
  onValueChange,
  locale = 'zh-CN',
  weekStartsOn = 1,
  min,
  max,
  disabledDates,
  todayLabel = '今天',
  className,
}: CalendarProps) {
  const selected = value ? new Date(`${value}T00:00:00`) : new Date()
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
  const days = monthGrid(month, weekStartsOn)
  const formatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }),
    [locale],
  )
  const weekday = useMemo(() => {
    const base = new Date(2026, 8, weekStartsOn === 1 ? 14 : 13)
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(base)
      date.setDate(base.getDate() + index)
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date)
    })
  }, [locale, weekStartsOn])
  const today = dayKey(new Date())

  function changeMonth(offset: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  return (
    <section
      className={cn('w-full max-w-md rounded-xl border bg-card p-4', className)}
      aria-label="Calendar"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => changeMonth(-1)}
          aria-label="上个月"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <h3 className="font-medium">{formatter.format(month)}</h3>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => changeMonth(1)}
          aria-label="下个月"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </header>
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
        {weekday.map((label) => (
          <span key={label} className="py-2">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const key = dayKey(date)
          const outside = date.getMonth() !== month.getMonth()
          const disabled = Boolean(
            (min && key < min) || (max && key > max) || disabledDates?.(date),
          )
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              aria-label={new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date)}
              aria-current={key === today ? 'date' : undefined}
              aria-pressed={key === value}
              className={cn(
                'aspect-square rounded-md text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                outside && 'text-muted-foreground/50',
                key === today && 'border border-primary',
                key === value && 'bg-primary text-primary-foreground hover:bg-primary',
                disabled && 'cursor-not-allowed opacity-30',
              )}
              onClick={() => {
                onValueChange?.(key)
                if (outside) setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
              }}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-3 w-full"
        onClick={() => {
          const now = new Date()
          setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
          onValueChange?.(today)
        }}
      >
        {todayLabel}
      </Button>
    </section>
  )
}

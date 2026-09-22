import * as React from 'react'
import { Popover } from 'radix-ui'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUiTranslation } from '../../lib/use-ui-translation'
import { cn } from '@/lib/utils'
import { inputBaseClass } from './input'

const keyOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const parseDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return year && month && day ? new Date(year, month - 1, day) : new Date()
}

export function DateInput({
  ref,
  className,
  onChange,
  onKeyDown,
  disabled,
  readOnly,
  ...props
}: React.ComponentProps<'input'>) {
  const { i18n } = useUiTranslation()
  const english = i18n.language.startsWith('en')
  const native = React.useRef<HTMLInputElement>(null)
  const panel = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<'day' | 'month' | 'year'>('day')
  const [month, setMonth] = React.useState(() =>
    parseDate(String(props.value ?? props.defaultValue ?? '')),
  )
  const [focused, setFocused] = React.useState('')
  const [selected, setSelected] = React.useState('')
  React.useImperativeHandle(ref, () => native.current!)
  const minimum = String(props.min ?? '').slice(0, 10)
  const maximum = String(props.max ?? '').slice(0, 10)
  const unavailable = (day: string) => (!!minimum && day < minimum) || (!!maximum && day > maximum)
  function show(value: boolean) {
    if (value) {
      const current = native.current!.value.slice(0, 10)
      let start = current || keyOf(new Date())
      if (minimum && start < minimum) start = minimum
      if (maximum && start > maximum) start = maximum
      setMonth(parseDate(start))
      setFocused(start)
      setSelected(current)
    }
    setOpen(value)
  }
  React.useEffect(() => {
    if (open) panel.current?.querySelector<HTMLButtonElement>(`[data-day="${focused}"]`)?.focus()
  }, [open, focused])
  function choose(day: string) {
    const input = native.current!
    const next =
      day && props.type === 'datetime-local'
        ? `${day}T${input.value.split('T')[1] || '00:00'}`
        : day
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, next)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    setOpen(false)
  }
  function moveMonth(delta: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1)
    setMonth(next)
    setFocused(keyOf(next))
  }
  const start = new Date(month.getFullYear(), month.getMonth(), 1)
  start.setDate(1 - start.getDay())
  const days = Array.from(
    { length: 42 },
    (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  )
  return (
    <Popover.Root open={open} onOpenChange={show}>
      <div className="relative min-w-0 w-full">
        <input
          {...props}
          ref={native}
          disabled={disabled}
          readOnly={readOnly}
          data-slot="input"
          className={cn(inputBaseClass, 'themed-date-input pr-10', className)}
          onChange={onChange}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (
              !event.defaultPrevented &&
              event.altKey &&
              event.key === 'ArrowDown' &&
              !disabled &&
              !readOnly
            ) {
              event.preventDefault()
              show(true)
            }
          }}
        />
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled || readOnly}
            aria-label={english ? 'Choose date' : '选择日期'}
            className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            <CalendarDays className="size-4" />
          </button>
        </Popover.Trigger>
      </div>
      <Popover.Portal>
        <Popover.Content
          ref={panel}
          sideOffset={4}
          align="start"
          aria-label={english ? 'Calendar' : '日历'}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            panel.current?.querySelector<HTMLButtonElement>(`[data-day="${focused}"]`)?.focus()
          }}
          className="z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border bg-popover p-3 text-popover-foreground shadow-md"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label={english ? 'Previous month' : '上个月'}
              onClick={() => moveMonth(-1)}
              className="flex size-8 items-center justify-center rounded-md hover:bg-accent"
            >
              <ChevronLeft className="size-4" />
            </button>
            {/* 点标题切换到月/年视图，只改变展示锚点，选中日期不变。 */}
            <button
              type="button"
              aria-label={english ? 'Switch to month or year view' : '切换到月/年视图'}
              className="rounded-md px-2 py-1 text-sm font-medium hover:bg-accent"
              onClick={() => setView(view === 'day' ? 'month' : view === 'month' ? 'year' : 'day')}
            >
              {new Intl.DateTimeFormat(i18n.language, { year: 'numeric', month: 'long' }).format(
                month,
              )}
            </button>
            <button
              type="button"
              aria-label={english ? 'Next month' : '下个月'}
              onClick={() => moveMonth(1)}
              className="flex size-8 items-center justify-center rounded-md hover:bg-accent"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          {view === 'month' && (
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 12 }, (_, index) => index).map((index) => (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    'rounded-md px-2 py-2 text-sm hover:bg-accent',
                    month.getMonth() === index && 'bg-primary/10 text-primary',
                  )}
                  onClick={() => {
                    setMonth(new Date(month.getFullYear(), index, 1))
                    setView('day')
                  }}
                >
                  {new Intl.DateTimeFormat(i18n.language, { month: 'short' }).format(
                    new Date(month.getFullYear(), index, 1),
                  )}
                </button>
              ))}
            </div>
          )}
          {view === 'year' && (
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 12 }, (_, index) => month.getFullYear() - 6 + index).map(
                (year) => (
                  <button
                    key={year}
                    type="button"
                    className={cn(
                      'rounded-md px-2 py-2 text-sm hover:bg-accent',
                      month.getFullYear() === year && 'bg-primary/10 text-primary',
                    )}
                    onClick={() => {
                      setMonth(new Date(year, month.getMonth(), 1))
                      setView('month')
                    }}
                  >
                    {year}
                  </button>
                ),
              )}
            </div>
          )}
          {view === 'day' && (
            <>
              <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
                {days.slice(0, 7).map((day) => (
                  <span key={keyOf(day)} className="py-2">
                    {new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(day)}
                  </span>
                ))}
              </div>
              <div
                className="grid grid-cols-7 gap-0.5"
                onKeyDown={(event) => {
                  const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[
                    event.key
                  ]
                  if (delta === undefined) return
                  event.preventDefault()
                  const next = parseDate(focused)
                  next.setDate(next.getDate() + delta)
                  const key = keyOf(next)
                  if (!unavailable(key)) {
                    setMonth(next)
                    setFocused(key)
                  }
                }}
              >
                {days.map((day) => {
                  const key = keyOf(day)
                  return (
                    <button
                      key={key}
                      type="button"
                      data-day={key}
                      tabIndex={key === focused ? 0 : -1}
                      aria-label={key}
                      aria-pressed={selected === key}
                      aria-current={key === keyOf(new Date()) ? 'date' : undefined}
                      disabled={unavailable(key)}
                      onClick={() => choose(key)}
                      className={cn(
                        'h-8 rounded-md text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-30',
                        day.getMonth() !== month.getMonth() && 'text-muted-foreground',
                        selected === key &&
                          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                      )}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            </>
          )}
          <div className="mt-2 flex justify-between border-t pt-2">
            <button
              type="button"
              onClick={() => choose('')}
              className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent"
            >
              {english ? 'Clear' : '清除'}
            </button>
            <button
              type="button"
              disabled={unavailable(keyOf(new Date()))}
              onClick={() => choose(keyOf(new Date()))}
              className="rounded-md px-2 py-1 text-sm text-primary hover:bg-accent disabled:opacity-30"
            >
              {english ? 'Today' : '今天'}
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

import { useRef, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { useUiTranslation } from '../../lib/use-ui-translation'
import { Popover } from 'radix-ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { dayKey, monthGrid, rangeState } from '../../lib/range'
import { DateInput } from './date-input'
import { Button } from './button'
import { Label } from './label'
import { invalidRange, rangeLabel, rangeShortcuts, type DateRange } from '../../lib/range'
import { cn } from '@/lib/utils'

/**
 * 日期范围选择：月历点选或拖选区间，并可套用常用快捷区间。
 * 适用于列表筛选这类"开始 ~ 结束"的场景。
 */
function DateRangeInput({
  value,
  onValueChange,
  label,
  className,
}: {
  value: DateRange
  onValueChange: (range: DateRange) => void
  label: string
  className?: string
}) {
  const { t, i18n } = useUiTranslation()
  const [draft, setDraft] = useState<DateRange>(value)
  const [open, setOpen] = useState(false)
  const invalid = invalidRange(draft)
  const shortcuts = rangeShortcuts()
  const text = rangeLabel(value)
  const [cursor, setCursor] = useState(() => new Date(value.from ?? Date.now()))
  const [hovered, setHovered] = useState<string>()
  const press = useRef<{ key: string; dragging: boolean } | null>(null)
  const days = monthGrid(cursor)
  const monthLabel = new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'long',
  }).format(cursor)
  // 拖选/点选：先点开始，再点结束；反向点选自动交换。
  function pick(day: string) {
    setDraft((current) => {
      if (!current.from || (current.from && current.to)) return { from: day, to: undefined }
      return day < current.from ? { from: day, to: current.from } : { ...current, to: day }
    })
  }
  /** 按住拖动：起点固定，移动经过的日期实时作为终点。 */
  function dragTo(day: string) {
    const current = press.current
    if (!current) return
    // 第一次移动才进入拖选，未移动时仍按"点选"处理（先点开始再点结束）。
    if (!current.dragging) {
      if (day === current.key) return
      current.dragging = true
    }
    setDraft(() =>
      day < current.key ? { from: day, to: current.key } : { from: current.key, to: day },
    )
  }
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setDraft(value)
      }}
    >
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={label}
          className={cn('w-full justify-start bg-card font-normal', className)}
        >
          <CalendarRange aria-hidden="true" className="size-4 opacity-60" />
          <span className={cn('truncate', !text && 'text-muted-foreground')}>
            {text || t('dateRange.placeholder')}
          </span>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-80 rounded-lg border bg-popover p-3 shadow-lg outline-none"
          onMouseLeave={() => {
            press.current = null
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('dateRange.previousMonth')}
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <p className="text-sm font-medium">{monthLabel}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('dateRange.nextMonth')}
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
            {days.slice(0, 7).map((day) => (
              <span key={dayKey(day)} className="py-1">
                {new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(day)}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const key = dayKey(day)
              const preview = draft.from && !draft.to ? { from: draft.from, to: hovered } : draft
              const state = rangeState(preview, key)
              const outside = day.getMonth() !== cursor.getMonth()
              return (
                <button
                  key={key}
                  type="button"
                  data-day={key}
                  aria-label={key}
                  aria-pressed={state !== 'outside'}
                  onMouseEnter={() => {
                    setHovered(key)
                    dragTo(key)
                  }}
                  onMouseLeave={() => setHovered(undefined)}
                  onMouseDown={() => {
                    press.current = { key, dragging: false }
                  }}
                  onMouseUp={() => {
                    const state = press.current
                    press.current = null
                    if (state && !state.dragging) pick(key)
                  }}
                  className={cn(
                    'h-8 rounded-md text-sm tabular-nums hover:bg-accent',
                    outside && 'text-muted-foreground',
                    state === 'in-range' && 'bg-primary/10 text-primary',
                    (state === 'start' || state === 'end') &&
                      'bg-primary text-primary-foreground hover:bg-primary',
                  )}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="range-from">{t('dateRange.from')}</Label>
              <DateInput
                id="range-from"
                value={draft.from ?? ''}
                max={draft.to}
                onChange={(event) => setDraft({ ...draft, from: event.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="range-to">{t('dateRange.to')}</Label>
              <DateInput
                id="range-to"
                value={draft.to ?? ''}
                min={draft.from}
                onChange={(event) => setDraft({ ...draft, to: event.target.value })}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {shortcuts.map((shortcut) => (
              <Button
                key={shortcut.key}
                type="button"
                size="sm"
                variant="outline"
                // 快捷区间直接生效并关闭：只填草稿还得再点「确定」，很容易以为没点上
                onClick={() => {
                  setDraft(shortcut.range)
                  onValueChange(shortcut.range)
                  setOpen(false)
                }}
              >
                {t(`dateRange.shortcuts.${shortcut.key}`)}
              </Button>
            ))}
          </div>
          {invalid && <p className="mt-2 text-xs text-destructive">{t('dateRange.invalid')}</p>}
          <div className="mt-3 flex justify-end gap-2 border-t pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDraft({})
                onValueChange({})
                setOpen(false)
              }}
            >
              {t('clear')}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={invalid}
              onClick={() => {
                onValueChange(draft)
                setOpen(false)
              }}
            >
              {t('confirm')}
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export { DateRangeInput }

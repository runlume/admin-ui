/** 日期区间的解析与快捷选项。 */
export type DateRange = { from?: string; to?: string }

const pad = (value: number) => String(value).padStart(2, '0')
export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** 快捷区间：今天、近 7 天、近 30 天、本月。 */
export function rangeShortcuts(now: Date = new Date()): { key: string; range: DateRange }[] {
  const start = new Date(now)
  const week = new Date(now)
  week.setDate(week.getDate() - 6)
  const month = new Date(now)
  month.setDate(month.getDate() - 29)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  return [
    { key: 'today', range: { from: dayKey(now), to: dayKey(now) } },
    { key: 'week', range: { from: dayKey(week), to: dayKey(now) } },
    { key: 'month', range: { from: dayKey(month), to: dayKey(now) } },
    { key: 'monthStart', range: { from: dayKey(monthStart), to: dayKey(start) } },
  ]
}

/** 结束日期早于开始日期时视为无效。 */
export function invalidRange(range: DateRange): boolean {
  return Boolean(range.from && range.to && range.to < range.from)
}

/** 月历网格：含上/下月补齐，按周一起始排列。 */
export function monthGrid(anchor: Date, weekStartsOn = 1): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const offset = (first.getDay() - weekStartsOn + 7) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - offset)
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

/** 区间状态：start / end / in-range / outside。 */
export function rangeState(
  range: DateRange,
  day: string,
): 'start' | 'end' | 'in-range' | 'outside' {
  if (range.from && day === range.from) return 'start'
  if (range.to && day === range.to) return 'end'
  if (range.from && range.to && day > range.from && day < range.to) return 'in-range'
  return 'outside'
}

export function rangeLabel(range: DateRange, separator = ' ~ '): string {
  if (!range.from && !range.to) return ''
  return `${range.from ?? ''}${separator}${range.to ?? ''}`
}

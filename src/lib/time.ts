/** 相对时间的纯计算，文案由调用方翻译。 */
export type RelativeUnit = 'now' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

export type RelativeTime = {
  unit: RelativeUnit
  count: number
  future: boolean
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

export function relativeTime(target: Date, now: Date = new Date()): RelativeTime {
  const delta = target.getTime() - now.getTime()
  const distance = Math.abs(delta)
  const future = delta > 0
  if (!Number.isFinite(distance)) return { unit: 'now', count: 0, future: false }
  if (distance < 30_000) return { unit: 'now', count: 0, future }
  if (distance < HOUR) return { unit: 'minute', count: Math.floor(distance / MINUTE), future }
  if (distance < DAY) return { unit: 'hour', count: Math.floor(distance / HOUR), future }
  if (distance < WEEK) return { unit: 'day', count: Math.floor(distance / DAY), future }
  if (distance < MONTH) return { unit: 'week', count: Math.floor(distance / WEEK), future }
  if (distance < YEAR) return { unit: 'month', count: Math.floor(distance / MONTH), future }
  return { unit: 'year', count: Math.floor(distance / YEAR), future }
}

/** 绝对时间，作为相对时间的 title 与详情展示。 */
export function formatDateTime(value: Date, locale = 'zh-CN') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

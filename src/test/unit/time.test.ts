import { describe, expect, it } from 'vitest'
import { formatDateTime, relativeTime } from '@/lib/time'

const now = new Date('2026-09-16T10:00:00+08:00')
const at = (value: string) => new Date(`2026-09-16T${value}+08:00`)

describe('相对时间', () => {
  it('30 秒内显示刚刚', () => {
    expect(relativeTime(at('09:59:45'), now)).toEqual({ unit: 'now', count: 0, future: false })
    expect(relativeTime(at('10:00:10'), now)).toEqual({ unit: 'now', count: 0, future: true })
  })

  it('分钟、小时、天、周、月、年按阈值降级', () => {
    expect(relativeTime(at('09:35:00'), now)).toMatchObject({ unit: 'minute', count: 25 })
    expect(relativeTime(at('07:00:00'), now)).toMatchObject({ unit: 'hour', count: 3 })
    expect(relativeTime(new Date('2026-09-13T10:00:00+08:00'), now)).toMatchObject({
      unit: 'day',
      count: 3,
    })
    expect(relativeTime(new Date('2026-09-01T10:00:00+08:00'), now)).toMatchObject({
      unit: 'week',
      count: 2,
    })
    expect(relativeTime(new Date('2026-05-16T10:00:00+08:00'), now)).toMatchObject({
      unit: 'month',
      count: 4,
    })
    expect(relativeTime(new Date('2024-09-16T10:00:00+08:00'), now)).toMatchObject({
      unit: 'year',
      count: 2,
    })
  })

  it('未来时间标记 future', () => {
    expect(relativeTime(at('11:30:00'), now)).toMatchObject({ unit: 'hour', future: true })
    expect(relativeTime(new Date('2026-09-20T10:00:00+08:00'), now)).toMatchObject({
      unit: 'day',
      future: true,
    })
  })

  it('绝对时间按语言格式化', () => {
    expect(formatDateTime(now, 'zh-CN')).toContain('2026')
    expect(formatDateTime(now, 'en')).toMatch(/2026/)
  })
})

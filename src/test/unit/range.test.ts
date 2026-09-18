import { describe, expect, it } from 'vitest'
import { dayKey, invalidRange, monthGrid, rangeShortcuts, rangeState } from '@/lib/range'

describe('日期范围', () => {
  it('月历网格固定 42 天且覆盖整月', () => {
    const days = monthGrid(new Date('2026-09-16T00:00:00'))
    expect(days).toHaveLength(42)
    expect(days[0]?.getDay()).toBe(1)
    expect(days.some((day) => dayKey(day) === '2026-09-01')).toBe(true)
    expect(days.some((day) => dayKey(day) === '2026-09-30')).toBe(true)
  })

  it('区间状态区分开始、结束、区间内与外部', () => {
    const range = { from: '2026-09-10', to: '2026-09-20' }
    expect(rangeState(range, '2026-09-10')).toBe('start')
    expect(rangeState(range, '2026-09-20')).toBe('end')
    expect(rangeState(range, '2026-09-15')).toBe('in-range')
    expect(rangeState(range, '2026-09-21')).toBe('outside')
  })

  it('快捷区间与非法区间判断', () => {
    const shortcuts = rangeShortcuts(new Date('2026-09-16T10:00:00'))
    expect(shortcuts.map((item) => item.key)).toEqual(['today', 'week', 'month', 'monthStart'])
    expect(shortcuts[0]?.range).toEqual({ from: '2026-09-16', to: '2026-09-16' })
    expect(shortcuts[1]?.range.from).toBe('2026-09-10')
    expect(invalidRange({ from: '2026-09-10', to: '2026-09-01' })).toBe(true)
    expect(invalidRange({ from: '2026-09-01', to: '2026-09-10' })).toBe(false)
    expect(invalidRange({ from: '2026-09-01' })).toBe(false)
  })
})

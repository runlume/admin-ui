import { describe, expect, it } from 'vitest'
import {
  formatNumber,
  sparklinePath,
  sparklinePoints,
  trendDirection,
  trendPercent,
} from '@/lib/metrics'

describe('指标格式化与趋势', () => {
  it('按千分位、小数与前后缀输出', () => {
    expect(formatNumber(12480)).toBe('12,480')
    expect(formatNumber(12.345, { decimals: 2, prefix: '¥ ' })).toBe('¥ 12.35')
    expect(formatNumber(1200, { separator: ' ' })).toBe('1 200')
    expect(formatNumber(100, { separator: '', suffix: '%' })).toBe('100%')
  })

  it('趋势线取点把最小最大值映射到高度内', () => {
    const points = sparklinePoints([0, 5, 10], 100, 20)
    expect(points).toHaveLength(3)
    expect(points[0]).toEqual({ x: 2, y: 18 })
    expect(points[1]?.y).toBeCloseTo(10)
    expect(points[2]).toEqual({ x: 98, y: 2 })
    expect(sparklinePoints([], 100, 20)).toEqual([])
    expect(sparklinePoints([3], 100, 20)).toEqual([{ x: 2, y: 10 }])
  })

  it('折线路径支持平滑曲线', () => {
    const points = sparklinePoints([0, 10, 5, 8], 60, 20)
    expect(sparklinePath(points)).toMatch(/^M2 18 L/)
    expect(sparklinePath(points, true)).toContain('C')
    expect(sparklinePath([])).toBe('')
  })

  it('涨跌方向与百分比变化', () => {
    expect(trendDirection([1, 2])).toBe('up')
    expect(trendDirection([2, 1])).toBe('down')
    expect(trendDirection([2, 2])).toBe('flat')
    expect(trendDirection([2])).toBe('flat')
    expect(trendPercent(120, 100)).toBeCloseTo(20)
    expect(trendPercent(80, 100)).toBeCloseTo(-20)
    expect(trendPercent(10, 0)).toBeUndefined()
  })
})

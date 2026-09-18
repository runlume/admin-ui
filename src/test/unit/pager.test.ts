import { describe, expect, it } from 'vitest'
import { pagerItems, parsePageInput } from '@/lib/pager'

describe('页码分页器', () => {
  it('页数不超过可见窗口时不出现省略号', () => {
    expect(pagerItems(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pagerItems(3, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('页数很多时首尾固定并省略中间', () => {
    expect(pagerItems(1, 12)).toEqual([1, 2, null, 12])
    expect(pagerItems(6, 12)).toEqual([1, null, 5, 6, 7, null, 12])
    expect(pagerItems(12, 12)).toEqual([1, null, 11, 12])
  })

  it('越界页码与空值回落到有效范围', () => {
    expect(pagerItems(0, 3)).toEqual([1, 2, 3])
    expect(pagerItems(9, 3)).toEqual([1, 2, 3])
    expect(pagerItems(1, 0)).toEqual([1])
  })

  it('跳页输入只接受范围内的整数', () => {
    expect(parsePageInput('3', 10)).toBe(3)
    expect(parsePageInput(' 7 ', 10)).toBe(7)
    expect(parsePageInput('0', 10)).toBeUndefined()
    expect(parsePageInput('11', 10)).toBeUndefined()
    expect(parsePageInput('abc', 10)).toBeUndefined()
    expect(parsePageInput('2.5', 10)).toBeUndefined()
  })
})

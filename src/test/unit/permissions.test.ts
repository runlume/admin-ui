import { describe, expect, it } from 'vitest'
import { filterByPermission, matchPermission, matchPermissions } from '@/lib/permissions'

describe('权限码判定', () => {
  it('精确匹配', () => {
    expect(matchPermission(['customer:view'], 'customer:view')).toBe(true)
    expect(matchPermission(['customer:view'], 'customer:create')).toBe(false)
    expect(matchPermission([], 'customer:view')).toBe(false)
  })

  it('支持全量与模块通配', () => {
    expect(matchPermission(['*'], 'anything:at-all')).toBe(true)
    expect(matchPermission(['report:*'], 'report:view')).toBe(true)
    expect(matchPermission(['report:*'], 'report:export.csv')).toBe(true)
    // 通配只覆盖本模块，不越界
    expect(matchPermission(['report:*'], 'customer:view')).toBe(false)
  })

  it('多个权限默认任一满足，可切换为全部满足', () => {
    const required = ['customer:view', 'customer:export']
    expect(matchPermissions(['customer:view'], required)).toBe(true)
    expect(matchPermissions(['customer:view'], required, 'all')).toBe(false)
    expect(matchPermissions(['customer:*'], required, 'all')).toBe(true)
  })

  it('未声明权限视为公开', () => {
    expect(matchPermissions([], undefined)).toBe(true)
    expect(matchPermissions([], [])).toBe(true)
  })

  it('按权限过滤列表时保留未声明权限的条目', () => {
    const items = [
      { id: 'a' },
      { id: 'b', permission: 'report:view' },
      { id: 'c', permission: 'audit:view' },
    ]
    expect(filterByPermission(items, ['report:view']).map((item) => item.id)).toEqual(['a', 'b'])
    expect(filterByPermission(items, ['*']).map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })
})

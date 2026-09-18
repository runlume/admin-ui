import { describe, expect, it } from 'vitest'
import { safeRedirect } from '@/lib/redirect'

describe('safeRedirect', () => {
  it('站内路径原样返回，保留查询串', () => {
    expect(safeRedirect('/design-system')).toBe('/design-system')
    expect(safeRedirect('/customers?page=2')).toBe('/customers?page=2')
  })

  it('没带目标时回工作台', () => {
    expect(safeRedirect(null)).toBe('/')
    expect(safeRedirect(undefined)).toBe('/')
    expect(safeRedirect('')).toBe('/')
    expect(safeRedirect('   ')).toBe('/')
  })

  it('挡掉站外目标，避免登录页变成开放重定向', () => {
    expect(safeRedirect('https://evil.example')).toBe('/')
    expect(safeRedirect('//evil.example')).toBe('/')
    expect(safeRedirect('/\\evil.example')).toBe('/')
    expect(safeRedirect('design-system')).toBe('/')
  })
})

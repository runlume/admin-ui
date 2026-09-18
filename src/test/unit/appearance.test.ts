import { describe, expect, it } from 'vitest'
import {
  headerActionIds,
  resolveHeaderActions,
  resolvePalette,
  resolveTheme,
} from '@/lib/appearance'
import { resolveAccessibility } from '@/lib/accessibility'

describe('appearance 偏好解析', () => {
  it('未知主题方案回落到默认青绿', () => {
    expect(resolvePalette('magenta')).toBe('teal')
    expect(resolvePalette('custom')).toBe('custom')
    expect(resolvePalette('blue')).toBe('blue')
  })

  it('跟随系统按系统偏好解析深浅', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
  })

  it('越界的无障碍偏好回落到默认值', () => {
    expect(resolveAccessibility({ fontScale: 999, fontWeight: 'heavy' })).toMatchObject({
      fontScale: 100,
      fontWeight: 'default',
    })
    expect(resolveAccessibility({ highContrast: true }).highContrast).toBe(true)
  })

  it('合并旧快捷操作偏好时把新增入口插回默认位置', () => {
    const current = headerActionIds.map((id) => ({ id, visible: true }))
    // 旧偏好里没有 notifications，且用户把 reload 排在了 search 前面。
    const saved = [
      { id: 'reload' as const, visible: true },
      { id: 'search' as const, visible: false },
      { id: 'fullscreen' as const, visible: true },
    ]
    const merged = resolveHeaderActions(saved, current)
    expect(merged.map((action) => action.id)).toEqual([
      'reload',
      'search',
      'notifications',
      'fullscreen',
      'language',
      'theme',
      // 新增的入口（github）按默认位置补在最后，老用户也不会丢
      'github',
    ])
    expect(merged.find((action) => action.id === 'notifications')?.visible).toBe(true)
    expect(merged.find((action) => action.id === 'search')?.visible).toBe(false)
    expect(resolveHeaderActions(undefined, current)).toEqual(current)
    expect(resolveHeaderActions([], current)).toEqual(current)
  })
})

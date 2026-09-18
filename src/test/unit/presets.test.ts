import { describe, expect, it } from 'vitest'
import {
  describePresetValue,
  presetNameTaken,
  renamePreset,
  upsertPreset,
  type Preset,
} from '@/lib/presets'

const presets: Preset<{ keyword: string }>[] = [
  { name: '本周待处理', value: { keyword: '待处理' } },
  { name: '本月全部', value: { keyword: '' } },
]

describe('预设名称唯一性', () => {
  it('已存在的名称算占用，空名称不算', () => {
    expect(presetNameTaken(presets, '本周待处理')).toBe(true)
    expect(presetNameTaken(presets, '  本周待处理  ')).toBe(true)
    expect(presetNameTaken(presets, '新的名字')).toBe(false)
    expect(presetNameTaken(presets, '   ')).toBe(false)
  })

  it('重命名时忽略自己', () => {
    expect(presetNameTaken(presets, '本周待处理', '本周待处理')).toBe(false)
    expect(presetNameTaken(presets, '本月全部', '本周待处理')).toBe(true)
  })

  it('同名覆盖只保留一条，且排到最前', () => {
    const next = upsertPreset(presets, { name: '本周待处理', value: { keyword: '更新' } })
    expect(next).toHaveLength(2)
    expect(next[0]).toEqual({ name: '本周待处理', value: { keyword: '更新' } })
  })

  it('重命名撞名时保持原样', () => {
    expect(renamePreset(presets, '本周待处理', '本月全部')).toBe(presets)
    expect(renamePreset(presets, '本周待处理', '新名字')[0]?.name).toBe('新名字')
  })
})

describe('预设摘要', () => {
  it('拼成一行可读文案，跳过空值', () => {
    expect(
      describePresetValue(
        {
          keyword: '云和',
          statuses: ['ACTIVE', 'PENDING'],
          range: { from: '2026-09-01', to: '2026-09-16' },
        },
        200,
      ),
    ).toBe('keyword: 云和 · statuses: ACTIVE/PENDING · range: from: 2026-09-01 · to: 2026-09-16')
    expect(describePresetValue({ keyword: '', statuses: [], range: {} })).toBe('')
    expect(describePresetValue(null)).toBe('')
  })

  it('超长时截断，避免撑破列表', () => {
    const text = describePresetValue({ keyword: 'x'.repeat(200) }, 20)
    expect(text.endsWith('…')).toBe(true)
    expect(text.length).toBe(21)
  })
})

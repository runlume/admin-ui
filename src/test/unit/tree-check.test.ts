import { describe, expect, it } from 'vitest'
import {
  ancestorIds,
  checkState,
  childIds,
  subtreeIds,
  toggleChecked,
  type TreeNode,
} from '@/lib/tree'

type Unit = { name: string }

const nodes: TreeNode<Unit>[] = [
  { id: 'a', parentId: null, sortOrder: 1, data: { name: 'A' } },
  { id: 'a1', parentId: 'a', sortOrder: 1, data: { name: 'A1' } },
  { id: 'a1x', parentId: 'a1', sortOrder: 1, data: { name: 'A1X' } },
  { id: 'a1y', parentId: 'a1', sortOrder: 2, data: { name: 'A1Y' } },
  { id: 'a2', parentId: 'a', sortOrder: 2, data: { name: 'A2' } },
  { id: 'b', parentId: null, sortOrder: 2, data: { name: 'B' } },
]

describe('树的勾选', () => {
  it('子节点、后代与祖先按层级顺序返回', () => {
    expect(childIds(nodes, 'a')).toEqual(['a1', 'a2'])
    expect(subtreeIds(nodes, 'a1')).toEqual(['a1', 'a1x', 'a1y'])
    expect(ancestorIds(nodes, 'a1x')).toEqual(['a1', 'a'])
    expect(subtreeIds(nodes, 'b')).toEqual(['b'])
  })

  it('勾选父节点会级联勾选全部后代', () => {
    const checked = toggleChecked(nodes, new Set(), 'a', true)
    expect([...checked].sort()).toEqual(['a', 'a1', 'a1x', 'a1y', 'a2'])
  })

  it('取消父节点会清空后代', () => {
    const checked = toggleChecked(nodes, new Set(subtreeIds(nodes, 'a')), 'a1', false)
    expect([...checked].sort()).toEqual(['a2'])
  })

  it('子节点全选后父节点自动勾选', () => {
    let checked = toggleChecked(nodes, new Set(), 'a1x', true)
    expect(checkState(nodes, checked, 'a1')).toBe('indeterminate')
    // 孙节点被勾选时，祖父同样要显示半选，而不是未勾选
    expect(checkState(nodes, checked, 'a')).toBe('indeterminate')
    checked = toggleChecked(nodes, checked, 'a1y', true)
    expect([...checked].sort()).toEqual(['a1', 'a1x', 'a1y'])
    expect(checkState(nodes, checked, 'a')).toBe('indeterminate')
    checked = toggleChecked(nodes, checked, 'a2', true)
    expect([...checked].sort()).toEqual(['a', 'a1', 'a1x', 'a1y', 'a2'])
    expect(checkState(nodes, checked, 'a')).toBe('checked')
  })

  it('未勾选且没有已勾选后代时为未勾选', () => {
    expect(checkState(nodes, new Set(), 'a1')).toBe('unchecked')
    expect(checkState(nodes, new Set(['b']), 'a')).toBe('unchecked')
  })
})

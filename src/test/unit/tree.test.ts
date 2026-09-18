import { describe, expect, it } from 'vitest'
import { flattenTree, type TreeNode } from '@/lib/tree'

type Unit = { name: string }

const nodes: TreeNode<Unit>[] = [
  { id: 'b', parentId: null, sortOrder: 2, data: { name: '海通供应链' } },
  { id: 'a', parentId: null, sortOrder: 1, data: { name: '云和智能制造' } },
  { id: 'a2', parentId: 'a', sortOrder: 2, data: { name: '销售中心' } },
  { id: 'a1', parentId: 'a', sortOrder: 1, data: { name: '研发中心' } },
  { id: 'a1x', parentId: 'a1', sortOrder: 1, data: { name: '平台组' } },
  { id: 'orphan', parentId: 'missing', sortOrder: 9, data: { name: '游离节点' } },
]

describe('flattenTree', () => {
  it('根节点按 sortOrder 排列，折叠时不下钻', () => {
    const rows = flattenTree(nodes, new Set())
    expect(rows.map((row) => row.node.id)).toEqual(['a', 'b', 'orphan'])
    expect(rows.every((row) => row.depth === 0)).toBe(true)
    expect(rows[0]).toMatchObject({ hasChildren: true, expanded: false })
  })

  it('展开后按层级输出并带上深度', () => {
    const rows = flattenTree(nodes, new Set(['a', 'a1']))
    expect(rows.map((row) => [row.node.id, row.depth, row.expanded])).toEqual([
      ['a', 0, true],
      ['a1', 1, true],
      ['a1x', 2, false],
      ['a2', 1, false],
      ['b', 0, false],
      ['orphan', 0, false],
    ])
  })

  it('父节点不存在或成环时按根节点处理且不重复输出', () => {
    const cyclic: TreeNode<Unit>[] = [
      { id: 'x', parentId: 'y', data: { name: 'X' } },
      { id: 'y', parentId: 'x', data: { name: 'Y' } },
    ]
    const rows = flattenTree(cyclic, new Set(['x', 'y']))
    const ids = rows.map((row) => row.node.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('x')
    expect(ids).toContain('y')
  })
})

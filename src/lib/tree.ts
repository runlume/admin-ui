/**
 * 层级数据的通用工具。节点用 `parentId` 表达父子关系，顺序按 `sortOrder`
 * 再按 id 排列；`flattenTree` 只展开 `expanded` 中的节点，供列表树与表格树共用。
 */
export type TreeNode<T> = {
  id: string
  /** 根节点传 `null`；指向不存在的父节点时按根节点处理。 */
  parentId?: string | null
  sortOrder?: number
  data: T
}

export type FlatTreeRow<T> = {
  node: TreeNode<T>
  depth: number
  hasChildren: boolean
  expanded: boolean
}

/** 同级顺序：先按 `sortOrder`，再按 id，保证渲染与勾选级联顺序一致。 */
export function sortNodes<T>(items: TreeNode<T>[]): TreeNode<T>[] {
  return [...items].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id.localeCompare(b.id),
  )
}

export function flattenTree<T>(
  nodes: TreeNode<T>[],
  expanded: ReadonlySet<string>,
): FlatTreeRow<T>[] {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const children = new Map<string, TreeNode<T>[]>()
  const roots: TreeNode<T>[] = []
  for (const node of byId.values()) {
    if (node.parentId && node.parentId !== node.id && byId.has(node.parentId)) {
      children.set(node.parentId, [...(children.get(node.parentId) ?? []), node])
    } else {
      roots.push(node)
    }
  }
  // 数据成环时没有任何根节点，按全部节点兜底，避免整棵树被静默丢弃。
  if (!roots.length && byId.size) roots.push(...byId.values())
  const rows: FlatTreeRow<T>[] = []
  const visited = new Set<string>()
  function visit(node: TreeNode<T>, depth: number) {
    if (visited.has(node.id)) return
    visited.add(node.id)
    const nested = children.get(node.id) ?? []
    rows.push({ node, depth, hasChildren: nested.length > 0, expanded: expanded.has(node.id) })
    if (expanded.has(node.id)) sortNodes(nested).forEach((child) => visit(child, depth + 1))
  }
  sortNodes(roots).forEach((root) => visit(root, 0))
  return rows
}

function childMap<T>(nodes: TreeNode<T>[]) {
  const children = new Map<string, TreeNode<T>[]>()
  const known = new Set(nodes.map((node) => node.id))
  for (const node of nodes) {
    if (!node.parentId || node.parentId === node.id || !known.has(node.parentId)) continue
    children.set(node.parentId, [...(children.get(node.parentId) ?? []), node])
  }
  for (const [id, items] of children) children.set(id, sortNodes(items))
  return children
}

/** 直接子节点 id，按同级顺序。 */
export function childIds<T>(nodes: TreeNode<T>[], id: string): string[] {
  return (childMap(nodes).get(id) ?? []).map((node) => node.id)
}

/** 节点自身与全部后代 id，用于勾选父节点时级联子节点。 */
export function subtreeIds<T>(nodes: TreeNode<T>[], id: string): string[] {
  const children = childMap(nodes)
  const collected: string[] = []
  const visited = new Set<string>()
  function visit(current: string) {
    if (visited.has(current)) return
    visited.add(current)
    collected.push(current)
    ;(children.get(current) ?? []).forEach((node) => visit(node.id))
  }
  visit(id)
  return collected
}

/** 从直接父节点到根的 id 顺序。 */
export function ancestorIds<T>(nodes: TreeNode<T>[], id: string): string[] {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const collected: string[] = []
  const visited = new Set<string>([id])
  let parent = byId.get(id)?.parentId
  while (parent && byId.has(parent) && !visited.has(parent)) {
    visited.add(parent)
    collected.push(parent)
    parent = byId.get(parent)?.parentId
  }
  return collected
}

/**
 * 勾选态：自身被勾选为 checked；自身未勾选但存在被勾选的后代（含孙子）为
 * indeterminate。半选要按"全部后代"判断，只看向下一层会让祖父显示成未勾选。
 */
export function checkState<T>(
  nodes: TreeNode<T>[],
  checked: ReadonlySet<string>,
  id: string,
): 'checked' | 'indeterminate' | 'unchecked' {
  if (checked.has(id)) return 'checked'
  const descendants = subtreeIds(nodes, id).slice(1)
  return descendants.some((item) => checked.has(item)) ? 'indeterminate' : 'unchecked'
}

/**
 * 勾选某个节点后的完整勾选集合：向下级联子树，向上让"子节点全选"的父节点自动勾选，
 * 否则取消父节点（半选由 `checkState` 推导）。
 */
export function toggleChecked<T>(
  nodes: TreeNode<T>[],
  checked: ReadonlySet<string>,
  id: string,
  next: boolean,
): Set<string> {
  const result = new Set(checked)
  for (const item of subtreeIds(nodes, id)) {
    if (next) result.add(item)
    else result.delete(item)
  }
  for (const ancestor of ancestorIds(nodes, id)) {
    const children = childIds(nodes, ancestor)
    if (children.length && children.every((child) => result.has(child))) result.add(ancestor)
    else result.delete(ancestor)
  }
  return result
}

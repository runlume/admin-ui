import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronRight, ListTree, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  checkState,
  flattenTree,
  subtreeIds,
  toggleChecked,
  type FlatTreeRow,
  type TreeNode,
} from '@/lib/tree'
import { Checkbox } from './ui/checkbox'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import { Input } from './ui/input'
import { cn } from '@/lib/utils'

export type TreeItem = {
  label: string
  description?: string
  disabled?: boolean
}

/**
 * 列表树：层级缩进 + 可选虚线层级线，行本身即选中项，不在行首放其他控件。
 * ↑/↓ 在可见节点间移动，→ 展开或进入子节点，← 收起或回到父节点，Enter/空格 选中。
 */
export function Tree({
  nodes,
  label,
  defaultExpanded = [],
  defaultSelected,
  guides = true,
  filterable = false,
  showExpandControls = false,
  checkable = false,
  defaultChecked = [],
  onCheckedChange,
  filterPlaceholder,
  onMove,
  loadChildren,
  virtual,
  className,
}: {
  nodes: TreeNode<TreeItem>[]
  /** 树的访问名称，同时用于展开/收起按钮的提示。 */
  label: string
  defaultExpanded?: string[]
  defaultSelected?: string
  /** 是否显示层级虚线；层级缩进始终保留。 */
  guides?: boolean
  /** 显示节点搜索框；命中节点会自动展开其祖先。 */
  filterable?: boolean
  /** 显示展开全部 / 收起全部按钮。 */
  showExpandControls?: boolean
  /** 开启后每行带勾选框：父节点级联子节点，子节点全选后父节点自动勾选。 */
  checkable?: boolean
  defaultChecked?: string[]
  onCheckedChange?: (ids: string[]) => void
  filterPlaceholder?: string
  /** 拖拽排序：把 source 拖到 target 之后（target 为空表示成为根节点）。 */
  onMove?: (sourceId: string, targetId: string | undefined) => void
  /** 懒加载：节点首次展开时回调，业务把子节点补进 nodes。 */
  loadChildren?: (id: string) => void
  /** 节点超过 200 时启用窗口化渲染，只渲染可视区域。 */
  virtual?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded))
  const [selected, setSelected] = useState(defaultSelected)
  const [focused, setFocused] = useState(defaultSelected ?? nodes[0]?.id)
  const [query, setQuery] = useState('')
  const [dragId, setDragId] = useState<string>()
  const [dropTargetId, setDropTargetId] = useState<string>()
  const longPress = useRef(0)
  const scroll = useRef<HTMLDivElement>(null)
  const [range, setRange] = useState({ start: 0, end: 40 })
  const [loadingIds, setLoadingIds] = useState<Set<string>>(() => new Set())
  const [checked, setChecked] = useState(() => new Set(defaultChecked))
  const items = useRef(new Map<string, HTMLDivElement>())
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return { nodes, matched: new Set<string>(), autoExpand: new Set<string>() }
    const matched = new Set<string>()
    const autoExpand = new Set<string>()
    const byId = new Map(nodes.map((node) => [node.id, node]))
    for (const node of nodes) {
      if (!node.data.label.toLowerCase().includes(keyword)) continue
      matched.add(node.id)
      let parent = node.parentId
      while (parent && byId.has(parent)) {
        autoExpand.add(parent)
        parent = byId.get(parent)?.parentId
      }
    }
    return {
      nodes: nodes.filter((node) => matched.has(node.id) || autoExpand.has(node.id)),
      matched,
      autoExpand,
    }
  }, [nodes, query])
  const rows = flattenTree(
    filtered.nodes,
    query ? new Set([...expanded, ...filtered.autoExpand]) : expanded,
  )
  const visibleIds = rows.map((row) => row.node.id)
  const allIds = nodes.map((node) => node.id)
  const checkableIds = filtered.nodes.map((node) => node.id)

  function toggleCheck(id: string) {
    const next = !checked.has(id)
    const result = toggleChecked(nodes, checked, id, next)
    setChecked(result)
    onCheckedChange?.([...result])
  }

  function move(id: string | undefined) {
    if (!id) return
    setFocused(id)
    items.current.get(id)?.focus()
  }
  function toggle(row: FlatTreeRow<TreeItem>) {
    if (!row.expanded && row.hasChildren === false && loadChildren) {
      setLoadingIds((current) => new Set(current).add(row.node.id))
      loadChildren(row.node.id)
      window.setTimeout(
        () =>
          setLoadingIds((current) => {
            const next = new Set(current)
            next.delete(row.node.id)
            return next
          }),
        600,
      )
    }
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(row.node.id)) next.delete(row.node.id)
      else next.add(row.node.id)
      return next
    })
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>, row: FlatTreeRow<TreeItem>) {
    const index = visibleIds.indexOf(row.node.id)
    const parent = rows.find((item) => item.node.id === row.node.parentId)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      move(visibleIds[Math.min(index + 1, visibleIds.length - 1)])
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      move(visibleIds[Math.max(index - 1, 0)])
    } else if (event.key === 'Home') {
      event.preventDefault()
      move(visibleIds[0])
    } else if (event.key === 'End') {
      event.preventDefault()
      move(visibleIds.at(-1))
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      if (row.hasChildren && !row.expanded) toggle(row)
      else if (row.hasChildren) move(visibleIds[index + 1])
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      if (row.expanded) toggle(row)
      else move(parent?.node.id)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!row.node.data.disabled) setSelected(row.node.id)
    }
  }

  const controls = (filterable || showExpandControls) && (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      {filterable && (
        <div className="relative min-w-40 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label={t('filterNodes')}
            value={query}
            placeholder={filterPlaceholder ?? t('filterNodes')}
            className="h-8 pl-8"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      )}
      {showExpandControls && (
        <div className="flex items-center gap-1">
          {checkable && (
            <label className="flex items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
              <Checkbox
                aria-label={t('tree.selectAll')}
                checked={checkableIds.length > 0 && checkableIds.every((id) => checked.has(id))}
                indeterminate={
                  checkableIds.some((id) => checked.has(id)) &&
                  !checkableIds.every((id) => checked.has(id))
                }
                onCheckedChange={(value) => {
                  const next = new Set(checked)
                  for (const id of checkableIds) {
                    if (value) next.add(id)
                    else next.delete(id)
                  }
                  setChecked(next)
                  onCheckedChange?.([...next])
                }}
              />
              {t('tree.selected', { count: checked.size })}
            </label>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setExpanded(new Set(allIds))}
          >
            <ListTree aria-hidden="true" />
            {t('expandAll')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(new Set())}>
            {t('collapseAll')}
          </Button>
        </div>
      )}
    </div>
  )

  if (!nodes.length)
    return (
      <p className={cn('rounded-xl border bg-card p-4 text-sm text-muted-foreground', className)}>
        {t('tree.empty')}
      </p>
    )

  return (
    <div className={cn('rounded-xl border bg-card p-2 text-sm', className)}>
      {controls}
      <div
        ref={scroll}
        role="tree"
        aria-label={label}
        className={virtual ? 'max-h-96 overflow-y-auto' : undefined}
        onScroll={(event) => {
          if (!virtual) return
          const offset = Math.floor(event.currentTarget.scrollTop / 36)
          setRange({ start: Math.max(0, offset - 8), end: offset + 40 })
        }}
      >
        {rows.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t('filterEmpty')}</p>
        )}
        {(virtual && rows.length > 200 ? rows.slice(range.start, range.end) : rows).map((row) => {
          const item = row.node.data
          return (
            <div
              key={row.node.id}
              role="treeitem"
              aria-level={row.depth + 1}
              aria-expanded={row.hasChildren ? row.expanded : undefined}
              aria-selected={selected === row.node.id}
              aria-checked={
                checkable
                  ? checked.has(row.node.id)
                    ? true
                    : checkState(nodes, checked, row.node.id) === 'indeterminate'
                      ? 'mixed'
                      : false
                  : undefined
              }
              aria-disabled={item.disabled || undefined}
              data-depth={row.depth}
              tabIndex={focused === row.node.id ? 0 : -1}
              ref={(node) => {
                if (node) items.current.set(row.node.id, node)
                else items.current.delete(row.node.id)
              }}
              className={cn(
                'relative flex min-h-9 cursor-pointer items-center gap-2 rounded-md pr-2 outline-none',
                'hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/40',
                selected === row.node.id && 'bg-primary/8 text-primary',
                item.disabled && 'pointer-events-none opacity-50',
                dropTargetId === row.node.id && 'ring-2 ring-primary/50',
              )}
              style={{ paddingInlineStart: row.depth * 20 }}
              draggable={Boolean(onMove)}
              onDragStart={() => setDragId(row.node.id)}
              onDragOver={(event) => {
                if (!onMove || !dragId || dragId === row.node.id) return
                // 不允许把节点拖到自己的后代上（会造成环）。
                if (subtreeIds(nodes, dragId).includes(row.node.id)) return
                event.preventDefault()
                setDropTargetId(row.node.id)
              }}
              onDragLeave={() =>
                setDropTargetId((value) => (value === row.node.id ? undefined : value))
              }
              onDrop={(event) => {
                if (!onMove || !dragId || dragId === row.node.id) return
                event.preventDefault()
                if (!subtreeIds(nodes, dragId).includes(row.node.id)) onMove(dragId, row.node.id)
                setDragId(undefined)
                setDropTargetId(undefined)
              }}
              onTouchStart={() => {
                // 触摸端长按 400ms 后才允许拖动，避免与滚动冲突。
                if (!onMove) return
                longPress.current = window.setTimeout(() => setDragId(row.node.id), 400)
              }}
              onTouchEnd={() => window.clearTimeout(longPress.current)}
              onTouchMove={() => window.clearTimeout(longPress.current)}
              onClick={() => {
                setFocused(row.node.id)
                setSelected(row.node.id)
              }}
              onKeyDown={(event) => onKeyDown(event, row)}
            >
              {guides &&
                row.depth > 0 &&
                Array.from({ length: row.depth }, (_, level) => (
                  <span
                    key={level}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 border-l border-dashed border-border"
                    style={{ insetInlineStart: level * 20 + 14 }}
                  />
                ))}
              {checkable && (
                <Checkbox
                  className="mr-0.5"
                  aria-label={t('tree.select', { name: item.label })}
                  checked={checked.has(row.node.id)}
                  indeterminate={checkState(nodes, checked, row.node.id) === 'indeterminate'}
                  onCheckedChange={() => toggleCheck(row.node.id)}
                />
              )}
              {row.hasChildren ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  tabIndex={-1}
                  aria-label={t(row.expanded ? 'tree.collapse' : 'tree.expand', {
                    name: item.label,
                  })}
                  onClick={(event) => {
                    event.stopPropagation()
                    toggle(row)
                  }}
                >
                  <ChevronRight
                    aria-hidden="true"
                    className={cn('size-4 transition-transform', row.expanded && 'rotate-90')}
                  />
                </Button>
              ) : (
                <span aria-hidden="true" className="size-7 shrink-0" />
              )}
              <span
                className={cn(
                  'min-w-0 flex-1 truncate',
                  filtered.matched.size > 0 && filtered.matched.has(row.node.id) && 'text-primary',
                )}
              >
                {loadingIds.has(row.node.id) && (
                  <Skeleton className="size-3.5 shrink-0 rounded-full" />
                )}
                {item.label}
              </span>
              {item.description && (
                <span className="shrink-0 text-xs text-muted-foreground">{item.description}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

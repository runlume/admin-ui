import { useState, type ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DataTable } from './data-table'
import { Button } from './ui/button'
import { flattenTree, type FlatTreeRow, type TreeNode } from '@/lib/tree'
import { cn } from '@/lib/utils'

export type TreeTableColumn<T> = {
  id: string
  header: string
  /** 固定列宽；省略时由标准表格按可用宽度分配。 */
  width?: number
  /** 第一列的返回值会自动获得层级缩进与展开按钮。 */
  cell: (row: FlatTreeRow<T>) => ReactNode
}

/**
 * 表格树：层级数据复用标准表格，表格样式、列宽拖拽、溢出提示与空态都来自 `DataTable`。
 * 只把父子关系拍平成行，并在第一列补上缩进与展开按钮。
 */
export function TreeTable<T>({
  nodes,
  columns,
  caption,
  rowLabel,
  defaultExpanded = [],
}: {
  nodes: TreeNode<T>[]
  columns: TreeTableColumn<T>[]
  caption: string
  /** 展开/收起按钮的提示文本，通常返回行的名称。 */
  rowLabel: (node: TreeNode<T>) => string
  defaultExpanded?: string[]
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded))
  const rows = flattenTree(nodes, expanded)

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const tableColumns: ColumnDef<FlatTreeRow<T>>[] = columns.map((column, index) => ({
    id: column.id,
    header: column.header,
    size: column.width,
    cell: ({ row }) =>
      index > 0 ? (
        column.cell(row.original)
      ) : (
        <div
          className="flex items-center gap-1"
          style={{ paddingInlineStart: row.original.depth * 20 }}
        >
          {row.original.hasChildren ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              aria-label={t(row.original.expanded ? 'tree.collapse' : 'tree.expand', {
                name: rowLabel(row.original.node),
              })}
              aria-expanded={row.original.expanded}
              onClick={() => toggle(row.original.node.id)}
            >
              <ChevronRight
                aria-hidden="true"
                className={cn('size-4 transition-transform', row.original.expanded && 'rotate-90')}
              />
            </Button>
          ) : (
            <span aria-hidden="true" className="size-7 shrink-0" />
          )}
          <span className="min-w-0 flex-1">{column.cell(row.original)}</span>
        </div>
      ),
  }))

  return <DataTable data={rows} columns={tableColumns} caption={caption} />
}

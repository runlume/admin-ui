import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useUiTranslation } from '../lib/use-ui-translation'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Columns3,
  GripVertical,
  RotateCcw,
} from 'lucide-react'
import { TableToolbar } from './table-toolbar'
import { TableCellOverflow } from './table-cell-overflow'
import { TooltipProvider } from './ui/tooltip'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Fragment } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import {
  readColumnOrder,
  readColumnSizes,
  registerTableReset,
  resetTableLayout,
  type ColumnSizes,
  writeColumnOrder,
  writeColumnSizes,
} from '@/lib/table-prefs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/page'

/** 行内可交互元素：它们自己处理点击，不会顺带触发行点击。 */
const interactiveSelector =
  'a, button, input, select, textarea, label, [role="menuitem"], [role="checkbox"], [role="switch"], [contenteditable="true"]'

const cellPadding = {
  compact: 'px-4 py-2',
  default: 'px-4 py-3',
  relaxed: 'px-4 py-4',
} as const

/**
 * 列显示管理：放进 DataTable 的 toolbar 插槽即可。
 * 与 `columnVisibility` / `onColumnVisibilityChange` 配套使用。
 */
/** 把 source 列移到 target 列的位置：表头与列管理两处拖拽共用。 */
function moveColumnId(order: string[], sourceId: string, targetId: string): string[] {
  const from = order.indexOf(sourceId)
  const to = order.indexOf(targetId)
  if (from < 0 || to < 0 || from === to) return order
  const next = [...order]
  next.splice(from, 1)
  next.splice(to, 0, sourceId)
  return next
}

export function ColumnManager<T>({
  columns,
  visibility,
  onVisibilityChange,
  order,
  onOrderChange,
  pinned,
  storageId,
}: {
  columns: ColumnDef<T>[]
  visibility: VisibilityState
  onVisibilityChange: (state: VisibilityState) => void
  /** 当前列顺序；与 DataTable 传同一个数组即可两边联动 */
  order?: string[]
  onOrderChange?: (order: string[]) => void
  /** 与 DataTable 的 `pinned` 保持一致：固定列不允许拖拽排序 */
  pinned?: { first?: boolean; last?: boolean }
  /** 传入表格的 storageId 后，「恢复默认」会连列宽一起复位。 */
  storageId?: string
}) {
  const { t } = useUiTranslation()
  const [dragging, setDragging] = useState<string>()
  const [dragOver, setDragOver] = useState<string>()
  const allIds = columns
    .map(
      (column) =>
        column.id ??
        ('accessorKey' in column ? String(column.accessorKey) : String(column.header ?? '')),
    )
    .filter(Boolean)
  const current = order?.length ? order : allIds
  /** 固定列必须留在首尾，不允许拖动（与表头保持一致）。 */
  const pinnedFirstId = pinned?.first ? allIds[0] : undefined
  const pinnedLastId = pinned?.last ? allIds[allIds.length - 1] : undefined
  const canDrag = (id: string) =>
    Boolean(onOrderChange) && id !== pinnedFirstId && id !== pinnedLastId
  const items = columns
    .filter((column) => column.id !== 'select' && column.id !== 'actions')
    .map((column) => ({
      id:
        column.id ??
        ('accessorKey' in column ? String(column.accessorKey) : String(column.header ?? '')),
      label:
        typeof column.header === 'string'
          ? column.header
          : (column.id ?? ('accessorKey' in column ? String(column.accessorKey) : '')),
    }))
    .sort((a, b) => current.indexOf(a.id) - current.indexOf(b.id))
  /** 落点在拖拽源的哪一侧：决定高亮画在上边还是下边。 */
  const dropSideOf = (id: string) => {
    if (!dragging || dragging === id) return undefined
    const from = current.indexOf(dragging)
    const to = current.indexOf(id)
    if (from < 0 || to < 0) return undefined
    return from < to ? 'after' : 'before'
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Columns3 aria-hidden="true" />
          {t('columns')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{t('columnsHint')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuCheckboxItem
            key={item.id}
            indicator="trailing"
            draggable={canDrag(item.id)}
            className={cn(
              dragging === item.id && 'opacity-60',
              // 落点高亮：上/下一条 2px 主色边框，指明会插到哪一侧
              dragOver === item.id &&
                dropSideOf(item.id) === 'before' &&
                'shadow-[inset_0_2px_0_0_var(--primary)]',
              dragOver === item.id &&
                dropSideOf(item.id) === 'after' &&
                'shadow-[inset_0_-2px_0_0_var(--primary)]',
            )}
            onDragStart={(event) => {
              if (!canDrag(item.id)) {
                event.preventDefault()
                return
              }
              setDragging(item.id)
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', item.id)
            }}
            onDragOver={(event) => {
              if (dragging && dragging !== item.id && canDrag(item.id)) {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setDragOver(item.id)
              }
            }}
            onDragLeave={() => setDragOver((value) => (value === item.id ? undefined : value))}
            onDrop={(event) => {
              event.preventDefault()
              const source = dragging ?? event.dataTransfer.getData('text/plain')
              if (source && source !== item.id)
                onOrderChange?.(moveColumnId(current, source, item.id))
              setDragging(undefined)
              setDragOver(undefined)
            }}
            onDragEnd={() => {
              setDragging(undefined)
              setDragOver(undefined)
            }}
            checked={visibility[item.id] !== false}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => onVisibilityChange({ ...visibility, [item.id]: checked })}
          >
            {/* 拖拽手柄在最前，勾选框在最后（勾选标记由 indicator="trailing" 放到行尾） */}
            <GripVertical
              aria-hidden="true"
              className="size-3.5 shrink-0 cursor-grab text-muted-foreground/60"
            />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            onVisibilityChange({})
            resetTableLayout(storageId)
          }}
        >
          <RotateCcw aria-hidden="true" />
          {t('columnsReset')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DataTable<T>({
  data,
  columns,
  caption,
  loading,
  emptyTitle,
  emptyDescription,
  footer,
  toolbar,
  striped = true,
  sortable = false,
  defaultSorting = [],
  density = 'default',
  onRowClick,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  columnSizes,
  onColumnSizesChange,
  pinned,
  storageId,
  expandable,
  virtual,
}: {
  data: T[]
  columns: ColumnDef<T>[]
  caption: string
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  footer?: ReactNode
  toolbar?: ReactNode
  striped?: boolean
  /** 开启表头排序：点击表头在升序、降序、取消之间循环。 */
  sortable?: boolean
  defaultSorting?: SortingState
  /** 行高密度；紧凑适合信息密集的运营列表。 */
  density?: 'compact' | 'default' | 'relaxed'
  /**
   * 整行点击，例如进入详情。行内的按钮、链接、复选框、下拉与输入框会自己处理点击，
   * 不会顺带冒泡成行点击 —— 操作列的「详情 / 编辑 / ⋯」因此不会和行点击打架。
   */
  onRowClick?: (row: T) => void
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: (state: VisibilityState) => void
  /** 列顺序（列 id 数组）；不传时用浏览器里保存的顺序，可由表头或列管理拖拽调整。 */
  columnOrder?: string[]
  onColumnOrderChange?: (order: string[]) => void
  /** 列宽（列 id → px）；受控时由调用方保存，未传时只存浏览器。 */
  columnSizes?: ColumnSizes
  onColumnSizesChange?: (sizes: ColumnSizes) => void
  /** 固定列：把第一列固定在左侧、操作列固定在右侧，横向滚动时不跟随。 */
  pinned?: { first?: boolean; last?: boolean }
  /** 传入后把列宽按表名保存在当前浏览器。 */
  storageId?: string
  /** 传入后每行可展开，在行下方渲染详情内容。 */
  expandable?: { content: (row: T) => ReactNode; label?: string }
  /**
   * 大数据量虚拟滚动：只渲染可视窗口内的行，并给出上下占位行。
   * 与行内展开互斥（展开会让行高不固定）。
   */
  virtual?: { height?: number; rowHeight?: number; overscan?: number }
}) {
  const { t } = useUiTranslation()
  const root = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; x: number; width: number } | null>(null)
  const [available, setAvailable] = useState(0)
  const [actionWidth, setActionWidth] = useState(240)
  const [internalSizes, setInternalSizes] = useState<ColumnSizes>(() => readColumnSizes(storageId))
  const sizes = columnSizes ?? internalSizes
  /** 统一成值语义：受控与非受控都接受更新函数。 */
  const setSizes = (next: ColumnSizes | ((current: ColumnSizes) => ColumnSizes)) => {
    const value = typeof next === 'function' ? next(sizes) : next
    ;(onColumnSizesChange ?? setInternalSizes)(value)
  }
  const [internalOrder, setInternalOrder] = useState<string[]>(() => readColumnOrder(storageId))
  /** 拖拽中的列 id：表头与列管理共用，用来做拖拽反馈。 */
  const [draggingId, setDraggingId] = useState<string>()
  /** 当前悬停的落点列：画「会插到这边」的边框高亮。 */
  const [dragOverId, setDragOverId] = useState<string>()
  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => new Set())
  const [scrollTop, setScrollTop] = useState(0)
  const [measuredRowHeight, setMeasuredRowHeight] = useState<number>()
  useEffect(() => {
    writeColumnSizes(storageId, sizes)
  }, [storageId, sizes])
  const order = columnOrder ?? internalOrder
  const setOrder = onColumnOrderChange ?? setInternalOrder
  /** 把保存的顺序与当前列定义对齐：丢掉已删除的列，新列补到末尾。 */
  const columnIds = columns
    .map((column) => column.id ?? ('accessorKey' in column ? String(column.accessorKey) : ''))
    .filter(Boolean)
  const resolvedOrder = [
    ...order.filter((id) => columnIds.includes(id)),
    ...columnIds.filter((id) => !order.includes(id)),
  ]
  // 列定义与 order 都是派生值，按"内容"判断变化：列定义每次渲染都是新数组，
  // 用数组身份当依赖会导致每帧都写一次 localStorage。
  const orderKey = resolvedOrder.join('|')
  useEffect(() => {
    writeColumnOrder(storageId, resolvedOrder)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- 见上方说明：依赖用的是内容快照 orderKey
  }, [storageId, orderKey])
  /** 复位回调里要用最新的 setter，但又不想让注册随每次渲染重建，所以走 ref。 */
  const resetRef = useRef({ setSizes, setOrder })
  useEffect(() => {
    resetRef.current = { setSizes, setOrder }
  })
  useEffect(() => {
    if (!storageId) return
    return registerTableReset(storageId, () => {
      resetRef.current.setSizes({})
      resetRef.current.setOrder([])
    })
  }, [storageId])
  const [sorting, setSorting] = useState<SortingState>(defaultSorting)
  const [visibility, setVisibility] = useState<VisibilityState>({})
  const resolvedVisibility = columnVisibility ?? visibility
  const setVisibilityState = onColumnVisibilityChange ?? setVisibility
  useLayoutEffect(() => {
    const node = root.current
    if (!node) return
    const measure = () => {
      setAvailable(node.clientWidth)
      const actions = Array.from(node.querySelectorAll<HTMLElement>('[data-action-content]'))
      if (actions.length)
        setActionWidth(
          Math.ceil(Math.max(...actions.map((item) => item.getBoundingClientRect().width)) + 32),
        )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    node.querySelectorAll('[data-action-content]').forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [data, columns])
  // Table v8 uses stable mutable callbacks; this component is intentionally not React-Compiler memoized.
  // oxlint-disable-next-line react/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: sortable,
    // 表头连点（Shift + 点击）支持多列排序。
    enableMultiSort: sortable,
    isMultiSortEvent: (event: unknown) =>
      typeof event === 'object' && event !== null && 'shiftKey' in event
        ? Boolean((event as MouseEvent).shiftKey)
        : false,
    state: { sorting, columnVisibility: resolvedVisibility, columnOrder: resolvedOrder },
    onSortingChange: setSorting,
    onColumnOrderChange: (updater) => {
      const next = typeof updater === 'function' ? updater(resolvedOrder) : updater
      setOrder(next)
    },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === 'function' ? updater(resolvedVisibility) : updater
      setVisibilityState(next)
    },
    manualPagination: true,
  })
  const tableRows = table.getRowModel().rows
  const virtualEnabled = Boolean(virtual) && !expandable && tableRows.length > 40
  // 行高优先用实测值，自适应字号/密度变化，而不是写死 45px。
  const rowHeight = virtual?.rowHeight ?? measuredRowHeight ?? 45
  const viewportHeight = virtual?.height ?? 460
  const overscan = virtual?.overscan ?? 6
  const startIndex = virtualEnabled ? Math.max(0, Math.floor(scrollTop / rowHeight) - overscan) : 0
  const endIndex = virtualEnabled
    ? Math.min(tableRows.length, startIndex + Math.ceil(viewportHeight / rowHeight) + overscan * 2)
    : tableRows.length
  const leaves = table.getVisibleLeafColumns()
  const isAction = (id: string) => id === 'actions' || id === 'action'
  const minimum = (id: string) => (isAction(id) ? actionWidth : id === 'select' ? 56 : 96)
  // Read explicit sizes from caller definitions: TanStack merges a default size into every column.
  const explicitSizes = new Map(
    columns
      .filter((column) => column.size !== undefined)
      .map((column) => [
        column.id ??
          ('accessorKey' in column
            ? String(column.accessorKey).replaceAll('.', '_')
            : typeof column.header === 'string'
              ? column.header
              : ''),
        column.size!,
      ]),
  )
  const flexible = leaves.filter(
    (column) =>
      sizes[column.id] === undefined &&
      !isAction(column.id) &&
      column.id !== 'select' &&
      !explicitSizes.has(column.id),
  )
  const fixed = leaves
    .filter((column) => !flexible.includes(column))
    .reduce(
      (sum, column) =>
        sum +
        Math.max(
          minimum(column.id),
          sizes[column.id] ?? explicitSizes.get(column.id) ?? minimum(column.id),
        ),
      0,
    )
  const widths = Object.fromEntries(
    leaves.map((column) => [
      column.id,
      flexible.includes(column)
        ? Math.max(minimum(column.id), (available - fixed) / flexible.length)
        : Math.max(
            minimum(column.id),
            sizes[column.id] ?? explicitSizes.get(column.id) ?? minimum(column.id),
          ),
    ]),
  )
  const allocated = Object.values(widths).reduce((sum, width) => sum + width, 0)
  if (allocated < available) {
    const expandable = leaves.filter((column) => !isAction(column.id) && column.id !== 'select')
    const recipients = expandable.length ? expandable : leaves
    for (const column of recipients)
      widths[column.id] = (widths[column.id] ?? 0) + (available - allocated) / recipients.length
  }
  const total = Object.values(widths).reduce((sum, width) => sum + width, 0)
  function resize(id: string, width: number, max: number) {
    setSizes((current) => ({ ...current, [id]: Math.min(max, Math.max(minimum(id), width)) }))
  }
  const hasSelection = columns.some((column) => column.id === 'select')
  const pinFirst = pinned?.first ? columns[0] : undefined
  const pinLast = pinned?.last ? columns[columns.length - 1] : undefined
  const pinnedId = (column: ColumnDef<T>) =>
    column.id ?? ('accessorKey' in column ? String(column.accessorKey) : undefined)
  const pinnedFirstId = pinFirst ? pinnedId(pinFirst) : undefined
  const pinnedLastId = pinLast ? pinnedId(pinLast) : undefined
  const sticky = (id: string) =>
    id === pinnedFirstId
      ? 'sticky left-0 z-10 bg-card shadow-[1px_0_0_0_var(--border)]'
      : id === pinnedLastId
        ? 'sticky right-0 z-10 bg-card shadow-[-1px_0_0_0_var(--border)]'
        : undefined
  /** 固定列与选择 / 操作列不能拖动：它们必须留在首尾。 */
  const canReorder = (id: string) =>
    !isAction(id) && id !== 'select' && id !== pinnedFirstId && id !== pinnedLastId
  /** 落点相对拖拽源的位置：决定高亮画在左边缘还是右边缘。 */
  const dropSide = (id: string) => {
    if (!draggingId || draggingId === id) return undefined
    const from = resolvedOrder.indexOf(draggingId)
    const to = resolvedOrder.indexOf(id)
    if (from < 0 || to < 0) return undefined
    return from < to ? 'after' : 'before'
  }

  return (
    <TooltipProvider delayDuration={250}>
      {toolbar && <TableToolbar>{toolbar}</TableToolbar>}
      <div
        ref={root}
        className="data-table flex flex-col overflow-hidden rounded-lg border border-table-border bg-card"
      >
        <div
          data-slot="table-scroll"
          className={cn(
            virtualEnabled && 'overflow-auto overscroll-contain',
            // 内层 table-container 原本带 overflow-x-auto，会自己变成滚动容器导致表头不吸顶；
            // 这里让它不滚动，由外层统一滚动，表头才能真正 sticky。
            '[&_[data-slot=table-container]]:overflow-visible',
            '[&_[data-slot=table-header]]:sticky [&_[data-slot=table-header]]:top-0 [&_[data-slot=table-header]]:z-10',
            '[&_[data-slot=table-header]]:bg-table-header',
          )}
          style={virtualEnabled ? { maxHeight: viewportHeight } : undefined}
          onScroll={(event) => {
            if (!virtualEnabled) return
            setScrollTop(event.currentTarget.scrollTop)
          }}
          ref={(node) => {
            if (!node || !virtualEnabled || virtual?.rowHeight) return
            const row = node.querySelector('tbody tr[data-row]') as HTMLElement | null
            const height = row?.getBoundingClientRect().height
            if (height && Math.abs(height - (measuredRowHeight ?? 0)) > 1)
              setMeasuredRowHeight(height)
          }}
        >
          <Table
            data-striped={striped}
            aria-busy={!!loading}
            className="table-fixed"
            style={{ width: total }}
          >
            <colgroup>
              {leaves.map((column) => (
                <col key={column.id} style={{ width: widths[column.id] }} />
              ))}
            </colgroup>
            <TableCaption className="sr-only">{caption}</TableCaption>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow
                  key={group.id}
                  className="bg-table-header hover:bg-table-header focus-within:bg-table-header"
                >
                  {group.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      draggable={canReorder(header.column.id)}
                      title={canReorder(header.column.id) ? t('columnDragHint') : undefined}
                      onDragStart={(event) => {
                        // 从列宽拖拽手柄上起手时不算拖动列
                        if (
                          !canReorder(header.column.id) ||
                          (event.target as HTMLElement).closest('[role="separator"]')
                        ) {
                          event.preventDefault()
                          return
                        }
                        setDraggingId(header.column.id)
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', header.column.id)
                      }}
                      onDragOver={(event) => {
                        if (
                          draggingId &&
                          draggingId !== header.column.id &&
                          canReorder(header.column.id)
                        ) {
                          event.preventDefault()
                          event.dataTransfer.dropEffect = 'move'
                          setDragOverId(header.column.id)
                        }
                      }}
                      onDragLeave={() =>
                        setDragOverId((current) =>
                          current === header.column.id ? undefined : current,
                        )
                      }
                      onDrop={(event) => {
                        event.preventDefault()
                        const source = draggingId ?? event.dataTransfer.getData('text/plain')
                        if (source && canReorder(header.column.id)) {
                          setOrder(moveColumnId(resolvedOrder, source, header.column.id))
                        }
                        setDraggingId(undefined)
                        setDragOverId(undefined)
                      }}
                      onDragEnd={() => {
                        setDraggingId(undefined)
                        setDragOverId(undefined)
                      }}
                      className={cn(
                        'relative h-10 px-4 text-sm font-medium text-muted-foreground',
                        sticky(header.column.id)?.replace('bg-card', 'bg-table-header'),
                        canReorder(header.column.id) && 'cursor-grab',
                        draggingId === header.column.id && 'cursor-grabbing opacity-60',
                        // 落点高亮：左/右边缘一条 2px 主色边框，指明会插到哪一侧
                        dragOverId === header.column.id &&
                          dropSide(header.column.id) === 'before' &&
                          'bg-primary/5 shadow-[inset_2px_0_0_0_var(--primary)]',
                        dragOverId === header.column.id &&
                          dropSide(header.column.id) === 'after' &&
                          'bg-primary/5 shadow-[inset_-2px_0_0_0_var(--primary)]',
                      )}
                      colSpan={header.colSpan}
                    >
                      <div className="truncate">
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            type="button"
                            aria-label={
                              header.column.getIsSorted() === 'asc' ? t('sortDesc') : t('sortAsc')
                            }
                            className="-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp aria-hidden="true" className="size-3.5 text-primary" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown aria-hidden="true" className="size-3.5 text-primary" />
                            ) : (
                              <ArrowUpDown aria-hidden="true" className="size-3.5 opacity-40" />
                            )}
                            {/* Shift 连点会有多列排序，这里标出优先级序号。 */}
                            {sorting.length > 1 && header.column.getSortIndex() >= 0 && (
                              <span className="rounded bg-primary/15 px-1 text-[10px] tabular-nums text-primary">
                                {header.column.getSortIndex() + 1}
                              </span>
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </div>
                      {!header.isPlaceholder &&
                        header.subHeaders.length === 0 &&
                        header.column.getCanResize() &&
                        header.column.id !== 'select' && (
                          <div
                            role="separator"
                            aria-orientation="vertical"
                            aria-label={t('tableResize', {
                              column:
                                typeof header.column.columnDef.header === 'string'
                                  ? header.column.columnDef.header
                                  : header.column.id,
                            })}
                            aria-valuemin={minimum(header.column.id)}
                            aria-valuemax={Math.max(
                              minimum(header.column.id),
                              header.column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER,
                            )}
                            aria-valuenow={Math.round(
                              widths[header.column.id] ?? minimum(header.column.id),
                            )}
                            tabIndex={0}
                            className="absolute right-0 top-0 h-full w-2 touch-none cursor-col-resize select-none border-r border-transparent hover:border-primary/40 hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
                            onPointerDown={(event) => {
                              event.preventDefault()
                              event.currentTarget.setPointerCapture(event.pointerId)
                              drag.current = {
                                id: header.column.id,
                                x: event.clientX,
                                width: widths[header.column.id] ?? minimum(header.column.id),
                              }
                            }}
                            onPointerMove={(event) => {
                              if (drag.current?.id === header.column.id)
                                resize(
                                  header.column.id,
                                  drag.current.width + event.clientX - drag.current.x,
                                  Math.max(
                                    minimum(header.column.id),
                                    header.column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER,
                                  ),
                                )
                            }}
                            onPointerUp={() => {
                              drag.current = null
                            }}
                            onPointerCancel={() => {
                              drag.current = null
                            }}
                            onDoubleClick={() =>
                              setSizes((current) => {
                                const next = { ...current }
                                delete next[header.column.id]
                                return next
                              })
                            }
                            onKeyDown={(event) => {
                              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
                              event.preventDefault()
                              resize(
                                header.column.id,
                                (widths[header.column.id] ?? minimum(header.column.id)) +
                                  (event.key === 'ArrowRight' ? 16 : -16),
                                Math.max(
                                  minimum(header.column.id),
                                  header.column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER,
                                ),
                              )
                            }}
                          />
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {virtualEnabled && startIndex > 0 && (
                <TableRow className="border-0" aria-hidden="true">
                  <TableCell
                    colSpan={leaves.length}
                    className="p-0"
                    style={{ height: startIndex * rowHeight }}
                  />
                </TableRow>
              )}
              {loading ? (
                Array.from({ length: 4 }, (_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : tableRows.length ? (
                tableRows.slice(startIndex, endIndex).map((row) => (
                  <Fragment key={row.id}>
                    <TableRow
                      data-row=""
                      key={row.id}
                      data-clickable={onRowClick ? true : undefined}
                      className={cn(
                        striped && row.index % 2 === 1 && 'bg-table-stripe',
                        onRowClick && 'cursor-pointer',
                      )}
                      onClick={
                        onRowClick
                          ? (event) => {
                              // 点操作列的按钮/下拉、复选框或行内输入框时不要跳详情
                              if ((event.target as HTMLElement).closest(interactiveSelector)) return
                              onRowClick(row.original)
                            }
                          : undefined
                      }
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => (
                        <TableCell
                          key={cell.id}
                          className={cn(cellPadding[density], sticky(cell.column.id))}
                        >
                          {isAction(cell.column.id) ? (
                            <div data-action-content className="w-max">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          ) : cell.column.id === 'select' ? (
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          ) : cellIndex === (hasSelection ? 1 : 0) && expandable ? (
                            <div className="flex min-w-0 items-center gap-1.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                aria-expanded={expandedRows.has(row.id)}
                                aria-label={t(
                                  expandedRows.has(row.id) ? 'collapseRow' : 'expandRow',
                                )}
                                onClick={() => {
                                  setExpandedRows((current) => {
                                    const next = new Set(current)
                                    if (next.has(row.id)) next.delete(row.id)
                                    else next.add(row.id)
                                    return next
                                  })
                                }}
                              >
                                <ChevronRight
                                  aria-hidden="true"
                                  className={cn(
                                    'size-3.5 transition-transform',
                                    expandedRows.has(row.id) && 'rotate-90',
                                  )}
                                />
                              </Button>
                              <span className="min-w-0 flex-1">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </span>
                            </div>
                          ) : (
                            <TableCellOverflow>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCellOverflow>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {expandable && expandedRows.has(row.id) && (
                      <TableRow key={`${row.id}-detail`} className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={leaves.length} className="px-4 py-3">
                          {expandable.content(row.original)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              ) : (
                <TableRow className="hover:bg-transparent focus-within:bg-transparent">
                  <TableCell colSpan={columns.length} className="whitespace-normal">
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  </TableCell>
                </TableRow>
              )}
              {virtualEnabled && endIndex < tableRows.length && (
                <TableRow className="border-0" aria-hidden="true">
                  <TableCell
                    colSpan={leaves.length}
                    className="p-0"
                    style={{ height: (tableRows.length - endIndex) * rowHeight }}
                  />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {footer && (
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-table-border px-4 py-3 [&>div:only-child]:w-full [&>div:only-child]:p-0">
            {footer}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

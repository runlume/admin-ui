import { useState, type ReactNode } from 'react'
import { GripVertical } from 'lucide-react'
import { cn } from '../lib/utils'

export type SortableItem = { id: string; disabled?: boolean }
export type SortableListProps<T extends SortableItem> = {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T, index: number) => ReactNode
  label?: string
  className?: string
}

export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  label = '可排序列表',
  className,
}: SortableListProps<T>) {
  const [dragging, setDragging] = useState<string>()

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return
    const next = [...items]
    const [item] = next.splice(from, 1)
    if (!item || item.disabled) return
    next.splice(to, 0, item)
    onReorder(next)
  }

  return (
    <ul className={cn('space-y-2', className)} aria-label={label}>
      {items.map((item, index) => (
        <li
          key={item.id}
          draggable={!item.disabled}
          data-dragging={dragging === item.id || undefined}
          className="flex min-h-12 items-center gap-3 rounded-lg border bg-card px-3 py-2 data-dragging:opacity-50"
          onDragStart={(event) => {
            setDragging(item.id)
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', item.id)
          }}
          onDragEnd={() => setDragging(undefined)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            const source = items.findIndex(
              (entry) => entry.id === event.dataTransfer.getData('text/plain'),
            )
            move(source, index)
            setDragging(undefined)
          }}
        >
          <button
            type="button"
            disabled={item.disabled}
            aria-label={`拖动第 ${index + 1} 项；方向键调整顺序`}
            className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
            onKeyDown={(event) => {
              if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault()
                move(index, index + (event.key === 'ArrowDown' ? 1 : -1))
              }
            }}
          >
            <GripVertical aria-hidden="true" className="size-4" />
          </button>
          <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
        </li>
      ))}
    </ul>
  )
}

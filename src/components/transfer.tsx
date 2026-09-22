import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import { cn } from '../lib/utils'

export type TransferItem = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export type TransferProps = {
  items: TransferItem[]
  value: string[]
  onValueChange: (value: string[]) => void
  sourceTitle?: string
  targetTitle?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}

export function Transfer({
  items,
  value,
  onValueChange,
  sourceTitle = '可选项',
  targetTitle = '已选项',
  searchPlaceholder = '搜索',
  emptyText = '暂无数据',
  className,
}: TransferProps) {
  const [query, setQuery] = useState('')
  const [sourceSelected, setSourceSelected] = useState<string[]>([])
  const [targetSelected, setTargetSelected] = useState<string[]>([])
  const selected = new Set(value)
  const visible = useMemo(
    () => items.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase())),
    [items, query],
  )
  const source = visible.filter((item) => !selected.has(item.value))
  const target = items.filter((item) => selected.has(item.value))

  function toggle(current: string[], item: string, change: (value: string[]) => void) {
    change(current.includes(item) ? current.filter((value) => value !== item) : [...current, item])
  }

  function moveRight() {
    onValueChange([...value, ...sourceSelected.filter((item) => !selected.has(item))])
    setSourceSelected([])
  }

  function moveLeft() {
    onValueChange(value.filter((item) => !targetSelected.includes(item)))
    setTargetSelected([])
  }

  const list = (
    title: string,
    rows: TransferItem[],
    checked: string[],
    change: (value: string[]) => void,
  ) => (
    <section className="min-w-0 flex-1 overflow-hidden rounded-lg border bg-card">
      <header className="flex items-center justify-between border-b px-3 py-2 text-sm font-medium">
        <span>{title}</span>
        <span className="text-xs font-normal text-muted-foreground">{rows.length}</span>
      </header>
      {/* 选项是可勾选的复选框而不是 listbox 的 option，用 group 表达分组语义。 */}
      <div className="max-h-64 min-h-52 overflow-auto p-2" role="group" aria-label={title}>
        {rows.length === 0 ? (
          <p className="grid min-h-36 place-items-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          rows.map((item) => (
            <label
              key={item.value}
              aria-disabled={item.disabled || undefined}
              className={cn(
                'flex min-h-11 items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted',
                item.disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <Checkbox
                disabled={item.disabled}
                checked={checked.includes(item.value)}
                onCheckedChange={() => toggle(checked, item.value, change)}
                aria-label={item.label}
              />
              <span className="min-w-0">
                <span className="block truncate">{item.label}</span>
                {item.description && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.description}
                  </span>
                )}
              </span>
            </label>
          ))
        )}
      </div>
    </section>
  )

  return (
    <div className={cn('space-y-3', className)}>
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        start={<Search aria-hidden="true" className="size-4" />}
        clearable
        onClear={() => setQuery('')}
      />
      <div className="flex min-w-0 items-center gap-2">
        {list(sourceTitle, source, sourceSelected, setSourceSelected)}
        <div className="flex shrink-0 flex-col gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={sourceSelected.length === 0}
            onClick={moveRight}
            aria-label={`移动到${targetTitle}`}
          >
            <ArrowRight aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={targetSelected.length === 0}
            onClick={moveLeft}
            aria-label={`移动到${sourceTitle}`}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
        </div>
        {list(targetTitle, target, targetSelected, setTargetSelected)}
      </div>
    </div>
  )
}

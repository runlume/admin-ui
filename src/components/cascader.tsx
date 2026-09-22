import { useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import { useUiTranslation } from '../lib/use-ui-translation'
import { Popover } from 'radix-ui'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

export type CascaderOption = {
  value: string
  label: string
  disabled?: boolean
  children?: CascaderOption[]
}

/**
 * 级联选择：多列并排逐级下钻，选中叶子后回填完整路径。
 */
export function Cascader({
  options,
  value,
  onValueChange,
  label,
  placeholder,
  className,
}: {
  options: CascaderOption[]
  /** 叶子节点的 value。 */
  value?: string
  onValueChange: (value: string | undefined, path: CascaderOption[]) => void
  label: string
  placeholder?: string
  className?: string
}) {
  const { t } = useUiTranslation()
  const [open, setOpen] = useState(false)
  const [path, setPath] = useState<CascaderOption[]>([])
  const columns = useMemo(() => {
    const result: CascaderOption[][] = [options]
    let level = options
    for (const selected of path) {
      level = selected.children ?? []
      if (!level.length) break
      result.push(level)
    }
    return result
  }, [options, path])
  const selectedPath = useMemo(() => {
    if (!value) return []
    const walk = (
      items: CascaderOption[],
      trail: CascaderOption[],
    ): CascaderOption[] | undefined => {
      for (const item of items) {
        const next = [...trail, item]
        if (item.value === value) return next
        const found = item.children ? walk(item.children, next) : undefined
        if (found) return found
      }
      return undefined
    }
    return walk(options, []) ?? []
  }, [options, value])
  const text = selectedPath.map((item) => item.label).join(' / ')
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setPath([])
      }}
    >
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          className={cn('w-full justify-between bg-card font-normal', className)}
        >
          <span className={cn('truncate', !text && 'text-muted-foreground')}>
            {text || placeholder || t('search')}
          </span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 opacity-60" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 flex overflow-hidden rounded-lg border bg-popover p-1 shadow-lg outline-none"
        >
          {columns.map((column, depth) => (
            <div
              key={depth}
              role="listbox"
              aria-label={label}
              className="max-h-64 w-48 overflow-y-auto border-r p-1 last:border-r-0"
            >
              {column.map((option) => {
                const active = path[depth]?.value === option.value
                const leaf = !option.children?.length
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={option.disabled}
                    onClick={() => {
                      const trail = [...path.slice(0, depth), option]
                      if (leaf) {
                        setPath(trail)
                        onValueChange(option.value, trail)
                        setOpen(false)
                      } else {
                        setPath(trail)
                      }
                    }}
                    className={cn(
                      'flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-sm',
                      'hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
                      active && 'bg-accent text-accent-foreground',
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {leaf ? (
                      <Check aria-hidden="true" className="size-3.5 shrink-0 opacity-60" />
                    ) : (
                      <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 opacity-60" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

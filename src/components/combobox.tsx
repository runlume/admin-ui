import { useMemo, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { useUiTranslation } from '../lib/use-ui-translation'
import { Popover } from 'radix-ui'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from '@/lib/utils'

export type ComboboxOption = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}
export type ComboboxGroup = { group: string; options: ComboboxOption[] }

/** 可搜索单选下拉：输入即过滤，支持分组与清空。 */
export function Combobox({
  options,
  value,
  onValueChange,
  label,
  placeholder,
  emptyText,
  clearable = false,
  disabled = false,
  className,
}: {
  options: (ComboboxOption | ComboboxGroup)[]
  value?: string
  onValueChange: (value: string | undefined) => void
  /** 组合框的访问名称。 */
  label: string
  placeholder?: string
  emptyText?: string
  clearable?: boolean
  disabled?: boolean
  className?: string
}) {
  const { t } = useUiTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const groups = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return options
      .map((entry) =>
        'group' in entry
          ? { group: entry.group, options: entry.options }
          : { group: '', options: [entry] },
      )
      .map((entry) => ({
        ...entry,
        options: entry.options.filter(
          (option) =>
            keyword === '' ||
            option.label.toLowerCase().includes(keyword) ||
            option.value.toLowerCase().includes(keyword),
        ),
      }))
      .filter((entry) => entry.options.length > 0)
  }, [options, query])
  const flat = useMemo(() => groups.flatMap((entry) => entry.options), [groups])
  const selected = useMemo(
    () =>
      options
        .flatMap((entry) => ('group' in entry ? entry.options : [entry]))
        .find((option) => option.value === value),
    [options, value],
  )
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <div className={cn('relative flex items-center', className)}>
        <Popover.Trigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={label}
            disabled={disabled}
            className="w-full justify-between bg-card font-normal"
          >
            <span className={cn('truncate', !selected && 'text-muted-foreground')}>
              {selected?.label ?? placeholder ?? t('search')}
            </span>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0 opacity-60" />
          </Button>
        </Popover.Trigger>
        {clearable && selected && (
          <button
            type="button"
            aria-label={t('clear')}
            className="absolute right-8 rounded p-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => onValueChange(undefined)}
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        )}
      </div>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-56 overflow-hidden rounded-lg border bg-popover p-1 shadow-lg outline-none"
        >
          <div className="p-1">
            <Input
              autoFocus
              aria-label={label}
              value={query}
              placeholder={placeholder ?? t('search')}
              className="h-8"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div role="listbox" aria-label={label} className="max-h-64 overflow-y-auto p-1">
            {groups.map((entry) => (
              <div key={entry.group || 'default'}>
                {entry.group && (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">{entry.group}</p>
                )}
                {entry.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    disabled={option.disabled}
                    onClick={() => {
                      onValueChange(option.value)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                      'hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.label}</span>
                      {option.description && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {option.value === value && (
                      <Check aria-hidden="true" className="size-4 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            ))}
            {!flat.length && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {emptyText ?? t('empty')}
              </p>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

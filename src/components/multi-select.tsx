import { useMemo, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useUiTranslation } from '../lib/use-ui-translation'
import { Popover } from 'radix-ui'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import { cn } from '@/lib/utils'

export type MultiSelectOption = { value: string; label: string; description?: string }

/**
 * 多选下拉：支持搜索、全选与可清除，选中项以标签回显。
 */
export function MultiSelect({
  options,
  values,
  onValuesChange,
  label,
  placeholder,
  className,
}: {
  options: MultiSelectOption[]
  values: string[]
  onValuesChange: (values: string[]) => void
  label: string
  placeholder?: string
  className?: string
}) {
  const { t } = useUiTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return keyword
      ? options.filter((option) => option.label.toLowerCase().includes(keyword))
      : options
  }, [options, query])
  const selected = options.filter((option) => values.includes(option.value))
  function toggle(value: string, checked: boolean) {
    onValuesChange(checked ? [...values, value] : values.filter((item) => item !== value))
  }
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          className={cn(
            'h-auto min-h-10 w-full justify-between bg-card py-1.5 font-normal',
            className,
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap gap-1">
            {selected.length === 0 && (
              <span className="truncate text-muted-foreground">{placeholder ?? t('search')}</span>
            )}
            {selected.map((option) => (
              // 触发器本身是按钮，这里只做只读回显；移除项在弹层里操作，避免按钮嵌套。
              <Badge key={option.value} variant="secondary">
                {option.label}
              </Badge>
            ))}
          </span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 opacity-60" />
        </Button>
      </Popover.Trigger>
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
              placeholder={t('search')}
              className="h-8"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
            <label className="flex items-center gap-2">
              <Checkbox
                aria-label={t('tree.selectAll')}
                checked={
                  visible.length > 0 && visible.every((option) => values.includes(option.value))
                }
                indeterminate={
                  visible.some((option) => values.includes(option.value)) &&
                  !visible.every((option) => values.includes(option.value))
                }
                onCheckedChange={(checked) => {
                  const ids = visible.map((option) => option.value)
                  onValuesChange(
                    checked
                      ? [...new Set([...values, ...ids])]
                      : values.filter((item) => !ids.includes(item)),
                  )
                }}
              />
              {t('notifications.all')}
            </label>
            <Button type="button" variant="ghost" size="xs" onClick={() => onValuesChange([])}>
              {t('clear')}
            </Button>
          </div>
          <div
            role="listbox"
            aria-label={label}
            aria-multiselectable
            className="max-h-64 overflow-y-auto p-1"
          >
            {visible.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <Checkbox
                  checked={values.includes(option.value)}
                  aria-label={option.label}
                  onCheckedChange={(checked) => toggle(option.value, checked === true)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{option.label}</span>
                  {option.description && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </span>
              </label>
            ))}
            {!visible.length && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t('empty')}</p>
            )}
          </div>
          <div className="flex items-center justify-between border-t px-2 py-1.5 text-xs text-muted-foreground">
            <span>{t('tree.selected', { count: values.length })}</span>
            <Button type="button" variant="ghost" size="xs" onClick={() => setOpen(false)}>
              <Check aria-hidden="true" />
              {t('confirm')}
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

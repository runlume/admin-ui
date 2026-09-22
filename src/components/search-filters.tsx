import { flushSync } from 'react-dom'
import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useUiTranslation } from '../lib/use-ui-translation'
import { Button } from '@/components/ui/button'
import { FilterPresets } from '@/components/filter-presets'
import { cn } from '@/lib/utils'

function items(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? items(child.props.children)
      : [child],
  )
}

export function SearchFilters({
  presets,
  labelPosition = 'left',
  columns = 3,
  collapsedCount = columns,
  style,
  description,
  descriptionPosition = 'bottom',
  togglePosition = 'inline',
  collapsible = true,
  defaultExpanded = false,
  className,
  children,
  onInvalidCapture,
  ...props
}: ComponentProps<'form'> & {
  /**
   * 通过配置开关启用"筛选预设"：传入存储键、当前条件快照与恢复回调即可，
   * 组件会在操作区自动渲染预设入口。
   */
  presets?: {
    storageId: string
    value: unknown
    onApply: (value: unknown) => void
    /** 预设列表里的摘要文案，默认用通用格式化 */
    summary?: (value: unknown) => string
  }
  labelPosition?: 'left' | 'top'
  columns?: 1 | 2 | 3
  collapsedCount?: number
  description?: ReactNode
  descriptionPosition?: 'bottom' | 'inline'
  togglePosition?: 'bottom' | 'inline'
  collapsible?: boolean
  defaultExpanded?: boolean
}) {
  const { t } = useUiTranslation()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const id = useId()
  const fieldsRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const root = fieldsRef.current
    if (!root || labelPosition !== 'left') return
    const align = () => {
      const grid = getComputedStyle(root).display === 'contents' ? root.parentElement! : root
      const count = getComputedStyle(grid).gridTemplateColumns.split(' ').length
      const fields = Array.from(root.querySelectorAll<HTMLElement>(':scope > .search-filter-field'))
      const widths = Array.from({ length: count }, () => 0)
      fields.forEach((field, index) => {
        const label = field.querySelector<HTMLElement>(
          ':scope > label, :scope > .search-filter-label',
        )
        widths[index % count] = Math.max(
          widths[index % count] ?? 0,
          label?.getBoundingClientRect().width ?? 0,
        )
      })
      fields.forEach((field, index) =>
        field.style.setProperty('--search-label-width', `${widths[index % count]}px`),
      )
    }
    align()
    const observer = new ResizeObserver(align)
    observer.observe(root)
    if (root.parentElement) observer.observe(root.parentElement)
    root
      .querySelectorAll(
        ':scope > .search-filter-field > label, :scope > .search-filter-field > .search-filter-label',
      )
      .forEach((label) => observer.observe(label))
    return () => observer.disconnect()
  }, [children, columns, labelPosition, expanded])
  const content = items(children)
  const fields = content.filter((child) => isValidElement(child) && child.type === SearchField)
  const canCollapse = collapsible && fields.length > collapsedCount
  const open = !canCollapse || expanded
  // 没有可折叠的多余字段时不渲染按钮，避免留下点不动的"展开"。
  const toggle = canCollapse ? (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-expanded={canCollapse && open}
      aria-controls={id}
      onClick={() => setExpanded((value) => !value)}
    >
      {t(canCollapse && open ? 'searchCollapse' : 'searchExpand')}
      {canCollapse && open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
    </Button>
  ) : null
  const help = description ? (
    <p className="text-xs leading-5 text-muted-foreground">{description}</p>
  ) : null
  const inlineExtras = (
    <>
      {descriptionPosition === 'inline' && help}
      {togglePosition === 'inline' && toggle}
    </>
  )
  const hasInlineExtras =
    (descriptionPosition === 'inline' && !!help) || (togglePosition === 'inline' && !!toggle)
  const hasFooter =
    (descriptionPosition === 'bottom' && !!help) || (togglePosition === 'bottom' && !!toggle)
  let index = 0
  const hasActions = content.some((child) => isValidElement(child) && child.type === SearchActions)
  return (
    <form
      role="search"
      {...props}
      onInvalidCapture={(event) => {
        if (!open) flushSync(() => setExpanded(true))
        onInvalidCapture?.(event)
      }}
      style={{ ...style, '--search-columns': columns } as CSSProperties}
      data-columns={columns}
      data-label-position={labelPosition}
      data-expanded={open}
      data-inline-actions={!canCollapse || !open}
      className={cn('search-filters w-full rounded-xl border bg-card p-4', className)}
    >
      <div ref={fieldsRef} id={id} className="search-filter-fields">
        {content.map((child) => {
          if (isValidElement<SearchFieldProps>(child) && child.type === SearchField) {
            return cloneElement(child, {
              hidden: child.props.hidden || (!open && index++ >= collapsedCount),
            })
          }
          if (isValidElement(child) && child.type === SearchActions) return null
          return child
        })}
      </div>
      {(hasActions || hasInlineExtras || hasFooter) && (
        <div className="search-filter-footer">
          {descriptionPosition === 'bottom' && help}
          <div className="search-filter-footer-actions">
            {content.map((child) =>
              isValidElement<ComponentProps<typeof SearchActions>>(child) &&
              child.type === SearchActions
                ? cloneElement(child, {
                    children: (
                      <>
                        {child.props.children}
                        {inlineExtras}
                      </>
                    ),
                  })
                : null,
            )}
            {!hasActions && hasInlineExtras && <SearchActions>{inlineExtras}</SearchActions>}
            {presets && (
              <FilterPresets
                storageId={presets.storageId}
                value={presets.value}
                onApply={presets.onApply}
                summary={presets.summary}
              />
            )}
            {togglePosition === 'bottom' && toggle}
          </div>
        </div>
      )}
    </form>
  )
}

type SearchFieldProps =
  ({ as: 'label' } & ComponentProps<'label'>) | ({ as?: 'div' } & ComponentProps<'div'>)

export function SearchField(props: SearchFieldProps) {
  if (props.as === 'label') {
    const { as: _as, className, children, ...rest } = props
    return (
      <label {...rest} className={cn('search-filter-field', className)}>
        {Children.map(children, (child) =>
          typeof child === 'string' || typeof child === 'number' ? (
            <span className="search-filter-label">{child}</span>
          ) : (
            child
          ),
        )}
      </label>
    )
  }
  const { as: _as, className, ...rest } = props
  return <div {...rest} className={cn('search-filter-field', className)} />
}

export function SearchActions({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('search-filter-actions', className)} />
}

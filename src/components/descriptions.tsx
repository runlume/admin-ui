import { Fragment, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DescriptionItem = {
  key: string
  label: ReactNode
  value: ReactNode
  /** 跨列展示，适合备注、地址这类长内容。 */
  span?: 1 | 2 | 3
}

/** 详情键值列表。 */
export function Descriptions({
  items,
  columns = 2,
  bordered = false,
  className,
}: {
  items: DescriptionItem[]
  columns?: 1 | 2 | 3
  bordered?: boolean
  className?: string
}) {
  return (
    <dl
      data-slot="descriptions"
      className={cn(
        'grid text-sm',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
        bordered ? 'overflow-hidden rounded-lg border' : 'gap-x-8 gap-y-4',
        className,
      )}
    >
      {items.map((item) => (
        <Fragment key={item.key}>
          <div
            className={cn(
              'min-w-0',
              item.span === 2 && 'sm:col-span-2',
              item.span === 3 && 'sm:col-span-2 xl:col-span-3',
              bordered && 'grid grid-cols-[7rem_minmax(0,1fr)] border-b last:border-b-0',
            )}
          >
            {bordered ? (
              <>
                <dt className="bg-muted/40 px-4 py-3 text-muted-foreground">{item.label}</dt>
                <dd className="min-w-0 px-4 py-3">{item.value}</dd>
              </>
            ) : (
              <>
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd className="mt-1 min-w-0">{item.value}</dd>
              </>
            )}
          </div>
        </Fragment>
      ))}
    </dl>
  )
}

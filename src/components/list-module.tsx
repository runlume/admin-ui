import { cloneElement, type ComponentProps, type ReactElement, type ReactNode } from 'react'
import { SearchFilters } from './search-filters'
import { cn } from '@/lib/utils'

export function ListModule({
  search,
  children,
}: {
  search: ReactElement<ComponentProps<typeof SearchFilters>>
  children: ReactNode
}) {
  return (
    <section data-slot="list-module" className="min-w-0 rounded-xl border bg-card">
      <div className="border-b border-dashed">
        {cloneElement(search, {
          className: cn(search.props.className, 'm-0 rounded-none border-0 bg-transparent p-4'),
        })}
      </div>
      <div className="min-w-0 p-4">{children}</div>
    </section>
  )
}

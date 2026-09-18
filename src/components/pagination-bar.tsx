import type { ReactNode } from 'react'

export function PaginationBar({
  mode,
  summary,
  pageSize,
  children,
}: {
  mode: 'cursor' | 'fixed'
  summary?: ReactNode
  pageSize?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      data-pagination={mode}
      className="flex w-full flex-wrap items-center justify-between gap-3 text-sm"
    >
      <span className="text-xs text-muted-foreground">{summary}</span>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
        {pageSize && (
          <div className="[&_[data-slot=native-select-wrapper]]:w-auto [&_[data-slot=native-select-wrapper]]:shrink-0 [&_[data-slot=select-trigger]]:h-8 [&_[data-slot=select-trigger]]:w-auto">
            {pageSize}
          </div>
        )}
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </div>
  )
}

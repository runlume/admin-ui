import type { ReactNode } from 'react'

export function TableToolbar({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="table-toolbar"
      className="mb-3! flex min-h-9 flex-wrap items-center justify-start gap-2 [&_button]:h-9"
    >
      {children}
    </div>
  )
}

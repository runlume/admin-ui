import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type TimelineItem = {
  key: string
  title: ReactNode
  description?: ReactNode
  time?: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

const tones = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const

/** 时间线：用于操作记录与审批轨迹，按时间倒序展示。 */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol data-slot="timeline" className={cn('relative space-y-5', className)}>
      {items.map((item, index) => (
        <li key={item.key} className="relative flex gap-3 pb-1 pl-1">
          <span aria-hidden="true" className="relative flex w-3 shrink-0 justify-center">
            {index < items.length - 1 && (
              <span className="absolute top-3 h-[calc(100%+8px)] w-px bg-border" />
            )}
            <span className={cn('mt-1.5 size-2 rounded-full', tones[item.tone ?? 'default'])} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium">{item.title}</p>
              {item.time && <span className="text-xs text-muted-foreground">{item.time}</span>}
            </div>
            {item.description && (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

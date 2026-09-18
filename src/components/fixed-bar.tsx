import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * 页面底部固定操作条。
 * 长表单或详情页把保存、取消放在这里，滚动时始终可见。
 */
export function FixedBar({
  children,
  hint,
  className,
}: {
  children: ReactNode
  hint?: ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="fixed-bar"
      className={cn(
        'sticky bottom-0 z-20 -mx-4 mt-6 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6',
        className,
      )}
    >
      <span className="text-xs text-muted-foreground">{hint}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** 快捷键标记。 */
function Kbd({ className, children, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}

function KbdGroup({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span data-slot="kbd-group" className={cn('inline-flex items-center gap-1', className)}>
      {children}
    </span>
  )
}

export { Kbd, KbdGroup }

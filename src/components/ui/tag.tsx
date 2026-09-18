import type { ComponentProps, ReactNode } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tagVariants } from './tag-variants'

/** 标签：可带图标、可关闭，用于状态标记与筛选条件。 */
function Tag({
  className,
  tone,
  icon,
  closable = false,
  onClose,
  closeLabel,
  children,
  ...props
}: ComponentProps<'span'> &
  VariantProps<typeof tagVariants> & {
    icon?: ReactNode
    closable?: boolean
    onClose?: () => void
    closeLabel?: string
  }) {
  return (
    <span
      data-slot="tag"
      data-tone={tone ?? 'default'}
      className={cn(tagVariants({ tone }), className)}
      {...props}
    >
      {icon}
      {children}
      {closable && (
        <button
          type="button"
          aria-label={closeLabel ?? 'remove'}
          className="-mr-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/15"
          onClick={(event) => {
            event.stopPropagation()
            onClose?.()
          }}
        >
          <X aria-hidden="true" className="size-3" />
        </button>
      )}
    </span>
  )
}

export { Tag }

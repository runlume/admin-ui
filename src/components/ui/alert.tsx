import type { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative flex items-start gap-3 rounded-lg border px-4 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        info: 'border-info/25 bg-info-soft text-info',
        success: 'border-success/25 bg-success-soft text-success',
        warning: 'border-warning/25 bg-warning-soft text-warning',
        danger: 'border-danger/25 bg-danger-soft text-danger',
      },
    },
    defaultVariants: { variant: 'info' },
  },
)

const icons = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: AlertCircle }

/** 页内提示条：四态 + 可选操作。表单页说明与风险提示使用。 */
function Alert({
  className,
  variant = 'info',
  title,
  description,
  action,
  onClose,
  children,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof alertVariants> & {
    title?: ReactNode
    description?: ReactNode
    action?: ReactNode
    onClose?: () => void
  }) {
  const { t } = useTranslation()
  const Icon = icons[variant ?? 'info']
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {description && (
          <p className={cn('leading-6 text-foreground', title && 'mt-1')}>{description}</p>
        )}
        {children}
        {action && <div className="mt-2 flex flex-wrap items-center gap-2">{action}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label={t('close')}
          className="-mr-1 -mt-1 rounded p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  )
}

export { Alert, alertVariants }

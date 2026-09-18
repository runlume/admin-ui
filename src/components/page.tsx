import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ArrowLeft, Copy, Inbox, LoaderCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string
  description?: string
  eyebrow: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        <p data-slot="page-eyebrow" className="mb-2 text-xs font-medium tracking-wide text-primary">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
export function EmptyState({
  title,
  description,
  action,
  icon,
  size = 'default',
}: {
  title?: string
  description?: string
  action?: ReactNode
  /** 自定义图标，默认收件箱；列表类空态可换成对应业务图标。 */
  icon?: ReactNode
  /** 嵌入卡片时用 compact。 */
  size?: 'default' | 'compact'
}) {
  const { t } = useTranslation()
  return (
    <div
      data-size={size}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl bg-muted/35 px-6 py-10 text-center',
        size === 'compact' ? 'min-h-32' : 'min-h-64',
      )}
    >
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl border bg-muted">
        {icon ?? <Inbox className="size-5 text-muted-foreground" />}
      </div>
      <h3 className="text-sm font-medium">{title ?? t('empty')}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description ?? t('emptyDescription')}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
export function ErrorState({
  message,
  traceId,
  retry,
}: {
  message: string
  traceId?: string
  retry?: () => void
}) {
  const { t } = useTranslation()
  return (
    <section role="alert" className="rounded-lg border border-danger/25 bg-danger-soft px-5 py-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" />
        <div className="min-w-0 flex-1">
          <h2 className="font-medium text-danger">{t('errorTitle')}</h2>
          <p className="mt-1 text-sm leading-6 text-foreground">{message}</p>
          {traceId && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t('trace')}: <CopyValue value={traceId} />
            </p>
          )}
        </div>
        {retry && (
          <Button variant="outline" size="sm" onClick={retry}>
            <RefreshCw className="size-3.5" />
            {t('retry')}
          </Button>
        )}
      </div>
    </section>
  )
}
export function LoadingState({
  /** spinner（默认）／dots／bars，覆盖不同体量的加载场景。 */
  variant = 'spinner',
  label,
}: {
  variant?: 'spinner' | 'dots' | 'bars'
  label?: string
} = {}) {
  const { t } = useTranslation()
  if (variant !== 'spinner')
    return (
      <div
        role="status"
        className="flex min-h-60 flex-col items-center justify-center gap-3 text-muted-foreground"
      >
        <span aria-hidden="true" className="flex items-end gap-1">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={cn(
                'w-1.5 rounded-full bg-primary/60',
                variant === 'dots' ? 'size-2 animate-bounce' : 'animate-pulse',
              )}
              style={{
                animationDelay: `${index * 120}ms`,
                height: variant === 'bars' ? `${10 + index * 4}px` : undefined,
              }}
            />
          ))}
        </span>
        <span>{label ?? t('loading')}</span>
      </div>
    )
  return (
    <div
      role="status"
      className="flex min-h-60 items-center justify-center gap-3 text-muted-foreground"
    >
      <LoaderCircle className="size-5 animate-spin" />
      <span>{label ?? t('loading')}</span>
    </div>
  )
}
export function CopyValue({ value }: { value: string }) {
  const { t } = useTranslation()
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(t('copied'))
    } catch {
      toast.error(t('copyFailed'))
    }
  }
  return (
    <span className="inline-flex max-w-full items-center gap-1 align-middle">
      <code className="break-all font-mono text-xs">{value}</code>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        aria-label={`${t('copy')} ${value}`}
        onClick={() => void copy()}
      >
        <Copy className="size-3" />
      </Button>
    </span>
  )
}
export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <p className="font-mono text-primary">404</p>
      <h1 className="mt-5 text-2xl font-semibold">{t('unavailable')}</h1>
      <p className="mt-3 text-muted-foreground">{t('unavailableDescription')}</p>
      <Button className="mt-6" asChild>
        <a href="/">
          <ArrowLeft className="size-4" />
          {t('backHome')}
        </a>
      </Button>
    </main>
  )
}

/** 403：菜单里没有、但直接敲 URL 进来的页面。 */
export function ForbiddenPage() {
  const { t } = useTranslation()
  return (
    <section role="alert" className="flex flex-col items-center py-20 text-center">
      <p className="font-mono text-primary">403</p>
      <h1 className="mt-5 text-2xl font-semibold">{t('forbidden')}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{t('forbiddenDescription')}</p>
      <Button className="mt-6" asChild>
        <a href="/">
          <ArrowLeft className="size-4" />
          {t('backHome')}
        </a>
      </Button>
    </section>
  )
}

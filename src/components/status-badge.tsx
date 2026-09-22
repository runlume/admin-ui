import { useUiTranslation } from '../lib/use-ui-translation'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
const tones = {
  ACTIVE: 'bg-success-soft text-success',
  PENDING: 'bg-warning-soft text-warning',
  PROCESSING: 'bg-info-soft text-info',
  FAILED: 'bg-danger-soft text-danger',
  DISABLED: 'bg-disabled-soft text-disabled',
  INACTIVE: 'bg-inactive-soft text-inactive',
  SUSPENDED: 'bg-suspended-soft text-suspended',
  UNKNOWN: 'bg-unknown-soft text-unknown',
} as const
export function StatusBadge({ status }: { status: string }) {
  const { t } = useUiTranslation()
  const known = Object.hasOwn(tones, status)
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 border-transparent px-2 py-0.5 font-medium',
        known ? tones[status as keyof typeof tones] : tones.UNKNOWN,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {known ? t(status) : t('UNKNOWN')}
    </Badge>
  )
}

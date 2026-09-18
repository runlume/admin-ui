import { useTranslation } from 'react-i18next'
import { Check, CircleQuestionMark, X } from 'lucide-react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { passwordRules, passwordStrength } from '@/lib/password'
import { cn } from '@/lib/utils'

const barTones = {
  empty: 'bg-border',
  weak: 'bg-danger',
  medium: 'bg-warning',
  strong: 'bg-success',
} as const

/**
 * 密码强度与规则清单。
 * `compact` 只留强度条 + 问号提示（悬停/聚焦展开规则），适合表单页；默认连规则一起铺开，
 * 组件总览里的示例用默认形态。
 */
export function PasswordStrength({
  password,
  compact = false,
  className,
}: {
  password: string
  compact?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const strength = passwordStrength(password)
  const percent = (strength.score / passwordRules.length) * 100
  const rules = (
    <ul className={cn('grid gap-1 text-xs text-muted-foreground', !compact && 'sm:grid-cols-2')}>
      {passwordRules.map((rule) => {
        const matched = strength.matched.includes(rule.key)
        return (
          <li key={rule.key} className={cn('flex items-center gap-1.5', matched && 'text-success')}>
            {matched ? (
              <Check aria-hidden="true" className="size-3 shrink-0" />
            ) : (
              <X aria-hidden="true" className="size-3 shrink-0" />
            )}
            {t('password.rules.' + rule.key)}
          </li>
        )
      })}
    </ul>
  )
  return (
    <div data-slot="password-strength" className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className={cn('h-full transition-all duration-300', barTones[strength.level])}
            style={{ width: `${percent}%` }}
          />
        </div>
        {strength.level !== 'empty' && (
          <span
            className={cn(
              'shrink-0 text-right text-xs text-muted-foreground',
              compact ? 'w-8' : 'w-20',
            )}
          >
            {t('password.levels.' + strength.level)}
          </span>
        )}
        {compact && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                type="button"
                aria-label={t('password.rulesTitle')}
                title={t('password.rulesTitle')}
                className="shrink-0 rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <CircleQuestionMark aria-hidden="true" className="size-4" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent align="end" className="w-60">
              <p className="mb-2 text-xs font-medium">{t('password.rulesTitle')}</p>
              {rules}
            </HoverCardContent>
          </HoverCard>
        )}
      </div>
      {!compact && rules}
    </div>
  )
}

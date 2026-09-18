import { Check, ExternalLink, LogOut, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

export type ProfileContact = { key: 'email' | 'phone'; value?: string; verified?: boolean }

/**
 * 个人信息面板。数据由业务系统传入（通常来自会话或用户接口），
 * 联系方式修改入口交给身份中心或业务自身的页面。
 */
export function UserProfile({
  displayName,
  userId,
  contacts = [],
  editHref,
  editLabel,
  onSignOut,
}: {
  displayName?: string
  userId?: string
  contacts?: ProfileContact[]
  editHref?: string
  editLabel?: string
  /** 传入后显示退出登录；认证方式由业务系统决定。 */
  onSignOut?: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="min-h-0 space-y-5 overflow-y-auto text-sm">
      <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
        <UserRound className="size-9 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{t('userSettings.name')}</p>
          <p className="mt-1 break-words text-base font-medium">{displayName || '—'}</p>
        </div>
      </div>
      <dl className="divide-y">
        <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 pb-4">
          <dt className="text-muted-foreground">ID</dt>
          <dd className="break-all font-mono text-xs leading-5">{userId || '—'}</dd>
        </div>
        {contacts.map((contact) => (
          <div
            key={contact.key}
            className="grid grid-cols-[4rem_minmax(0,1fr)] items-start gap-3 py-4"
          >
            <dt className="pt-1 text-muted-foreground">{t(`userSettings.${contact.key}`)}</dt>
            <dd className="min-w-0 space-y-2">
              <p className="break-all">{contact.value || '—'}</p>
              {contact.value && (
                <Badge
                  variant="outline"
                  className={contact.verified ? 'text-success' : 'text-muted-foreground'}
                >
                  {contact.verified && <Check aria-hidden="true" />}
                  {t(contact.verified ? 'userSettings.verified' : 'userSettings.unverified')}
                </Badge>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {(editHref || onSignOut) && (
        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          {onSignOut && (
            <Button variant="outline" onClick={onSignOut}>
              <LogOut />
              {t('userSettings.signOut')}
            </Button>
          )}
          {editHref && (
            <Button asChild variant="outline">
              <a href={editHref} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                {editLabel ?? t('userSettings.edit')}
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

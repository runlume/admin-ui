import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { unreadCount, useNotifications } from '@/lib/notifications'
import { Button } from './ui/button'

/**
 * 顶栏通知入口：跳转通知中心并显示未读角标。
 * 未读数与通知页共用 `useNotifications`，任一处已读都会同步角标。
 */
export function NotificationsButton() {
  const { t } = useTranslation()
  const unread = useNotifications((state) => unreadCount(state.items))
  const label =
    unread > 0
      ? `${t('notifications.nav')}：${t('notifications.unreadSummary', { count: unread })}`
      : t('notifications.nav')
  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link to="/notifications" aria-label={label} title={t('notifications.nav')}>
        <Bell className="size-4" aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground"
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </Link>
    </Button>
  )
}

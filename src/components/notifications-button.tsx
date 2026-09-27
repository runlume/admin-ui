import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from './ui/button'

/**
 * 顶栏通知入口：未读数与目标路由由宿主传入（服务端数据是业务系统的职责），
 * 组件只负责角标与无障碍名称。
 */
export function NotificationsButton({
  unread,
  to = '/notifications',
}: {
  /** 未读条数；0 时不显示角标。 */
  unread: number
  to?: string
}) {
  const { t } = useTranslation()
  const label =
    unread > 0
      ? `${t('notifications.nav')}：${t('notifications.unreadSummary', { count: unread })}`
      : t('notifications.nav')
  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link to={to} aria-label={label} title={t('notifications.nav')}>
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

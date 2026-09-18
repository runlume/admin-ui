import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDateTime, relativeTime } from '@/lib/time'

/**
 * 相对时间。悬停显示绝对时间，默认每分钟刷新一次。
 */
export function TimeAgo({
  value,
  updateInterval = 60_000,
  className,
}: {
  value: Date | string
  updateInterval?: number
  className?: string
}) {
  const { t, i18n } = useTranslation()
  const date = typeof value === 'string' ? new Date(value) : value
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (updateInterval <= 0) return
    const timer = window.setInterval(() => setNow(new Date()), updateInterval)
    return () => window.clearInterval(timer)
  }, [updateInterval])
  if (Number.isNaN(date.getTime())) return <span className={className}>—</span>
  const { unit, count, future } = relativeTime(date, now)
  const text =
    unit === 'now'
      ? t('timeAgo.now')
      : t(future ? 'timeAgo.future' : 'timeAgo.past', {
          value: t(`timeAgo.${unit}`, { count }),
        })
  return (
    <time
      dateTime={date.toISOString()}
      title={formatDateTime(date, i18n.language)}
      className={className}
    >
      {text}
    </time>
  )
}

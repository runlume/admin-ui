import { useTranslation } from 'react-i18next'
import { useNotifications, type NotificationPreferences } from '@/lib/notifications'
import { NativeSelect } from './ui/native-select'

const toggles: { key: 'inApp' | 'email' | 'desktop'; hint: string }[] = [
  { key: 'inApp', hint: 'inAppHint' },
  { key: 'email', hint: 'emailHint' },
  { key: 'desktop', hint: 'desktopHint' },
]

/**
 * 通知偏好设置。与通知中心共用同一个 store，改动即时生效并保存在当前浏览器。
 */
export function NotificationSettings() {
  const { t } = useTranslation()
  const preferences = useNotifications((state) => state.preferences)
  const setPreference = useNotifications((state) => state.setPreference)
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">{t('notifications.settingsHint')}</p>
      <div className="divide-y">
        {toggles.map(({ key, hint }) => (
          <label key={key} className="flex items-start justify-between gap-4 py-4">
            <span className="min-w-0">
              <span className="block">{t(`notifications.${key}`)}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {t(`notifications.${hint}`)}
              </span>
            </span>
            <input
              className="mt-1 size-4 shrink-0 accent-primary"
              type="checkbox"
              checked={preferences[key]}
              onChange={(event) => setPreference(key, event.target.checked)}
            />
          </label>
        ))}
        <label className="flex items-start justify-between gap-4 py-4">
          <span className="min-w-0">
            <span className="block">{t('notifications.digest')}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {t('notifications.digestHint')}
            </span>
          </span>
          <NativeSelect
            size="sm"
            aria-label={t('notifications.digest')}
            value={preferences.digest}
            onChange={(event) =>
              setPreference('digest', event.target.value as NotificationPreferences['digest'])
            }
          >
            {(['instant', 'daily', 'weekly'] as const).map((value) => (
              <option key={value} value={value}>
                {t(`notifications.digestOptions.${value}`)}
              </option>
            ))}
          </NativeSelect>
        </label>
      </div>
    </div>
  )
}

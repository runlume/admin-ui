import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storageKey } from '@/lib/storage-key'

/**
 * 通知偏好：属于界面偏好，保存在当前浏览器。
 * 通知正文与已读状态是业务数据，由宿主从服务端取，不要塞进这里。
 */
export type NotificationPreferences = {
  inApp: boolean
  email: boolean
  desktop: boolean
  digest: 'instant' | 'daily' | 'weekly'
}

export const defaultNotificationPreferences: NotificationPreferences = {
  inApp: true,
  email: true,
  desktop: false,
  digest: 'daily',
}

type NotificationPreferenceStore = {
  preferences: NotificationPreferences
  setPreference: <Key extends keyof NotificationPreferences>(
    key: Key,
    value: NotificationPreferences[Key],
  ) => void
}

export const useNotificationPreferences = create<NotificationPreferenceStore>()(
  persist(
    (set) => ({
      preferences: { ...defaultNotificationPreferences },
      setPreference: (key, value) =>
        set((state) => ({ preferences: { ...state.preferences, [key]: value } })),
    }),
    { name: storageKey('notification-preferences') },
  ),
)

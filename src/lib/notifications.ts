import { storageKey } from '@/lib/storage-key'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const notificationCategories = ['SYSTEM', 'TASK', 'SECURITY', 'BILLING'] as const
export type NotificationCategory = (typeof notificationCategories)[number]

export type AppNotification = {
  id: string
  title: string
  body: string
  category: NotificationCategory
  createdAt: string
  read: boolean
  /** 关联页面路径；为空表示纯展示通知。 */
  link?: string
}

export type NotificationPreferences = {
  inApp: boolean
  email: boolean
  desktop: boolean
  digest: 'instant' | 'daily' | 'weekly'
}

/**
 * 示例通知。仅用于演示通知页与顶栏未读角标，接入真实接口时整体替换为
 * 服务端数据；偏好设置仍可保留在浏览器侧。
 */
const sampleNotifications: AppNotification[] = [
  {
    id: 'NTF-2401',
    title: '订单 ORD-24004 待处理',
    body: '明远医疗器械提交的订单已超过 24 小时仍未处理，请在今日内确认或退回。',
    category: 'TASK',
    createdAt: '2026-09-16 09:20',
    read: false,
    link: '/customers/CUS-1003',
  },
  {
    id: 'NTF-2402',
    title: '检测到新的登录设备',
    body: '账户刚刚在 macOS · Chrome 上登录。如非本人操作，请立即修改密码并联系管理员。',
    category: 'SECURITY',
    createdAt: '2026-09-16 08:04',
    read: false,
  },
  {
    id: 'NTF-2403',
    title: '客户 CUS-1012 待审核',
    body: '启元机器人创建后 3 天内未完成资料审核，资料不完整的账户无法下单。',
    category: 'TASK',
    createdAt: '2026-09-15 17:42',
    read: false,
    link: '/customers/CUS-1012',
  },
  {
    id: 'NTF-2404',
    title: '本月账单已生成',
    body: '2026 年 8 月账单金额 ¥ 12,480.00，请在 9 月 30 日前完成对账确认。',
    category: 'BILLING',
    createdAt: '2026-09-15 10:12',
    read: true,
  },
  {
    id: 'NTF-2405',
    title: '平台维护通知',
    body: '平台将于 9 月 20 日 02:00–04:00（UTC+8）进行版本升级，期间控制台只读。',
    category: 'SYSTEM',
    createdAt: '2026-09-14 16:00',
    read: true,
  },
  {
    id: 'NTF-2406',
    title: '客户 CUS-1010 已被停用',
    body: '恒安保险经纪因连续欠费被自动停用，重新启用前请先核对账单状态。',
    category: 'BILLING',
    createdAt: '2026-09-13 11:36',
    read: true,
    link: '/customers/CUS-1010',
  },
  {
    id: 'NTF-2407',
    title: '密码将在 14 天后过期',
    body: '为符合安全策略，请在过期前通过身份中心更新密码，避免登录被中断。',
    category: 'SECURITY',
    createdAt: '2026-09-12 09:05',
    read: true,
  },
  {
    id: 'NTF-2408',
    title: '导出任务已完成',
    body: '客户列表导出已生成，共 12 条记录，文件保留 7 天后自动清理。',
    category: 'SYSTEM',
    createdAt: '2026-09-11 15:28',
    read: true,
  },
]

export const defaultNotificationPreferences: NotificationPreferences = {
  inApp: true,
  email: true,
  desktop: false,
  digest: 'daily',
}

type Notifications = {
  items: AppNotification[]
  preferences: NotificationPreferences
  markRead: (ids: string[], read: boolean) => void
  markAllRead: () => void
  remove: (ids: string[]) => void
  setPreference: <Key extends keyof NotificationPreferences>(
    key: Key,
    value: NotificationPreferences[Key],
  ) => void
}

/** 未读数用于顶栏角标；示例数据在内存中，偏好按浏览器持久化。 */
export const useNotifications = create<Notifications>()(
  persist(
    (set) => ({
      items: sampleNotifications,
      preferences: { ...defaultNotificationPreferences },
      markRead: (ids, read) =>
        set((state) => ({
          items: state.items.map((item) => (ids.includes(item.id) ? { ...item, read } : item)),
        })),
      markAllRead: () =>
        set((state) => ({ items: state.items.map((item) => ({ ...item, read: true })) })),
      remove: (ids) =>
        set((state) => ({ items: state.items.filter((item) => !ids.includes(item.id)) })),
      setPreference: (key, value) =>
        set((state) => ({ preferences: { ...state.preferences, [key]: value } })),
    }),
    {
      name: storageKey('notifications'),
      partialize: ({ preferences }) => ({ preferences }),
    },
  ),
)

export function unreadCount(items: AppNotification[]): number {
  return items.filter((item) => !item.read).length
}

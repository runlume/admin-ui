import { beforeEach, describe, expect, it } from 'vitest'
import { defaultNotificationPreferences, unreadCount, useNotifications } from '@/lib/notifications'

const initialItems = useNotifications.getState().items
const unreadIds = initialItems.filter((item) => !item.read).map((item) => item.id)

describe('通知状态', () => {
  beforeEach(() => {
    useNotifications.setState({
      items: initialItems,
      preferences: { ...defaultNotificationPreferences },
    })
  })

  it('未读数按未读条目统计', () => {
    expect(unreadCount(initialItems)).toBe(unreadIds.length)
    expect(unreadIds.length).toBeGreaterThan(0)
  })

  it('标为已读与标回未读都只影响目标条目', () => {
    const target = unreadIds[0] ?? ''
    useNotifications.getState().markRead([target], true)
    expect(unreadCount(useNotifications.getState().items)).toBe(unreadIds.length - 1)
    useNotifications.getState().markRead([target], false)
    expect(unreadCount(useNotifications.getState().items)).toBe(unreadIds.length)
  })

  it('全部已读与删除同步未读数', () => {
    useNotifications.getState().markAllRead()
    expect(unreadCount(useNotifications.getState().items)).toBe(0)

    const first = initialItems[0]
    if (!first) throw new Error('示例数据为空')
    useNotifications.getState().remove([first.id])
    expect(useNotifications.getState().items.map((item) => item.id)).not.toContain(first.id)
    expect(useNotifications.getState().items).toHaveLength(initialItems.length - 1)
  })

  it('通知偏好可单独更新', () => {
    useNotifications.getState().setPreference('desktop', true)
    useNotifications.getState().setPreference('digest', 'weekly')
    expect(useNotifications.getState().preferences).toMatchObject({
      desktop: true,
      digest: 'weekly',
    })
    expect(useNotifications.getState().preferences.inApp).toBe(true)
  })
})

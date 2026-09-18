import { useMemo } from 'react'
import { storageKey } from '@/lib/storage-key'
import { useHotkeys, type Hotkey } from '@/lib/hotkeys'

/** 默认快捷键：`g d` 工作台、`g c` 客户、`g n` 通知、`g s` 设置。 */
export const defaultShortcuts = [
  { combo: 'g d', path: '/', label: 'sample.navOverview' },
  { combo: 'g c', path: '/customers', label: 'sample.navCustomers' },
  { combo: 'g n', path: '/notifications', label: 'notifications.nav' },
  { combo: 'g s', path: '/settings', label: 'sample.navSettings' },
] as const

export type ShortcutSetting = { path: string; combo: string }

export function readShortcuts(): ShortcutSetting[] {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey('shortcuts')) ?? '[]')
    if (!Array.isArray(raw)) return []
    return raw.filter(
      (item): item is ShortcutSetting =>
        typeof item?.path === 'string' && typeof item?.combo === 'string',
    )
  } catch {
    return []
  }
}

export function writeShortcuts(settings: ShortcutSetting[]) {
  try {
    localStorage.setItem(storageKey('shortcuts'), JSON.stringify(settings))
  } catch {
    /* 忽略隐私模式下的写入失败。 */
  }
}

/** 组合键与默认组合是否冲突（同一 combo 绑到不同路径）。 */
export function shortcutConflict(combo: string, path: string, custom: ShortcutSetting[]) {
  const normalized = combo.trim().toLowerCase()
  if (!normalized) return false
  const inDefault = defaultShortcuts.some((item) => item.combo === normalized && item.path !== path)
  const inCustom = custom.some((item) => item.combo === normalized && item.path !== path)
  return inDefault || inCustom
}

export function useDefaultShortcuts(
  navigate: (path: string) => void,
  custom: ShortcutSetting[] = [],
) {
  const hotkeys = useMemo<Hotkey[]>(() => {
    const merged = [
      ...defaultShortcuts.map((item) => ({
        path: item.path as string,
        combo: item.combo as string,
      })),
      ...custom,
    ]
    return merged.map((item) => ({
      combo: item.combo,
      handler: () => navigate(item.path),
    }))
  }, [custom, navigate])
  useHotkeys(hotkeys)
}

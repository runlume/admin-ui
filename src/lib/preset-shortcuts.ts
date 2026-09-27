import { useMemo } from 'react'
import { storageKey } from '@/lib/storage-key'
import { useHotkeys, type Hotkey } from '@/lib/hotkeys'

/**
 * 默认快捷键由宿主提供：组件库不假定任何路由，业务系统把自己的
 * `g d` 工作台、`g s` 设置等组合传进 `UserSettings` 的 `shortcuts`。
 */
export const defaultShortcuts: readonly { combo: string; path: string; label: string }[] = []

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
  defaults: readonly { combo: string; path: string }[] = defaultShortcuts,
) {
  const hotkeys = useMemo<Hotkey[]>(() => {
    const merged = [
      ...defaults.map((item) => ({
        path: item.path as string,
        combo: item.combo as string,
      })),
      ...custom,
    ]
    return merged.map((item) => ({
      combo: item.combo,
      handler: () => navigate(item.path),
    }))
  }, [custom, defaults, navigate])
  useHotkeys(hotkeys)
}

import { storageKey } from '@/lib/storage-key'

export type Preset<T> = {
  name: string
  value: T
  /** 保存时间（ISO），用于列表排序与展示。 */
  savedAt?: string
  /** 业务自定义说明，展示在列表里帮助识别。 */
  note?: string
}

/** 读取本地保存的筛选预设；存储不可用时返回空列表。 */
export function readPresets<T>(key: string): Preset<T>[] {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(key)) ?? '[]')
    if (!Array.isArray(raw)) return []
    return raw.filter(
      (item): item is Preset<T> =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.name === 'string' &&
        'value' in item,
    )
  } catch {
    return []
  }
}

/** 覆盖已保存的快照（同名覆盖）。 */
export function upsertPreset<T>(presets: Preset<T>[], next: Preset<T>, limit = 20): Preset<T>[] {
  const merged = [next, ...presets.filter((item) => item.name !== next.name)].slice(0, limit)
  return merged
}

export function renamePreset<T>(presets: Preset<T>[], from: string, to: string): Preset<T>[] {
  const target = presets.find((item) => item.name === from)
  if (!target || !to.trim() || presets.some((item) => item.name === to)) return presets
  return presets.map((item) => (item.name === from ? { ...item, name: to } : item))
}

/**
 * 名称是否已被占用（保存 / 重命名前的唯一性校验）。
 * `except` 用于重命名时忽略自己。
 */
export function presetNameTaken<T>(presets: Preset<T>[], name: string, except?: string): boolean {
  const trimmed = name.trim()
  if (!trimmed) return false
  return presets.some((item) => item.name === trimmed && item.name !== except)
}

/**
 * 通用快照摘要：把筛选条件拼成一行可读文案（预设的默认摘要用，调用方可以覆盖）。
 * 空字符串、空数组会被跳过，避免出现 `关键字: — · 状态: · 日期:` 这种噪音。
 */
export function describePresetValue(value: unknown, limit = 72): string {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'object') return String(value)
  if (Array.isArray(value)) return value.map((item) => describePresetValue(item, limit)).join(' / ')
  const parts = Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => {
    if (item === '' || item === null || item === undefined) return []
    if (Array.isArray(item)) {
      const list = item.filter((entry) => entry !== '' && entry !== null && entry !== undefined)
      return list.length ? [`${key}: ${list.join('/')}`] : []
    }
    if (typeof item === 'object') {
      const nested = describePresetValue(item, limit)
      return nested ? [`${key}: ${nested}`] : []
    }
    return [`${key}: ${String(item)}`]
  })
  const text = parts.join(' · ')
  return text.length > limit ? `${text.slice(0, limit)}…` : text
}

export function writePresets<T>(key: string, presets: Preset<T>[]) {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(presets))
  } catch {
    /* 隐私模式下忽略持久化失败。 */
  }
}

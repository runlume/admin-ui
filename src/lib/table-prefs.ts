import { storageKey } from '@/lib/storage-key'

/** 表格列宽 / 列顺序偏好：只保存浏览器侧展示偏好，不进入业务数据。 */
export type ColumnSizes = Record<string, number>
export type ColumnOrder = string[]

/** 一份完整的表格布局偏好：列宽 + 列顺序。 */
export type TableLayout = { sizes: ColumnSizes; order: ColumnOrder }

export function readTablePrefs(storageId: string | undefined): TableLayout {
  if (!storageId) return { sizes: {}, order: [] }
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(storageKey(`table.${storageId}`)) ?? '{}')
    if (typeof raw !== 'object' || raw === null) return { sizes: {}, order: [] }
    const record = raw as Record<string, unknown>
    // 兼容早期只存列宽的扁平结构：{ id: width }
    const sizesSource = (
      'sizes' in record && typeof record.sizes === 'object' && record.sizes !== null
        ? record.sizes
        : record
    ) as Record<string, unknown>
    const sizes = Object.fromEntries(
      Object.entries(sizesSource).filter(
        ([, value]) => typeof value === 'number' && Number.isFinite(value),
      ),
    ) as ColumnSizes
    const order = Array.isArray(record.order)
      ? record.order.filter((id): id is string => typeof id === 'string')
      : []
    return { sizes, order }
  } catch {
    return { sizes: {}, order: [] }
  }
}

function writePrefs(storageId: string | undefined, prefs: TableLayout) {
  if (!storageId) return
  try {
    localStorage.setItem(storageKey(`table.${storageId}`), JSON.stringify(prefs))
  } catch {
    /* 隐私模式下忽略持久化失败。 */
  }
}

export function readColumnSizes(storageId: string | undefined): ColumnSizes {
  return readTablePrefs(storageId).sizes
}

export function readColumnOrder(storageId: string | undefined): ColumnOrder {
  return readTablePrefs(storageId).order
}

/** 已挂载表格的列宽重置函数，键是 storageId。 */
const resetters = new Map<string, () => void>()

export function registerTableReset(storageId: string, reset: () => void) {
  resetters.set(storageId, reset)
  return () => {
    resetters.delete(storageId)
  }
}

/** 恢复默认列宽与列顺序：清掉本地偏好并通知正在显示的表格复位。 */
export function resetTableLayout(storageId: string | undefined) {
  if (!storageId) return
  resetters.get(storageId)?.()
  try {
    localStorage.removeItem(storageKey(`table.${storageId}`))
  } catch {
    /* 忽略隐私模式下的失败。 */
  }
}

export function writeColumnSizes(storageId: string | undefined, sizes: ColumnSizes) {
  writePrefs(storageId, { sizes, order: readColumnOrder(storageId) })
}

export function writeColumnOrder(storageId: string | undefined, order: ColumnOrder) {
  writePrefs(storageId, { sizes: readColumnSizes(storageId), order })
}

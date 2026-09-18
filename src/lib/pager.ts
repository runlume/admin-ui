/**
 * 页码分页器的可见页计算（带省略号）。
 * 返回的 `null` 表示省略号。
 */
export function pagerItems(page: number, pageCount: number, siblings = 1): (number | null)[] {
  const total = Math.max(1, Math.floor(pageCount))
  const current = Math.min(Math.max(1, Math.floor(page)), total)
  // 页数较少时全部展示，避免出现 1 2 … 5 这种没有必要的省略。
  if (total <= siblings * 2 + 5) return Array.from({ length: total }, (_, index) => index + 1)
  const first = 1
  const last = total
  const start = Math.max(first, current - siblings)
  const end = Math.min(last, current + siblings)
  const items: (number | null)[] = []
  if (start > first + 1) items.push(first, null)
  else for (let value = first; value < start; value += 1) items.push(value)
  for (let value = start; value <= end; value += 1) items.push(value)
  if (end < last - 1) items.push(null, last)
  else for (let value = end + 1; value <= last; value += 1) items.push(value)
  return items
}

/** 跳页输入解析：只接受范围内的整数，其余返回 undefined。 */
export function parsePageInput(value: string, pageCount: number): number | undefined {
  const parsed = Number(value.trim())
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > Math.max(1, pageCount)) return undefined
  return parsed
}

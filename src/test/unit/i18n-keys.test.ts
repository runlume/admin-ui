import { describe, expect, it } from 'vitest'
import { zhResources as zh } from '@/lib/i18n'

/**
 * 约束：代码里 `t('a.b')` 用到的字面量 key 必须在语言包里存在。
 * 作用是拦住"新增组件直接写 key 但忘记补语言包"这类回归。
 */
const files = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function collectKeys(): Map<string, string> {
  const used = new Map<string, string>()
  for (const [path, content] of Object.entries(files)) {
    if (path.includes('/test/') || path.includes('i18n')) continue
    for (const match of String(content).matchAll(/\bt\(\s*['"`]([A-Za-z]\w*(?:\.[\w]+)+)['"`]/g)) {
      const key = match[1]
      if (key) used.set(key, path)
    }
  }
  return used
}

function hasKey(resources: Record<string, unknown>, key: string) {
  return key.split('.').every((part) => {
    const current = resources as Record<string, unknown>
    if (typeof current !== 'object' || current === null || !(part in current)) return false
    resources = current[part] as Record<string, unknown>
    return true
  })
}

describe('语言包覆盖', () => {
  it('代码中使用的文案 key 都已登记', () => {
    const missing = [...collectKeys()]
      .filter(([key]) => !hasKey(zh as Record<string, unknown>, key))
      .map(([key, path]) => `${key} (${path})`)
    expect(missing).toEqual([])
  })
})

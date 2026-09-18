import { describe, expect, it, vi } from 'vitest'
import { bannerPrintedFlag, displayWidth, printBanner, renderBanner } from '../../../scripts/banner'

describe('终端品牌横幅', () => {
  it('带品牌、站点与当前使用版本', () => {
    const banner = renderBanner()
    expect(banner).toContain('由 Runlume admin-design 驱动')
    expect(banner).toContain('https://runlume.app')
    expect(banner).toContain('当前使用：标准版')
  })

  it('中文按两列宽计算，边框左对齐', () => {
    const lines = renderBanner()
      .split('\n')
      .filter((line) => line.startsWith('║'))
    expect(lines.length).toBeGreaterThan(0)
    expect(new Set(lines.map(displayWidth)).size).toBe(1)
  })

  it('同一进程只打一次（配置改动触发的重启不重复）', () => {
    const holder = globalThis as unknown as Record<symbol, boolean | undefined>
    delete holder[bannerPrintedFlag]
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    printBanner({ force: true })
    printBanner({ force: true })
    expect(log).toHaveBeenCalledTimes(1)
    log.mockRestore()
    delete holder[bannerPrintedFlag]
  })
})

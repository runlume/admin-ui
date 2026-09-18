import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Counter = { count: ReturnType<typeof vi.fn> }

/** 每个用例都重新导入模块：`lastPath` 是模块级状态，必须从干净状态开始。 */
async function loadTracker(counter?: Counter) {
  vi.resetModules()
  if (counter) vi.stubGlobal('goatcounter', counter)
  const tracker = await import('@/lib/analytics')
  return tracker.trackPageview
}

describe('trackPageview', () => {
  beforeEach(() => {
    // 初始路径要可预期，用例里用它当"整页加载已经计过"的入口页。
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('入口页不重复上报：整页加载那一次已经由 count.js 计过', async () => {
    const count = vi.fn()
    const track = await loadTracker({ count })

    track('/')

    expect(count).not.toHaveBeenCalled()
  })

  it('切到新路径时上报，且带上路径', async () => {
    const count = vi.fn()
    const track = await loadTracker({ count })

    track('/guide/intro')
    track('/guide/theme?tab=color')

    expect(count).toHaveBeenNthCalledWith(1, { path: '/guide/intro' })
    expect(count).toHaveBeenNthCalledWith(2, { path: '/guide/theme?tab=color' })
  })

  it('同一路径连续上报只算一次，重复渲染不会多记', async () => {
    const count = vi.fn()
    const track = await loadTracker({ count })

    track('/customers')
    track('/customers')
    track('/customers')

    expect(count).toHaveBeenCalledTimes(1)
  })

  it('回到访问过的路径算新的一次浏览', async () => {
    const count = vi.fn()
    const track = await loadTracker({ count })

    track('/customers')
    track('/settings')
    track('/customers')

    expect(count).toHaveBeenCalledTimes(3)
  })

  it('订阅晚于第一次导航时，新路径照样上报', async () => {
    const count = vi.fn()
    const track = await loadTracker({ count })
    // 路由已经切走，第一条通知才到：入口路径按模块求值时的地址判定，不能被误当入口页吞掉。
    window.history.replaceState({}, '', '/customers')

    track('/customers')

    expect(count).toHaveBeenCalledWith({ path: '/customers' })
  })

  it('脚本没加载成功时不报错，其余逻辑照常', async () => {
    const track = await loadTracker()

    expect(() => track('/customers')).not.toThrow()
  })
})

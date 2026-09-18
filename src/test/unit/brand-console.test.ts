import { describe, expect, it } from 'vitest'
import { brandConsoleMessages } from '@/lib/brand-console'

describe('控制台品牌输出', () => {
  it('中文环境输出品牌、驱动与站点', () => {
    const [brand] = brandConsoleMessages('zh-CN')
    expect(brand?.text).toContain('由')
    expect(brand?.text).toContain('Runlume')
    expect(brand?.text).toContain('admin-design')
    expect(brand?.text).toContain('https://runlume.app')
  })

  it('英文环境换成英文前缀', () => {
    const [brand] = brandConsoleMessages('en-US')
    expect(brand?.text.startsWith('%cPowered by')).toBe(true)
    expect(brand?.text).toContain('Runlume')
    expect(brand?.text).toContain('admin-design')
  })

  it('每个 %c 占位符都有对应样式', () => {
    for (const lang of ['zh-CN', 'en-US']) {
      for (const message of brandConsoleMessages(lang)) {
        expect(message.styles?.length).toBe(message.text.split('%c').length - 1)
      }
    }
  })

  it('附带控制台安全提示', () => {
    const messages = brandConsoleMessages('zh-CN')
    expect(messages.at(-1)?.text).toContain('请勿')
  })
})

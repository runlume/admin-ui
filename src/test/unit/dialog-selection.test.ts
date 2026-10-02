import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// 测试以包根为工作目录运行；jsdom 环境下 import.meta.url 不是文件 URL，直接按包根解析。
const stylesheet = readFileSync(resolve(process.cwd(), 'src/components.css'), 'utf8')

/**
 * 浮层内容可选中是组件库对宿主的保证：宿主页面可能给祖先节点设置
 * `user-select: none`，继承进浮层后表现为"弹窗里的字选不中、复制不了"。
 * jsdom 不做样式计算，这里对源样式做结构断言，保证这条保证不会被误删。
 */
describe('浮层内容可选中', () => {
  it('弹窗、抽屉与悬浮卡片的内容显式声明可选中', () => {
    for (const slot of ['dialog-content', 'sheet-content', 'hover-card-content']) {
      expect(stylesheet).toContain(`[data-slot='${slot}']`)
    }
    const rule = stylesheet.slice(
      stylesheet.indexOf("[data-slot='dialog-content']:not([data-dragging])"),
    )
    expect(rule.slice(0, rule.indexOf('}'))).toContain('user-select: text')
  })

  it('拖动中的弹窗仍然不产生选中高亮', () => {
    expect(stylesheet).toContain('[data-draggable][data-dragging] {\n  user-select: none;\n}')
  })
})

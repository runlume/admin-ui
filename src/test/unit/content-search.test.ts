import { describe, expect, it } from 'vitest'
import { collectContentEntries, maxContentLength } from '@/lib/content-search'

/** jsdom 没有布局引擎，这里显式声明"可见"，只验证收集规则本身。 */
function visible(element: Element) {
  element.getClientRects = () => [{ width: 100, height: 20 }] as unknown as DOMRectList
}

function build(html: string) {
  const root = document.createElement('div')
  root.innerHTML = html
  root.querySelectorAll('*').forEach(visible)
  visible(root)
  return root
}

describe('页面内容索引', () => {
  it('收集文本节点所在元素：徽标这类 span 也能被搜到', () => {
    const root = build(`
      <div class="card">
        <span class="badge">待处理</span>
        <p>普通段落</p>
        <button>按钮文案</button>
      </div>
    `)
    const texts = collectContentEntries(root).map((entry) => entry.text)
    expect(texts).toEqual(['待处理', '普通段落', '按钮文案'])
  })

  it('跳过单字、重复文本与脚本样式', () => {
    const root = build(`
      <p>重复文案</p>
      <span>重复文案</span>
      <span>1</span>
      <style>.a{}</style>
    `)
    expect(collectContentEntries(root).map((entry) => entry.text)).toEqual(['重复文案'])
  })

  it('不可见文本不进索引（折叠面板、隐藏列）', () => {
    const root = build(`<p>可见文案</p><p class="hidden">隐藏文案</p>`)
    const hidden = root.querySelector('.hidden') as HTMLElement
    hidden.getClientRects = () => [] as unknown as DOMRectList
    expect(collectContentEntries(root).map((entry) => entry.text)).toEqual(['可见文案'])
  })

  it('祖先被标 aria-hidden 时仍然索引（Radix 打开模态框会给整棵树加）', () => {
    const root = build(`<div aria-hidden="true"><p>模态框打开时的页面文案</p></div>`)
    expect(collectContentEntries(root).map((entry) => entry.text)).toEqual([
      '模态框打开时的页面文案',
    ])
  })

  it('超长文本截断，条数受上限约束', () => {
    const root = build(`<p>${'长'.repeat(maxContentLength + 50)}</p><p>第二条</p>`)
    const entries = collectContentEntries(root, 1)
    expect(entries).toHaveLength(1)
    expect(entries[0]?.text).toHaveLength(maxContentLength)
  })
})

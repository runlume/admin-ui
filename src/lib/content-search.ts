/**
 * 页面内容索引（命令面板用）。
 *
 * 做法：遍历主内容区里的**文本节点**，用文本所在元素作为定位目标。
 * 早期版本只扫固定标签（h1/h2/p/li/td/button/a），像状态徽标这种 `<span>`
 * 里的文字根本进不了索引，所以"页面上明明有却搜不到"——按文本节点收集就没有这个问题。
 */

export type ContentEntry = {
  key: string
  text: string
  element: HTMLElement
}

/** 单条文本上限：再长也只是命中片段，留着会拖慢匹配。 */
export const maxContentLength = 240
/** 索引条数上限：防止超大页面（图标墙、长日志）拖慢每次按键。 */
export const maxContentEntries = 800

/**
 * 只跳过脚本样式与命令面板自身。
 * 注意不要按 `[aria-hidden="true"]` 过滤：Radix 打开模态框时会给整棵应用树加上它，
 * 那样整页内容都会被跳过（搜索会变成永远空结果）。
 */
const skipSelector = '[data-slot="menu-search"], [role="dialog"], script, style'

/** 收集可见文本；调用方负责传入主内容区根节点。 */
export function collectContentEntries(
  root: HTMLElement,
  limit = maxContentEntries,
): ContentEntry[] {
  const entries: ContentEntry[] = []
  const seen = new Set<string>()
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    const raw = node.textContent ?? ''
    const element = node.parentElement
    node = walker.nextNode()
    const text = raw.replace(/\s+/g, ' ').trim()
    if (!element || text.length < 2) continue
    if (element.closest(skipSelector)) continue
    // 折叠面板、隐藏列这类不可见文本不参与搜索
    if (element.getClientRects().length === 0) continue
    const value = text.length > maxContentLength ? text.slice(0, maxContentLength) : text
    if (seen.has(value)) continue
    seen.add(value)
    entries.push({ key: `${element.tagName}-${entries.length}`, text: value, element })
    if (entries.length >= limit) break
  }
  return entries
}

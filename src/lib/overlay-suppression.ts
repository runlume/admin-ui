import * as React from 'react'

type AnyRef<T> = React.Ref<T> | undefined

export function composeRefs<T>(...refs: AnyRef<T>[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node
    }
  }
}

type Ownership = { count: number; added: boolean }

/** 每个被施加 `inert` 的元素记一份引用计数，多个浮层叠加时不会互相撤销。 */
const owners = new WeakMap<Element, Ownership>()

/**
 * 把 `node` 之外的页面内容标记为 `inert`，返回撤销函数。
 *
 * 遍历方式与 Radix 内部的 `hideOthers` 一致：沿 `node` 的祖先链向下递归，跳过
 * 祖先链本身，其余兄弟节点整体标为 inert。不直接复用 `aria-hidden` 包的
 * `suppressOthers`，因为它的引用计数在 `aria-hidden` 与 `inert` 之间共享，
 * 而我们的撤销时机与 Radix 不同，会让 `inert` 永远留在背景上、页面再也点不动。
 */
function suppressBackground(node: Element) {
  const keep = new Set<Element>()
  for (let current: Element | null = node; current; current = current.parentElement) {
    keep.add(current)
  }

  const touched: Element[] = []
  const mark = (element: Element) => {
    const ownership = owners.get(element) ?? { count: 0, added: false }
    if (ownership.count === 0 && !element.hasAttribute('inert')) {
      element.setAttribute('inert', '')
      ownership.added = true
    }
    ownership.count += 1
    owners.set(element, ownership)
    touched.push(element)
  }
  const walk = (parent: Element) => {
    // 到达浮层内容本身即停止：它和它的子树都是浮层，不能被算作"背景"。
    // Radix 的 hideOthers 同样在 target 处 early return，漏掉这步会把菜单项设成 inert。
    if (parent === node) return
    for (const child of Array.from(parent.children)) {
      if (keep.has(child)) walk(child)
      else mark(child)
    }
  }
  walk(node.ownerDocument.body)
  console.debug('[suppress] start', node.getAttribute('data-slot'), touched.length)

  return () => {
    console.debug('[suppress] undo', node.getAttribute('data-slot'), touched.length)
    for (const element of touched) {
      const ownership = owners.get(element)
      if (!ownership) continue
      ownership.count -= 1
      if (ownership.count <= 0) {
        if (ownership.added) element.removeAttribute('inert')
        owners.delete(element)
      }
    }
  }
}

/**
 * 模态浮层打开时让背景真正不可交互。
 *
 * Radix 只用 `aria-hidden` 把背景移出无障碍树，背景里的输入框、链接、按钮仍然留在
 * Tab 顺序里：屏幕阅读器看不到、键盘却能走过去，axe 的 `aria-hidden-focus` 也会报错。
 * 原生 `<dialog>.showModal()` 的做法是把背景设为 `inert`，这里补齐同一语义。
 *
 * 只补 `inert`，不改动 Radix 自己写入的 `aria-hidden`；两者范围一致，叠加后背景
 * 既不在无障碍树里、也不在 Tab 顺序里，浮层卸载时按引用计数撤销自己的 `inert`。
 * 仅用于模态浮层；非模态浮层（如 Popover 默认行为）不应使用。
 *
 * 返回的是回调 ref：我们的封装外面还套着 Radix 的 `Presence`，组件挂载时浮层内容
 * 往往还没渲染，必须等内容节点真正出现（以及卸载时置空）才能施加与撤销。
 * 调用方应把它与其它 ref 用 `useMemo` 组合，避免每次渲染重建导致反复摘挂。
 *
 * @param active 浮层是否处于打开态，默认按内容节点挂载/卸载判断。Radix Select 关闭时
 *   只把内容节点移出文档、并不卸载 React 组件（拿不到 ref 置空），必须显式传入打开态，
 *   否则背景会一直停在 `inert` 上，页面再也点不动。
 */
export function useOverlayBackgroundSuppression<T extends HTMLElement>(active = true) {
  const [node, setNode] = React.useState<T | null>(null)
  React.useEffect(() => {
    if (!node || !active) return
    return suppressBackground(node)
  }, [node, active])
  return React.useCallback((next: T | null) => setNode(next), [])
}

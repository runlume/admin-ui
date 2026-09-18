import type { ComponentType } from 'react'

/**
 * 菜单图标：lucide 图标与自绘 SVG（例如 GitHub 标识）都只需要这两个属性。
 * 用 `LucideIcon` 会把自绘图标挡在外面，所以这里收窄成最小契约。
 */
export type NavigationIcon = ComponentType<{
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}>

/**
 * 侧栏菜单项。`label` 可以直接是显示文案，也可以是 i18n key；两种写法都会经过
 * `t()`，未登记的 key 会原样显示，因此业务系统可以先写中文再逐步接入语言包。
 */
export type NavigationItem = {
  path: string
  label: string
  icon: NavigationIcon
  /**
   * 外链配置：存在即表示这条菜单指向站外。
   * - `target: 'blank' | 'self'`：直接打开站外地址（用 `<a>`，不走路由）；
   * - `target: 'iframe'`：`path` 是站内路由，页面内容用 iframe 内嵌 `url`。
   */
  external?: { url: string; target: NavigationLinkTarget }
  /**
   * 子菜单。带 `children` 的节点在侧栏是可展开的容器，
   * 容器本身也可以有页面（点标题展开、点叶子跳转）。层级建议不超过 3 级。
   */
  children?: NavigationItem[]
}

/** 外链打开方式：新窗口（默认）/ 当前窗口 / 站内 iframe 内嵌。 */
export type NavigationLinkTarget = 'blank' | 'self' | 'iframe'

/**
 * 菜单分组。`paths` 声明该组负责哪些一级路由，顺序同时决定组内菜单顺序。
 * 未出现在任何分组 `paths` 中的菜单项回落到第一个分组，避免新增页面漏挂菜单。
 */
export type NavigationGroupDefinition = {
  id: string
  label: string
  icon: NavigationIcon
  paths: string[]
}

export type NavigationGroup = Omit<NavigationGroupDefinition, 'paths'> & {
  items: NavigationItem[]
  /** 该分组下全部菜单路径（含子菜单）：激活判定与收藏用，避免每次渲染再走一遍菜单树 */
  paths: string[]
}

export type FlatNavigationEntry = {
  item: NavigationItem
  /** 层级，顶级为 0 */
  depth: number
  /** 从根到父节点的链路，用于面包屑 */
  parents: NavigationItem[]
}

/** 深度优先展开（含自身）。搜索、收藏、页签、标题解析都基于它。 */
export function flattenNavigation(items: readonly NavigationItem[]): FlatNavigationEntry[] {
  return items.flatMap((item) => [
    { item, depth: 0, parents: [] as NavigationItem[] },
    ...flattenEntries(item.children ?? [], 1, [item]),
  ])
}

function flattenEntries(
  items: readonly NavigationItem[],
  depth: number,
  parents: NavigationItem[],
): FlatNavigationEntry[] {
  return items.flatMap((item) => [
    { item, depth, parents },
    ...flattenEntries(item.children ?? [], depth + 1, [...parents, item]),
  ])
}

/** 子树里的全部路径（含自身）：分组归属、激活判定、权限过滤都用它。 */
export function navigationPaths(item: NavigationItem): string[] {
  return [item.path, ...(item.children ?? []).flatMap((child) => navigationPaths(child))]
}

/** 该节点是否（自身或子孙）命中当前路径。 */
export function containsActivePath(item: NavigationItem, activePath?: string): boolean {
  return Boolean(activePath) && navigationPaths(item).includes(activePath as string)
}

/** 是否是"点开就离开本站"的外链（iframe 内嵌不算）。 */
export function isLeavingApp(item: Pick<NavigationItem, 'external'>): boolean {
  return Boolean(item.external && item.external.target !== 'iframe')
}

export function groupNavigation(
  items: NavigationItem[],
  definitions: NavigationGroupDefinition[],
): NavigationGroup[] {
  const fallbackId = definitions[0]?.id
  /** 顶层项归属哪个分组：看它的子树里有没有该分组的声明路径；顺序取最靠前的命中。 */
  const groupIndexOf = (item: NavigationItem, group: NavigationGroupDefinition) =>
    navigationPaths(item)
      .map((path) => group.paths.indexOf(path))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0] ?? Number.MAX_SAFE_INTEGER
  return definitions
    .map((group) => ({
      id: group.id,
      label: group.label,
      icon: group.icon,
      items: items
        .filter((item) => {
          const index = groupIndexOf(item, group)
          if (index !== Number.MAX_SAFE_INTEGER) return true
          // 没被任何分组声明过的菜单回落到第一个分组，避免新增页面漏挂菜单。
          return (
            group.id === fallbackId &&
            !definitions.some((entry) => groupIndexOf(item, entry) !== Number.MAX_SAFE_INTEGER)
          )
        })
        .sort((a, b) => groupIndexOf(a, group) - groupIndexOf(b, group)),
      paths: [] as string[],
    }))
    .map((group) => ({ ...group, paths: group.items.flatMap((item) => navigationPaths(item)) }))
    .filter((group) => group.items.length > 0)
}

/** 未配置分组时的兜底：全部菜单放在一个分组里。 */
export function singleGroup(label: string, icon: NavigationIcon): NavigationGroupDefinition[] {
  return [{ id: 'workspace', label, icon, paths: [] }]
}

/**
 * 解析当前路由对应的菜单项：先精确匹配，再匹配最长的一级父路径。
 * 动态详情页（`/customers/42`）因此仍能高亮 `/customers`。
 */
export function resolveActiveItem(navigation: NavigationItem[], pathname: string) {
  const entries = flattenNavigation(navigation)
  const exact = entries.find((entry) => entry.item.path === pathname)
  if (exact) {
    return { current: exact.item, parents: exact.parents, activePath: exact.item.path }
  }
  const nearest = entries
    .filter((entry) => entry.item.path !== '/' && pathname.startsWith(`${entry.item.path}/`))
    .sort((a, b) => b.item.path.length - a.item.path.length)[0]
  if (!nearest) {
    return { current: undefined, parents: [] as NavigationItem[], activePath: undefined }
  }
  return {
    current: undefined,
    parents: [...nearest.parents, nearest.item],
    activePath: nearest.item.path,
  }
}

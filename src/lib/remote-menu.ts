/**
 * 后台菜单（动态路由）的纯逻辑：把接口返回的菜单归一成可以安全渲染的结构。
 *
 * 这一层不碰 React，也不认识接口客户端：业务系统把自己的响应塞进
 * `normalizeRemoteMenu()`，拿到归一结果后再合并本地菜单、注册路由。
 * 非法条目一律丢弃并写进 `warnings`，避免一条脏数据把整个菜单打挂。
 */

import {
  matchPermissions,
  normalizeRequirement,
  type PermissionCode,
  type PermissionRequirement,
} from './permissions'
import type { NavigationLinkTarget } from './navigation'

export type RemoteMenuGroup = {
  id: string
  /** 直接显示文案；与 `labelKey` 二选一，都没给就用分组 id */
  label?: string
  /** i18n key */
  labelKey?: string
  /** 图标名，接受 `chart-line` / `ChartLine` / `chart_line` */
  icon?: string
  /** 分组排序，越小越靠前 */
  order?: number
}

export type RemoteMenuItem = {
  /**
   * 站内路径。外链（`external` + `target: 'blank' | 'self'`）可以不写，
   * 会自动用地址兜底；`target: 'iframe'` 必须给，用来注册内嵌页面的路由。
   */
  path?: string
  /** 外链地址：给了就是外链菜单 */
  external?: string
  /** 打开方式：`blank`（默认）/ `self` / `iframe`；也接受 `_blank`、`new-window` 这类写法 */
  target?: string
  label?: string
  labelKey?: string
  icon?: string
  /** 页面组件键，例如 `reports-page`；不传表示指向已有的本地路由 */
  component?: string
  /** 归属分组 id；不存在时落到 `fallbackGroupId` */
  group?: string
  order?: number
  /** 只注册路由、不出现在菜单里（详情页、灰度页面） */
  hidden?: boolean
  /** 需要的权限码；支持数组与 `module:*` 通配。菜单按它过滤，路由按它守门 */
  permission?: PermissionCode | readonly PermissionCode[]
}

export type RemoteMenuPayload = {
  groups?: RemoteMenuGroup[]
  items?: RemoteMenuItem[]
}

export type NormalizedMenuGroup = {
  id: string
  label: string
  labelKey?: string
  icon?: string
  order: number
}

export type NormalizedMenuItem = {
  path: string
  label: string
  labelKey?: string
  icon?: string
  component?: string
  group: string
  order: number
  hidden: boolean
  permission: readonly PermissionCode[]
  children: NormalizedMenuItem[]
  /** 外链信息：内部菜单为 undefined */
  external?: { url: string; target: NavigationLinkTarget }
}

export type NormalizedRemoteMenu = {
  groups: NormalizedMenuGroup[]
  items: NormalizedMenuItem[]
  /** 被丢弃或降级的条目说明，接真实接口时用来排查 */
  warnings: string[]
}

export type RemoteRoute = {
  path: string
  /** 本地组件键（站内页面） */
  component?: string
  /** iframe 内嵌页面的地址 */
  url?: string
  /** 菜单文案或 i18n key，内嵌页拿它当标题 */
  label: string
  /** 守卫用：直接访问也需要这个权限 */
  permission: readonly PermissionCode[]
}

/** 菜单层级上限：防止接口返回的病态嵌套把侧栏撑爆。 */
export const maxMenuDepth = 4

export const fallbackGroupId = 'remote'

/** 打开方式归一：兼容 `_blank` / `new-window` / `newWindow` 等写法。 */
export function normalizeLinkTarget(value: unknown): NavigationLinkTarget {
  const text = typeof value === 'string' ? value.trim().toLowerCase().replace(/_/g, '-') : ''
  if (['self', 'same', 'same-window', 'current', 'current-window'].includes(text)) return 'self'
  if (['iframe', 'embed', 'inner'].includes(text)) return 'iframe'
  return 'blank'
}

function asText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function asOrder(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function asObject(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

/** 菜单路径归一：补前导斜杠、去掉末尾斜杠（根路径除外）。 */
export function normalizeMenuPath(path: string): string {
  const trimmed = path.trim().split('?')[0]?.split('#')[0] ?? ''
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const collapsed = withSlash.replace(/\/{2,}/g, '/')
  return collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : collapsed
}

/**
 * 归一后台菜单。`fallbackGroupId` / `fallbackGroupLabel` 是没有分组信息时的兜底。
 */
export function normalizeRemoteMenu(
  payload: unknown,
  options: { fallbackGroupId?: string; fallbackGroupLabel?: string } = {},
): NormalizedRemoteMenu {
  const warnings: string[] = []
  const payloadObject = asObject(payload)
  if (!payloadObject) {
    return {
      groups: [],
      items: [],
      warnings: ['菜单响应不是对象，已忽略。'],
    }
  }

  const fallbackId = options.fallbackGroupId ?? fallbackGroupId
  const groups: NormalizedMenuGroup[] = []
  const rawGroups = Array.isArray(payloadObject.groups) ? payloadObject.groups : []
  rawGroups.forEach((entry, index) => {
    const group = asObject(entry)
    const id = asText(group?.id)
    if (!group || !id) {
      warnings.push(`第 ${index + 1} 个分组缺少 id，已忽略。`)
      return
    }
    if (groups.some((item) => item.id === id)) {
      warnings.push(`分组 ${id} 重复，已忽略后出现的那个。`)
      return
    }
    groups.push({
      id,
      label: asText(group.label) ?? asText(group.labelKey) ?? id,
      labelKey: asText(group.labelKey),
      icon: asText(group.icon),
      order: asOrder(group.order) ?? index,
    })
  })

  const knownGroupIds = new Set(groups.map((group) => group.id))
  if (!knownGroupIds.size) {
    groups.push({
      id: fallbackId,
      label: options.fallbackGroupLabel ?? fallbackId,
      order: 0,
    })
    knownGroupIds.add(fallbackId)
  }

  const items: NormalizedMenuItem[] = []
  const rawItems = Array.isArray(payloadObject.items) ? payloadObject.items : []
  /** 全树共享：路径必须全局唯一，否则菜单与路由都会撞车。 */
  const seenPaths = new Set<string>()

  const normalizeItem = (
    entry: unknown,
    index: number,
    context: {
      /** 默认分组：子项跟随父项 */
      group: string
      /** 父级权限：子项没写就继承 */
      permission: readonly PermissionCode[]
      /** 父级隐藏：子项一并隐藏（路由仍然注册） */
      hidden: boolean
      depth: number
      /** warning 里用来定位，例如 `报表中心 的` */
      trail: string
    },
  ): NormalizedMenuItem | undefined => {
    const item = asObject(entry)
    const pathText = asText(item?.path)
    const externalUrl = asText(item?.external)
    if (!item || (!pathText && !externalUrl)) {
      warnings.push(`${context.trail}第 ${index + 1} 项缺少 path，已忽略。`)
      return undefined
    }
    const target = normalizeLinkTarget(item.target)
    if (externalUrl && target === 'iframe' && !pathText) {
      warnings.push(`内嵌外链 ${externalUrl} 缺少 path（内嵌页面需要一个站内路径），已忽略。`)
      return undefined
    }
    // 站内路径：内链必填；外链没写时用地址兜底（地址只作菜单 key，不参与路由）
    const path = pathText ? normalizeMenuPath(pathText) : (externalUrl as string)
    if (pathText && !pathText.startsWith('/')) {
      warnings.push(`菜单项 ${pathText} 不是站内路径，已按 ${path} 处理。`)
    }
    if (seenPaths.has(path)) {
      warnings.push(`菜单路径 ${path} 重复，已忽略后出现的那个。`)
      return undefined
    }
    if (context.depth > maxMenuDepth) {
      warnings.push(`菜单项 ${path} 超过 ${maxMenuDepth} 层，已忽略。`)
      return undefined
    }
    seenPaths.add(path)

    const groupId = asText(item.group)
    const resolvedGroup = groupId && knownGroupIds.has(groupId) ? groupId : context.group
    if (groupId && resolvedGroup !== groupId) {
      warnings.push(`菜单项 ${path} 的分组 ${groupId} 不存在，已落到 ${context.group}。`)
    }

    const ownPermission = normalizeRequirement(item.permission as PermissionRequirement)
    const permission = ownPermission.length ? ownPermission : context.permission
    const hidden = item.hidden === true || context.hidden
    const children = (Array.isArray(item.children) ? item.children : [])
      .map((child, childIndex) =>
        normalizeItem(child, childIndex, {
          group: resolvedGroup,
          permission,
          hidden,
          depth: context.depth + 1,
          trail: `${path} 的`,
        }),
      )
      .filter((child): child is NormalizedMenuItem => Boolean(child))

    return {
      path,
      label: asText(item.label) ?? asText(item.labelKey) ?? path,
      labelKey: asText(item.labelKey),
      icon: asText(item.icon),
      component: asText(item.component),
      group: resolvedGroup,
      order: asOrder(item.order) ?? index,
      hidden,
      permission,
      children,
      ...(externalUrl ? { external: { url: externalUrl, target } } : {}),
    }
  }

  rawItems.forEach((entry, index) => {
    const item = normalizeItem(entry, index, {
      group: fallbackId,
      permission: [],
      hidden: false,
      depth: 1,
      trail: '',
    })
    if (item) items.push(item)
  })

  const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order
  const sortTree = (list: NormalizedMenuItem[]): NormalizedMenuItem[] =>
    [...list].sort(byOrder).map((item) => ({ ...item, children: sortTree(item.children) }))
  return {
    groups: [...groups].sort(byOrder),
    items: sortTree(items),
    warnings,
  }
}

/** 需要注册成路由的项：声明了 component 且路径可用（含任意层级的子项）。 */
export function remoteRoutes(menu: NormalizedRemoteMenu): RemoteRoute[] {
  const collect = (items: readonly NormalizedMenuItem[]): RemoteRoute[] =>
    items.flatMap((item) => [
      ...(item.external
        ? item.external.target === 'iframe'
          ? [
              {
                path: item.path,
                url: item.external.url,
                label: item.labelKey ?? item.label,
                permission: item.permission,
              },
            ]
          : []
        : item.component
          ? [
              {
                path: item.path,
                component: item.component,
                label: item.labelKey ?? item.label,
                permission: item.permission,
              },
            ]
          : []),
      ...collect(item.children),
    ])
  return collect(menu.items)
}

/**
 * 菜单里要显示的项：排除 hidden、按权限过滤，并递归处理子菜单。
 * 纯容器（没有页面、子项又全部不可见）整条不显示。
 */
export function visibleMenuItems(
  menu: NormalizedRemoteMenu,
  granted: readonly PermissionCode[] = [],
): NormalizedMenuItem[] {
  const filter = (items: readonly NormalizedMenuItem[]): NormalizedMenuItem[] =>
    items.flatMap((item) => {
      if (item.hidden || !matchPermissions(granted, item.permission)) return []
      const children = filter(item.children)
      const containerOnly = item.children.length > 0 && !item.component
      if (containerOnly && !children.length) return []
      return [{ ...item, children }]
    })
  return filter(menu.items)
}

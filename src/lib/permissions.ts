/**
 * 前端权限判定（纯逻辑）。
 *
 * 权限码由身份服务下发，形如 `customer:view`。前端只做"能不能看见 / 能不能点"的展示层
 * 判断——**真正的鉴权必须在服务端**，这里挡住的只是误操作与脏 URL。
 */

/** 业务系统接自己的权限码时，直接换掉这个类型即可。 */
export type PermissionCode = string

/**
 * 需要满足的权限：单个码、多个码（默认"任一满足"），或直接给 `false` 表示不需要权限。
 * `undefined` / 空数组同样表示不需要权限。
 */
export type PermissionRequirement = PermissionCode | readonly PermissionCode[] | undefined

/**
 * 单个权限码判定，支持三种写法：
 * - `*`：拥有全部权限；
 * - `report:*`：拥有该模块下的全部权限；
 * - `customer:view`：精确匹配。
 */
export function matchPermission(
  granted: readonly PermissionCode[] = [],
  required: PermissionCode,
): boolean {
  return granted.some((code) => {
    if (code === '*' || code === required) return true
    const prefix = code.endsWith(':*') ? code.slice(0, -1) : undefined
    return prefix ? required.startsWith(prefix) : false
  })
}

/** 多码判定：`every` 为 true 时要求全部满足，默认"任一满足"。 */
export function matchPermissions(
  granted: readonly PermissionCode[] = [],
  required: PermissionRequirement,
  mode: 'any' | 'all' = 'any',
): boolean {
  const list = normalizeRequirement(required)
  if (!list.length) return true
  return mode === 'all'
    ? list.every((code) => matchPermission(granted, code))
    : list.some((code) => matchPermission(granted, code))
}

export function normalizeRequirement(required: PermissionRequirement): PermissionCode[] {
  if (!required) return []
  const list = Array.isArray(required) ? required : [required]
  return list.filter((code): code is PermissionCode => typeof code === 'string' && code.length > 0)
}

/** 按权限过滤列表（菜单、操作项）。没有声明权限的条目视为公开。 */
export function filterByPermission<T extends { permission?: PermissionRequirement }>(
  items: readonly T[],
  granted: readonly PermissionCode[] = [],
): T[] {
  return items.filter((item) => matchPermissions(granted, item.permission))
}

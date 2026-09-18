import type { ReactNode } from 'react'
import { ForbiddenPage } from '@/components/page'
import { usePermission } from '@/lib/permission-context'
import type { PermissionRequirement } from '@/lib/permissions'

/**
 * 按钮 / 区块级鉴权：没有权限时不渲染 `children`，可以用 `fallback` 换成禁用态。
 *
 * ```tsx
 * <Can permission="customer:create"><Button>新建客户</Button></Can>
 * <Can permission="customer:export" fallback={<Button disabled>导出</Button>}>…</Can>
 * ```
 */
export function Can({
  permission,
  fallback = null,
  children,
}: {
  permission: PermissionRequirement
  fallback?: ReactNode
  children: ReactNode
}) {
  const { can } = usePermission()
  return <>{can(permission) ? children : fallback}</>
}

/**
 * 路由级守卫：菜单里看不到、但直接敲 URL 进来的页面在这里被拦成 403。
 * 不传 `permission` 时直接放行（给需要临时开关的页面用）。
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission?: PermissionRequirement
  children: ReactNode
}) {
  const { can } = usePermission()
  if (!can(permission)) return <ForbiddenPage />
  return <>{children}</>
}

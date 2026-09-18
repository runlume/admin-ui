import { createContext, useContext, useMemo } from 'react'
import {
  matchPermission,
  matchPermissions,
  type PermissionCode,
  type PermissionRequirement,
} from './permissions'

/**
 * 权限上下文。默认值是空数组：**没挂在 Provider 里就按"无任何权限"处理**，
 * 避免忘记接线时把所有按钮和菜单都放出去。
 */
export const PermissionContext = createContext<readonly PermissionCode[]>([])

export type PermissionApi = {
  permissions: readonly PermissionCode[]
  /** 单个权限码判定（支持 `*` 与 `module:*`）。 */
  can: (required: PermissionRequirement) => boolean
  /** 全部满足。 */
  canAll: (required: PermissionRequirement) => boolean
  /** 任一满足。 */
  canAny: (required: PermissionRequirement) => boolean
}

export function usePermission(): PermissionApi {
  const permissions = useContext(PermissionContext)
  return useMemo(
    () => ({
      permissions,
      can: (required) => {
        if (typeof required === 'string') return matchPermission(permissions, required)
        return matchPermissions(permissions, required)
      },
      canAll: (required) => {
        if (typeof required === 'string') return matchPermission(permissions, required)
        return matchPermissions(permissions, required, 'all')
      },
      canAny: (required) => {
        if (typeof required === 'string') return matchPermission(permissions, required)
        return matchPermissions(permissions, required, 'any')
      },
    }),
    [permissions],
  )
}

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PermissionProvider } from '@/app/permission-provider'
import { Can, RequirePermission } from '@/components/permission'
import '@/lib/i18n'

describe('权限组件', () => {
  it('Can：有权限渲染 children，没权限渲染 fallback', () => {
    render(
      <PermissionProvider permissions={['example.admin.customer.view']}>
        <Can permission="example.admin.customer.view">
          <span>新建</span>
        </Can>
        <Can permission="example.admin.customer.export" fallback={<span>导出（无权限）</span>}>
          <span>导出</span>
        </Can>
      </PermissionProvider>,
    )
    expect(screen.getByText('新建')).toBeInTheDocument()
    expect(screen.getByText('导出（无权限）')).toBeInTheDocument()
  })

  it('Can：通配权限同样生效', () => {
    render(
      <PermissionProvider permissions={['example.admin.customer.*']}>
        <Can permission="example.admin.customer.export">
          <span>导出</span>
        </Can>
      </PermissionProvider>,
    )
    expect(screen.getByText('导出')).toBeInTheDocument()
  })

  it('RequirePermission：没有权限时渲染 403，而不是页面内容', () => {
    render(
      <PermissionProvider permissions={['example.admin.report.view']}>
        <RequirePermission permission="example.admin.audit.view">
          <span>操作日志内容</span>
        </RequirePermission>
      </PermissionProvider>,
    )
    expect(screen.getByText('没有访问权限')).toBeInTheDocument()
    expect(screen.queryByText('操作日志内容')).not.toBeInTheDocument()
  })

  it('没有挂 Provider 时按无权限处理', () => {
    render(
      <Can permission="example.admin.customer.view">
        <span>新建</span>
      </Can>,
    )
    expect(screen.queryByText('新建')).not.toBeInTheDocument()
  })
})

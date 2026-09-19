import { describe, expect, it } from 'vitest'
import { normalizeRemoteMenu, remoteRoutes, visibleMenuItems } from '@/lib/remote-menu'

const payload = {
  groups: [
    { id: 'insight', label: '数据洞察', icon: 'chart-line', order: 2 },
    { id: 'ops', labelKey: 'sample.navGroupOps', order: 1 },
  ],
  items: [
    {
      path: '/audit',
      label: '操作日志',
      component: 'audit-page',
      group: 'ops',
      order: 2,
      permission: 'example.admin.audit.view',
    },
    {
      path: '/reports',
      labelKey: 'sample.navReports',
      component: 'reports-page',
      group: 'insight',
      order: 1,
    },
    {
      path: '/reports/deep/',
      label: '详情',
      component: 'reports-page',
      group: 'insight',
      hidden: true,
    },
    { path: '/export', component: 'reports-page', group: 'unknown-group' },
  ],
}

describe('后台菜单归一', () => {
  it('按 order 排序，路径归一，label 支持文案与 key', () => {
    const menu = normalizeRemoteMenu(payload)
    expect(menu.groups.map((group) => group.id)).toEqual(['ops', 'insight'])
    // order 显式给了就按 order；没给的按数组下标（导出项在第 4 位）
    expect(menu.items.map((item) => item.path)).toEqual([
      '/reports',
      '/audit',
      '/reports/deep',
      '/export',
    ])
    expect(menu.items[0]).toMatchObject({
      label: 'sample.navReports',
      labelKey: 'sample.navReports',
    })
    // 末尾斜杠被去掉，根路径除外
    expect(menu.items[2]?.path).toBe('/reports/deep')
    // 没给 label 时用路径兜底
    expect(menu.items[3]?.label).toBe('/export')
  })

  it('未知分组落到兜底分组并写 warning', () => {
    const menu = normalizeRemoteMenu(payload)
    expect(menu.items[3]?.group).toBe('remote')
    expect(menu.warnings.join('\n')).toContain('unknown-group')
  })

  it('丢弃脏数据而不是整份菜单失败', () => {
    const menu = normalizeRemoteMenu({
      groups: [{ label: '缺少 id' }, { id: 'dup' }, { id: 'dup' }],
      items: [{ label: '缺少 path' }, null, { path: '/ok' }, { path: '/ok' }],
    })
    expect(menu.items.map((item) => item.path)).toEqual(['/ok'])
    expect(menu.warnings).toHaveLength(5)
  })

  it('非对象响应回落到空菜单', () => {
    const menu = normalizeRemoteMenu('boom')
    expect(menu.items).toEqual([])
    expect(menu.groups).toEqual([])
    expect(menu.warnings[0]).toContain('不是对象')
  })

  it('补齐前导斜杠并提示', () => {
    const menu = normalizeRemoteMenu({ items: [{ path: 'reports' }] })
    expect(menu.items[0]?.path).toBe('/reports')
    expect(menu.warnings[0]).toContain('不是站内路径')
  })

  it('按权限过滤菜单，但路由仍然注册（交给守卫落 403）', () => {
    const menu = normalizeRemoteMenu(payload)
    expect(visibleMenuItems(menu, []).map((item) => item.path)).toEqual(['/reports', '/export'])
    expect(
      visibleMenuItems(menu, ['example.admin.audit.view', 'example.admin.report.*']).map(
        (item) => item.path,
      ),
    ).toEqual(['/reports', '/audit', '/export'])
    expect(remoteRoutes(menu).map((route) => route.path)).toContain('/audit')
    expect(remoteRoutes(menu).find((route) => route.path === '/audit')?.permission).toEqual([
      'example.admin.audit.view',
    ])
  })
})

describe('层级菜单归一', () => {
  const nested = {
    groups: [{ id: 'insight', label: '数据洞察' }],
    items: [
      {
        path: '/insight',
        label: '经营分析',
        group: 'insight',
        permission: 'example.admin.report.*',
        children: [
          { path: '/reports', label: '报表中心', component: 'reports-page', order: 2 },
          {
            path: '/audit',
            label: '操作日志',
            component: 'audit-page',
            order: 1,
            permission: 'example.admin.audit.view',
          },
          {
            path: '/audit/login',
            label: '登录日志',
            component: 'audit-page',
            hidden: true,
          },
        ],
      },
    ],
  }

  it('递归归一子项，并按 order 排序', () => {
    const menu = normalizeRemoteMenu(nested)
    const parent = menu.items[0]
    expect(parent?.path).toBe('/insight')
    expect(parent?.children.map((child) => child.path)).toEqual([
      '/audit',
      '/reports',
      '/audit/login',
    ])
    // 子项继承父级分组与权限
    expect(parent?.children[1]).toMatchObject({
      group: 'insight',
      permission: ['example.admin.report.*'],
    })
    // 子项自己声明权限时以自己为准
    expect(parent?.children[0]?.permission).toEqual(['example.admin.audit.view'])
    // hidden 会被子项继承
    expect(parent?.children[2]?.hidden).toBe(true)
  })

  it('路由递归收集子项声明', () => {
    const menu = normalizeRemoteMenu(nested)
    // 顺序跟子项排序一致（/audit order=1 在前）
    expect(remoteRoutes(menu).map((route) => route.path)).toEqual([
      '/audit',
      '/reports',
      '/audit/login',
    ])
  })

  it('父级无权限时整棵子树都不出现', () => {
    const menu = normalizeRemoteMenu(nested)
    expect(visibleMenuItems(menu, ['example.admin.audit.view'])).toEqual([])
  })

  it('纯容器在子项全部不可见时不显示', () => {
    const menu = normalizeRemoteMenu(nested)
    // 菜单上写的是 `example.admin.report.*`（要求该资源权限），授权侧给通配即可满足
    const visible = visibleMenuItems(menu, ['example.admin.report.*'])
    expect(visible.map((item) => item.path)).toEqual(['/insight'])
    expect(visible[0]?.children.map((child) => child.path)).toEqual(['/reports'])
  })

  it('超过层级上限的嵌套被丢弃并写 warning', () => {
    const menu = normalizeRemoteMenu({
      items: [
        {
          path: '/a',
          children: [
            {
              path: '/b',
              children: [{ path: '/c', children: [{ path: '/d', children: [{ path: '/e' }] }] }],
            },
          ],
        },
      ],
    })
    expect(menu.warnings.join('\n')).toContain('超过 4 层')
    expect(remoteRoutes(menu)).toEqual([])
  })
})

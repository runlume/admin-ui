import { describe, expect, it } from 'vitest'
import { LayoutDashboard, Settings, UsersRound } from 'lucide-react'
import {
  flattenNavigation,
  groupNavigation,
  resolveActiveItem,
  navigationPaths,
  type NavigationGroupDefinition,
  type NavigationItem,
} from '@/lib/navigation'

const navigation: NavigationItem[] = [
  { path: '/', label: '概览', icon: LayoutDashboard },
  { path: '/customers', label: '客户', icon: UsersRound },
  { path: '/settings', label: '设置', icon: Settings },
]

const groups: NavigationGroupDefinition[] = [
  { id: 'business', label: '业务', icon: LayoutDashboard, paths: ['/', '/customers'] },
  { id: 'system', label: '系统', icon: Settings, paths: ['/settings'] },
]

describe('groupNavigation', () => {
  it('按声明顺序分组并排序组内菜单', () => {
    expect(groupNavigation(navigation, groups).map((group) => group.id)).toEqual([
      'business',
      'system',
    ])
    expect(groupNavigation(navigation, groups)[0]?.items.map((item) => item.path)).toEqual([
      '/',
      '/customers',
    ])
  })

  it('未登记分组的菜单落到第一个分组，避免新增页面漏挂菜单', () => {
    const extra = [...navigation, { path: '/orders', label: '订单', icon: UsersRound }]
    const result = groupNavigation(extra, groups)
    expect(result[0]?.items.map((item) => item.path)).toContain('/orders')
    expect(result[1]?.items.map((item) => item.path)).toEqual(['/settings'])
  })

  it('空分组不渲染', () => {
    expect(
      groupNavigation(navigation, [
        ...groups,
        { id: 'empty', label: '空', icon: Settings, paths: ['/missing'] },
      ]).map((group) => group.id),
    ).toEqual(['business', 'system'])
  })
})

describe('resolveActiveItem', () => {
  it('精确匹配时返回当前菜单项', () => {
    expect(resolveActiveItem(navigation, '/customers').activePath).toBe('/customers')
  })

  it('动态详情页回溯到最长的一级父路径', () => {
    const result = resolveActiveItem(navigation, '/customers/CUS-1001')
    expect(result.current).toBeUndefined()
    expect(result.activePath).toBe('/customers')
    expect(result.parents.map((item) => item.path)).toEqual(['/customers'])
  })
})

describe('层级菜单', () => {
  const nested: NavigationItem[] = [
    { path: '/', label: '概览', icon: LayoutDashboard },
    {
      path: '/insight',
      label: '经营分析',
      icon: Settings,
      children: [
        { path: '/reports', label: '报表中心', icon: UsersRound },
        {
          path: '/audit',
          label: '操作日志',
          icon: UsersRound,
          children: [{ path: '/audit/login', label: '登录日志', icon: UsersRound }],
        },
      ],
    },
  ]

  it('深度优先展开，带上层级与父级链路', () => {
    const flat = flattenNavigation(nested)
    expect(flat.map((entry) => entry.item.path)).toEqual([
      '/',
      '/insight',
      '/reports',
      '/audit',
      '/audit/login',
    ])
    expect(flat.find((entry) => entry.item.path === '/audit/login')).toMatchObject({
      depth: 2,
    })
    expect(
      flat.find((entry) => entry.item.path === '/audit/login')?.parents.map((item) => item.path),
    ).toEqual(['/insight', '/audit'])
  })

  it('子树路径用于分组归属与激活判定', () => {
    const insight = nested[1] as NavigationItem
    expect(navigationPaths(insight)).toEqual(['/insight', '/reports', '/audit', '/audit/login'])
    // 分组只声明了子路径，父节点也应归到该分组
    const grouped = groupNavigation(nested, [
      { id: 'insight', label: '数据洞察', icon: Settings, paths: ['/reports'] },
      { id: 'business', label: '业务', icon: LayoutDashboard, paths: ['/'] },
    ])
    expect(grouped.map((group) => group.id)).toEqual(['insight', 'business'])
    expect(grouped[0]?.items.map((item) => item.path)).toEqual(['/insight'])
  })

  it('命中子项时给出完整父级链路（面包屑用）', () => {
    const result = resolveActiveItem(nested, '/reports')
    expect(result.current?.path).toBe('/reports')
    expect(result.parents.map((item) => item.path)).toEqual(['/insight'])
    expect(result.activePath).toBe('/reports')
  })

  it('详情页回溯到最深的父节点', () => {
    const result = resolveActiveItem(nested, '/audit/login/42')
    expect(result.current).toBeUndefined()
    expect(result.activePath).toBe('/audit/login')
    expect(result.parents.map((item) => item.path)).toEqual(['/insight', '/audit', '/audit/login'])
  })
})

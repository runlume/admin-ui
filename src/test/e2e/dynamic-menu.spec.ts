import { expect, test } from '@playwright/test'

test('后台菜单下发的分组与菜单项出现在侧栏', async ({ page }) => {
  // 进入动态路由时所在分组与父级会自动展开，侧栏应出现分组、父级与子项
  await page.goto('/reports')
  await expect(page.getByRole('button', { name: '动态菜单' })).toBeVisible()
  await expect(page.getByRole('button', { name: '经营分析' })).toBeVisible()
  // 面包屑里的当前页也是 role=link，这里只看侧栏那一条
  await expect(page.getByRole('link', { name: '报表中心' }).first()).toBeVisible()
})

test('点击后台菜单进入动态路由页面', async ({ page }) => {
  await page.goto('/')
  // 「动态菜单」在默认展开分组里（设置 → 界面 → 默认展开），不用先点开分组
  await expect(page.getByRole('button', { name: '动态菜单' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  await page.getByRole('button', { name: '经营分析' }).click()
  await page.getByRole('link', { name: '报表中心' }).first().click()
  await expect(page).toHaveURL(/\/reports$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('报表中心')
  await expect(page.getByText('这是一个动态路由页面')).toBeVisible()
})

test('外链菜单项与容器同级：官网 / GitHub 仓库落在分组下，新窗口打开', async ({ page }) => {
  await page.goto('/reports')
  // 「经营分析」的父级链路是分组本身，说明外链项没有挂在它下面
  const group = page.getByRole('button', { name: '动态菜单' })
  await expect(group).toBeVisible()
  // 侧栏菜单项：顶栏也有一个同名仓库入口，所以按侧栏节点定位
  const brand = page.locator('[data-sidebar="menu-sub-button"]', { hasText: '官网' })
  const repo = page.locator('[data-sidebar="menu-sub-button"]', { hasText: 'GitHub 仓库' })
  await expect(brand).toHaveAttribute('href', 'https://runlume.app')
  await expect(brand).toHaveAttribute('target', '_blank')
  await expect(repo).toHaveAttribute('href', 'https://github.com/runlume/admin-design')
  await expect(repo).toHaveAttribute('target', '_blank')
  // 与「经营分析」同一层级：两者都直接挂在分组下的列表里
  const sameLevel = await page.evaluate(() => {
    const branch = Array.from(document.querySelectorAll('button')).find(
      (node) => node.textContent?.trim() === '经营分析',
    )
    const brandLink = Array.from(document.querySelectorAll('a')).find(
      (node) => node.textContent?.trim() === '官网',
    )
    return branch?.parentElement?.parentElement === brandLink?.parentElement?.parentElement
  })
  expect(sameLevel).toBe(true)
})

test('层级菜单：父级可展开收起，子项可进入', async ({ page }) => {
  await page.goto('/')
  const branch = page.getByRole('button', { name: '经营分析' })
  await expect(branch).toHaveAttribute('aria-expanded', 'false')
  await branch.click()
  await expect(branch).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('link', { name: '报表中心' }).first()).toBeVisible()
  await branch.click()
  await expect(branch).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('link', { name: '报表中心' })).toHaveCount(0)
})

test('深链直接打开动态路由也能渲染', async ({ page }) => {
  await page.goto('/reports')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('报表中心')
})

test('测试账号：没权限的菜单不出现，直接访问落 403', async ({ page }) => {
  // 用受限的测试账号登录（管理员是 `*` 权限，能看到全部菜单）
  await page.goto('/login')
  await page.getByRole('button', { name: 'test', exact: true }).click()
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page.getByRole('button', { name: /runlume\.local/ })).toBeVisible()

  await page.goto('/')
  await expect(page.getByRole('link', { name: '操作日志' })).toHaveCount(0)
  await page.goto('/audit')
  await expect(page.getByRole('heading', { name: '没有访问权限' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '操作日志' })).toHaveCount(0)
})

test('按钮级鉴权：无权限的操作显示禁用态', async ({ page }) => {
  // 测试账号没有 example.admin.customer.export：导出是禁用态，但 example.admin.customer.create 仍然可用
  await page.goto('/login')
  await page.getByRole('button', { name: 'test', exact: true }).click()
  await page.getByRole('button', { name: '登录' }).click()

  await page.goto('/customers')
  await expect(page.getByRole('button', { name: '新建客户' }).first()).toBeEnabled()
  await expect(page.getByRole('button', { name: '导出（无权限）' })).toBeDisabled()
})

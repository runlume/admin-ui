import { expect, test } from '@playwright/test'

test('控制台外壳与菜单可导航', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('工作台')
  await page.getByRole('link', { name: '客户管理' }).first().click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('客户管理')
  await expect(page.getByRole('link', { name: '客户管理' }).first()).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('F12 控制台输出品牌信息', async ({ page }) => {
  const logs: string[] = []
  page.on('console', (message) => logs.push(message.text()))
  await page.goto('/')
  await expect.poll(() => logs.join('\n')).toContain('Runlume')
  await expect.poll(() => logs.join('\n')).toContain('https://runlume.app')
  await expect.poll(() => logs.join('\n')).toContain('请勿')
})

test('主题切换到深色后同步到根元素', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /runlume\.local/ }).click()
  await page.getByRole('menuitem', { name: '设置' }).click()
  await page.getByRole('radio', { name: '深色' }).check()
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('列表页分页与详情跳转可用', async ({ page }) => {
  await page.goto('/customers')
  await page.getByRole('button', { name: '下一页' }).click()
  await expect(page.getByText('第 2 页')).toBeVisible()
  await page.getByRole('link', { name: '清源环保科技' }).first().click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('清源环保科技')
})

test('操作列不会触发行点击：点操作按钮停在列表，点其它单元格才进详情', async ({ page }) => {
  await page.goto('/customers')

  // 操作列的按钮自己处理点击：编辑弹窗打开，URL 仍停在列表页
  await page.getByRole('button', { name: '编辑' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page).toHaveURL(/\/customers$/)
  await page.keyboard.press('Escape')

  // 行内非交互区域才触发整行点击进入详情
  await page
    .getByRole('cell', { name: /^\d{4}-\d{2}-\d{2}$/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/customers\/CUS-/)
})

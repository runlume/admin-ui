import { expect, test } from '@playwright/test'

test('登录页校验必填并进入控制台', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: '登录' })).toBeVisible()
  await expect(page.getByText('统一的后台界面语言')).toBeVisible()
  await expect(page.getByRole('link', { name: 'runlume.app' })).toHaveAttribute(
    'href',
    'https://runlume.app',
  )

  await page.getByRole('button', { name: '登录' }).click()
  await expect(page.getByRole('alert')).toContainText('请输入账号和密码')

  await page.getByRole('button', { name: 'test', exact: true }).click()
  await expect(page.getByLabel('账号')).toHaveValue('test@runlume.local')
  await expect(page.getByPlaceholder('邮箱或用户名')).toBeVisible()
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('工作台')
})

test('两个测试账号角色不同：管理员能看到操作日志，测试账号看不到', async ({ page }) => {
  await page.goto('/login')
  // 测试账号：没有 example.admin.audit.view，菜单里看不到「操作日志」，直接访问落 403
  await page.getByRole('button', { name: 'test', exact: true }).click()
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('工作台')
  await expect(page.getByRole('button', { name: '测试账号' })).toBeVisible()
  await page.goto('/audit')
  await expect(page.getByRole('heading', { name: '没有访问权限' })).toBeVisible()

  // 管理员：`*` 权限，能看到并进入「操作日志」
  await page.goto('/login')
  await page.getByRole('button', { name: 'admin', exact: true }).click()
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page.getByRole('button', { name: '系统管理员' })).toBeVisible()
  await page.goto('/audit')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('操作日志')
})

test('未登录打开深链接：先去登录页，登录后回到那一页', async ({ browser }) => {
  // 这个用例要的就是"没登录"的状态，所以单独开一个不带会话的上下文。
  // （`browser.newContext()` 会带上配置里的 storageState，得显式清空。）
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const page = await context.newPage()

  await page.goto('/design-system')
  await expect(page).toHaveURL(/\/login\?redirect=%2Fdesign-system$/)

  await page.getByRole('button', { name: 'admin', exact: true }).click()
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/\/design-system$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('组件总览')
  await context.close()
})

test('个人中心与用户菜单都能退出到登录页', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /runlume\.local/ }).click()
  await page.getByRole('menuitem', { name: '个人信息' }).click()
  await page.getByRole('button', { name: '退出登录' }).click()
  await expect(page.getByRole('heading', { name: '登录' })).toBeVisible()

  await page.getByRole('button', { name: 'admin', exact: true }).click()
  await page.getByRole('button', { name: '登录' }).click()
  await page.getByRole('button', { name: /系统管理员/ }).click()
  await page.getByRole('menuitem', { name: '退出登录' }).click()
  await expect(page.getByRole('heading', { name: '登录' })).toBeVisible()
})

test('注册页要求手机或邮箱验证后才能提交', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: '去注册' }).click()
  await expect(page.getByRole('heading', { name: '注册' })).toBeVisible()

  // 未填手机号时不能发送验证码
  await page.getByRole('button', { name: '发送验证码' }).click()
  await expect(page.getByRole('alert')).toContainText('请输入手机号')

  await page.getByLabel('手机号').fill('13800000000')
  await page.getByRole('button', { name: '发送验证码' }).click()
  await expect(page.getByText(/验证码已发送至 13800000000/)).toBeVisible()
  await expect(page.getByRole('button', { name: /^\d+ 秒$/ })).toBeDisabled()

  // 验证码错误
  await page.getByLabel('姓名').fill('张伟')
  await page.getByLabel('验证码').fill('000000')
  await page.getByLabel('密码', { exact: true }).fill('runlume-2026')
  await page.getByLabel('确认密码').fill('runlume-2026')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: '注册' }).click()
  await expect(page.getByRole('alert')).toContainText('验证码不正确')

  await page.getByLabel('验证码').fill('123456')
  await page.getByRole('button', { name: '注册' }).click()
  await expect(page.getByRole('heading', { name: '登录' })).toBeVisible()
  await expect(page.getByText(/注册成功，请使用 13800000000 登录/)).toBeVisible()
})

test('注册页切换到邮箱验证', async ({ page }) => {
  await page.goto('/register')
  await page.getByRole('tab', { name: '邮箱' }).click()
  await page.getByLabel('邮箱').fill('not-an-email')
  await page.getByRole('button', { name: '发送验证码' }).click()
  await expect(page.getByRole('alert')).toContainText('邮箱格式不正确')

  await page.getByLabel('邮箱').fill('new@company.com')
  await page.getByRole('button', { name: '发送验证码' }).click()
  await expect(page.getByText(/验证码已发送至 new@company.com/)).toBeVisible()
})

test('找回密码页提交后进入已发送状态', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: '忘记密码' }).click()
  await expect(page.getByRole('heading', { name: '找回密码' })).toBeVisible()

  await page.getByRole('button', { name: '发送重置链接' }).click()
  await expect(page.getByRole('alert')).toContainText('请输入账号')

  await page.getByLabel('账号').fill('test@runlume.local')
  await page.getByRole('button', { name: '发送重置链接' }).click()
  await expect(page.getByRole('heading', { name: '重置链接已发送' })).toBeVisible()
  await expect(page.getByText(/如果 test@runlume.local 是有效账号/)).toBeVisible()

  await page.getByRole('link', { name: '返回登录' }).click()
  await expect(page.getByRole('heading', { name: '登录' })).toBeVisible()
})

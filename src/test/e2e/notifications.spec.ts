import { expect, test } from '@playwright/test'

const bell = (page: import('@playwright/test').Page) =>
  page.getByRole('banner').locator('a[href="/notifications"]')

test('顶栏通知角标与通知页已读状态同步', async ({ page }) => {
  await page.goto('/')
  await expect(bell(page)).toHaveAttribute('aria-label', /3 条未读/)

  await bell(page).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('我的通知')
  await expect(page.getByText('3 条未读')).toBeVisible()

  // 详情弹窗打开未读通知后自动标为已读，角标同步。
  await page.getByRole('button', { name: '检测到新的登录设备' }).click()
  await expect(page.getByRole('dialog')).toContainText('如非本人操作')
  await page.getByRole('button', { name: '取消' }).click()
  await expect(page.getByText('2 条未读')).toBeVisible()

  // 全部标为已读后角标消失。
  await page.getByRole('button', { name: '全部标为已读' }).first().click()
  await expect(page.getByText('全部已读')).toBeVisible()

  // 站内跳转保留内存中的已读状态；整页刷新会重新载入示例数据。
  await page.getByRole('link', { name: '工作台' }).first().click()
  await expect(bell(page)).toHaveAttribute('aria-label', '通知中心')
})

test('通知页支持按阅读状态与类别筛选', async ({ page }) => {
  await page.goto('/notifications')
  const table = page.getByRole('table').first()
  await expect(table.getByRole('row')).toHaveCount(9)

  await page.getByRole('combobox', { name: '阅读状态' }).click()
  await page.getByRole('option', { name: '仅未读' }).click()
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  await expect(table.getByRole('row')).toHaveCount(4)

  await page.getByRole('combobox', { name: '类别' }).click()
  await page.getByRole('option', { name: '安全' }).click()
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  await expect(table.getByRole('row')).toHaveCount(2)

  await page.getByRole('button', { name: '重置' }).click()
  await expect(table.getByRole('row')).toHaveCount(9)
})

test('通知页搜索区可以展开与收起，并按时间范围筛选', async ({ page }) => {
  await page.goto('/notifications')
  const table = page.getByRole('table').first()
  await expect(table.getByRole('row')).toHaveCount(9)

  // 默认折叠：只显示前三个条件，时间范围被收起
  await expect(page.getByLabel('阅读状态')).toBeVisible()
  await expect(page.getByLabel('通知时间')).toBeHidden()
  await page.getByRole('button', { name: '展开', exact: true }).click()
  await expect(page.getByLabel('通知时间')).toBeVisible()

  // 选最近一天：只剩 2026-09-16 的两条
  await page.getByLabel('通知时间').click()
  await page.getByLabel('开始日期').fill('2026-09-16')
  await page.getByLabel('结束日期').fill('2026-09-16')
  await page.getByRole('button', { name: '确定' }).click()
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  await expect(table.getByRole('row')).toHaveCount(3)

  // 收起后再重置
  await page.getByRole('button', { name: '收起', exact: true }).click()
  await expect(page.getByLabel('通知时间')).toBeHidden()
  await page.getByRole('button', { name: '重置' }).click()
  await expect(table.getByRole('row')).toHaveCount(9)
})

test('设置弹窗中的通知设置可以切换并保存', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /runlume\.local/ }).click()
  await page.getByRole('menuitem', { name: '设置' }).click()
  await page.getByRole('tab', { name: '通知设置' }).click()
  await expect(page.getByText('通知偏好保存在当前浏览器')).toBeVisible()

  const desktop = page.getByRole('checkbox', { name: /桌面提醒/ })
  await expect(desktop).not.toBeChecked()
  await desktop.check()
  await page.getByLabel('汇总频率').click()
  await page.getByRole('option', { name: '每周汇总' }).click()
  await page.keyboard.press('Escape')

  await page.reload()
  await page.getByRole('button', { name: /runlume\.local/ }).click()
  await page.getByRole('menuitem', { name: '设置' }).click()
  await page.getByRole('tab', { name: '通知设置' }).click()
  await expect(page.getByRole('checkbox', { name: /桌面提醒/ })).toBeChecked()
  await expect(page.getByLabel('汇总频率')).toContainText('每周汇总')
})

test('顶部快捷操作默认把通知排在第二位', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /runlume\.local/ }).click()
  await page.getByRole('menuitem', { name: '设置' }).click()
  // 设置弹窗里的「关于」页签：仓库与协议入口
  await page.getByRole('tab', { name: '关于' }).click()
  await expect(page.getByRole('link', { name: 'GitHub 仓库' })).toHaveAttribute(
    'href',
    'https://github.com/runlume/admin-design',
  )
  await expect(page.getByRole('link', { name: '开源协议（MIT）' })).toBeVisible()
  await page.getByRole('tab', { name: '界面设置' }).click()
  const names = await page
    .getByRole('dialog')
    .getByRole('listitem')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')))
  expect(names).toEqual(['菜单搜索', '通知', '刷新页面', '全屏', '语言', '主题', 'GitHub 仓库'])

  await page.keyboard.press('Escape')
  await expect(bell(page)).toBeVisible()
  await expect(page.getByRole('banner').getByRole('button', { name: '刷新页面' })).toBeVisible()
})

test('刷新页面不播放页面进入动画', async ({ page }) => {
  await page.goto('/')
  // 先切到 auto，确保正常情况下会播动画
  await page.getByRole('button', { name: /runlume\.local/ }).click()
  await page.getByRole('menuitem', { name: '设置' }).click()
  await page.getByRole('tab', { name: '界面设置' }).click()
  await page.getByRole('radio', { name: '按前进/后退自动' }).check()
  await page.keyboard.press('Escape')
  await page.getByRole('link', { name: '客户管理' }).first().click()
  await expect(page.locator('html')).not.toHaveAttribute('data-transition', 'none')

  // 点刷新：重建当前页期间与回程都不挂动画
  const transitions: string[] = []
  page.on('console', () => undefined)
  await page.getByRole('button', { name: '刷新页面' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('客户管理')
  transitions.push((await page.locator('html').getAttribute('data-transition')) ?? '')
  expect(transitions[0]).toBe('none')
})

test('搜索组件的预设开关：保存与恢复筛选条件', async ({ page }) => {
  await page.goto('/customers')
  // 预设入口由 SearchFilters 的 presets 开关渲染，标题是「筛选预设」
  await expect(page.getByRole('button', { name: '筛选预设' })).toBeVisible()
  await page.getByLabel('关键字').fill('云和')
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  await page.getByRole('button', { name: '筛选预设' }).click()
  await page.getByRole('textbox', { name: '名称' }).fill('云和筛选')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('已保存「云和筛选」')).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByLabel('关键字').fill('')
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  await page.getByRole('button', { name: '筛选预设' }).click()
  await page
    .getByRole('button', { name: /^云和筛选 / })
    .first()
    .click()
  await expect(page.getByLabel('关键字')).toHaveValue('云和')
  await page.keyboard.press('Escape')
})

test('筛选预设保存并恢复关键字与日期区间，摘要可读', async ({ page }) => {
  await page.goto('/customers')
  const keyword = page.getByPlaceholder('客户名称、联系人、手机号')
  const rangeButton = page.locator('form button[aria-label="创建时间"]')

  await keyword.fill('云和')
  await rangeButton.click()
  await page.getByRole('button', { name: '近 7 天' }).click()
  // 快捷区间点完立即生效，不用再点「确定」
  await expect(rangeButton).toContainText('~')

  await page.getByRole('button', { name: '筛选预设' }).click()
  await page.getByRole('textbox', { name: '名称' }).fill('云和近7天')
  await page.getByRole('button', { name: '保存' }).click()
  // 摘要展示的是可读文案，不是 JSON
  await expect(page.getByText(/关键字: 云和/).first()).toBeVisible()
  await expect(page.getByText(/\{"keyword"/)).toHaveCount(0)
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '重置' }).click()
  await expect(keyword).toHaveValue('')
  await expect(rangeButton).toHaveText('选择日期范围')

  await page.getByRole('button', { name: '筛选预设' }).click()
  await page
    .getByRole('button', { name: /^云和近7天 / })
    .first()
    .click()
  await expect(keyword).toHaveValue('云和')
  await expect(rangeButton).toContainText('~')
})

test('储物箱可以保存、恢复、重命名与删除状态', async ({ page }) => {
  await page.goto('/customers')
  await page.getByLabel('关键字').fill('云和')
  await page.getByRole('button', { name: '搜索', exact: true }).click()

  await page.getByRole('button', { name: '视图预设' }).click()
  await page.getByRole('textbox', { name: '名称' }).fill('云和视图')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('已保存「云和视图」')).toBeVisible()

  // 回车不再直接保存
  await page.getByRole('textbox', { name: '名称' }).fill('回车不该保存')
  await page.getByRole('textbox', { name: '名称' }).press('Enter')
  await expect(page.getByText('回车不该保存')).toHaveCount(0)

  // 重名会拦下来：提示 + 主按钮变「覆盖」，点了才覆盖
  await page.getByRole('textbox', { name: '名称' }).fill('云和视图')
  await expect(page.getByRole('alert')).toContainText('已存在')
  await expect(page.getByRole('button', { name: '覆盖' })).toBeVisible()
  await page.getByRole('textbox', { name: '名称' }).fill('云和视图 副本')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.keyboard.press('Escape')

  // 改条件后恢复（重新打开储物箱）
  await page.getByLabel('关键字').fill('')
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  await page.getByRole('button', { name: '视图预设' }).click()
  await page
    .getByRole('button', { name: /云和视图 关键字: 云和 · 列:/ })
    .first()
    .click()
  await expect(page.getByLabel('关键字')).toHaveValue('云和')

  // 重命名（弹层在恢复后仍打开）
  await page.getByRole('button', { name: '重命名 云和视图' }).click()
  await page.getByLabel('重命名').fill('云和视图 2')
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.getByRole('button', { name: '云和视图 2 关键字: 云和 · 列:' })).toBeVisible()

  // 删除
  await page.getByRole('button', { name: '删除 云和视图 2' }).click()
  await expect(page.getByText('还没有保存任何状态')).toBeVisible()
})

test('视图预设能保存并恢复列显隐、列顺序与列宽', async ({ page }) => {
  await page.goto('/customers')
  const table = page.getByRole('table', { name: '客户管理', exact: true })
  /** 表头单元格：按可见文字定位（选择列的表头没有文字） */
  const headCell = (name: string) => table.locator('thead th').filter({ hasText: name }).first()
  const headers = async () =>
    (await table.locator('thead th').allInnerTexts()).map((text) => text.trim()).filter(Boolean)

  await expect(headCell('客户名称')).toBeVisible()

  // 1) 改布局：隐藏「状态」→ 把「负责人」拖到最前 → 调宽「客户名称」
  await page.getByRole('button', { name: '列', exact: true }).click()
  await page.getByRole('menuitemcheckbox', { name: '状态' }).click()
  await page.keyboard.press('Escape')
  await headCell('负责人').dragTo(headCell('客户名称'))
  await expect.poll(headers).toEqual(['负责人', '客户名称', '联系电话', '创建时间', '操作'])

  const handle = table.getByRole('separator', { name: '调整 客户名称 列宽' })
  await handle.focus()
  for (let index = 0; index < 4; index += 1) await handle.press('ArrowRight')
  const width = await handle.getAttribute('aria-valuenow')

  // 2) 保存为视图预设
  await page.getByRole('button', { name: '视图预设' }).click()
  await page.getByRole('textbox', { name: '名称' }).fill('我的列布局')
  await page.getByRole('button', { name: '保存' }).click()
  await page.keyboard.press('Escape')

  // 3) 打乱：显示「状态」并把列宽列顺序全部恢复默认
  await page.getByRole('button', { name: '列', exact: true }).click()
  await page.getByRole('menuitemcheckbox', { name: '状态' }).click()
  await page.getByRole('menuitem', { name: '恢复默认' }).click()
  await expect.poll(headers).toEqual(['客户名称', '负责人', '联系电话', '状态', '创建时间', '操作'])

  // 4) 恢复预设：显隐、顺序、列宽一起回来
  await page.getByRole('button', { name: '视图预设' }).click()
  await page
    .getByRole('button', { name: /我的列布局/ })
    .first()
    .click()
  await expect.poll(headers).toEqual(['负责人', '客户名称', '联系电话', '创建时间', '操作'])
  await expect(page.getByRole('separator', { name: '调整 客户名称 列宽' })).toHaveAttribute(
    'aria-valuenow',
    width ?? '',
  )
})

test('界面设置可以调整侧栏宽度、圆角与页面切换动画', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /runlume\.local/ }).click()
  await page.getByRole('menuitem', { name: '设置' }).click()
  await page.getByRole('tab', { name: '界面设置' }).click()

  // 侧栏宽度：滑块步进后 CSS 变量随之变化
  const widthThumb = page.getByRole('slider', { name: /侧栏宽度/ })
  await widthThumb.focus()
  await widthThumb.press('ArrowRight')
  await widthThumb.press('ArrowRight')
  await expect(page.locator('[style*="--sidebar-width"]').first()).toHaveAttribute(
    'style',
    /--sidebar-width: 252px/,
  )

  // 圆角：写入全局 --radius
  const radiusThumb = page.getByRole('slider', { name: /圆角/ })
  await radiusThumb.focus()
  await radiusThumb.press('ArrowRight')
  await expect
    .poll(() =>
      page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--radius')),
    )
    .toBe('0.75rem')

  // 页面切换动画：写入 data-transition
  await page.getByRole('radio', { name: '淡入' }).check()
  await expect(page.locator('html')).toHaveAttribute('data-transition', 'fade')
})

test('布局模式：顶部+侧边与纯顶部', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('complementary', { name: '导航' })).toBeVisible()

  await page.getByRole('button', { name: /runlume\.local/ }).click()
  await page.getByRole('menuitem', { name: '设置' }).click()
  await page.getByRole('tab', { name: '界面设置' }).click()
  await page.getByRole('radio', { name: '顶部 + 侧边导航', exact: true }).check()
  await page.keyboard.press('Escape')

  // 混合导航：侧栏保留，点顶栏一级项直接切换左侧菜单（不弹下拉）
  await expect(page.getByRole('complementary', { name: '导航' })).toBeVisible()
  const topNav = page.getByRole('navigation', { name: '主导航' })
  await expect(topNav).toBeVisible()
  await expect(topNav).toContainText('业务')
  await expect(topNav).toContainText('设计系统')
  // 顶栏只保留头像：此时全站只有一个用户菜单入口
  await expect(page.getByRole('button', { name: /runlume\.local/ })).toHaveCount(1)
  // 面包屑与快捷操作移到第二行
  await expect(page.getByRole('banner').getByRole('navigation', { name: '控制台' })).toHaveCount(0)
  const secondary = page.locator('[data-row="secondary"]')
  await expect(secondary.getByRole('navigation', { name: '控制台' })).toBeVisible()
  await expect(secondary.getByRole('button', { name: '刷新页面' })).toBeVisible()

  await topNav.getByRole('button', { name: '系统', exact: true }).click()
  const sidebar = page.getByRole('complementary', { name: '导航' })
  await expect(sidebar.getByRole('link', { name: '通知中心' })).toBeVisible()
  await expect(sidebar.getByRole('link', { name: '客户管理' })).toHaveCount(0)
  await sidebar.getByRole('link', { name: '通知中心' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('我的通知')

  // 切回侧边导航（此时用户菜单在顶栏）
  await page.getByRole('button', { name: /runlume\.local/ }).click()
  await page.getByRole('menuitem', { name: '设置' }).click()
  await page.getByRole('radio', { name: '侧边导航', exact: true }).check()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('complementary', { name: '导航' })).toBeVisible()
  // 侧栏要把全部分组恢复出来，而不是只留当前分组
  const restored = page.getByRole('complementary', { name: '导航' })
  await expect(restored.getByRole('button', { name: '业务' })).toBeVisible()
  await expect(restored.getByRole('button', { name: '系统', exact: true })).toBeVisible()
  await expect(restored.getByRole('button', { name: '设计系统' })).toBeVisible()

  // 纯顶部：不再渲染侧栏，一级项改为下拉展开
  await page.getByRole('button', { name: /runlume\.local/ }).click()
  await page.getByRole('menuitem', { name: '设置' }).click()
  await page.getByRole('radio', { name: '顶部导航', exact: true }).check()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('complementary', { name: '导航' })).toHaveCount(0)
  const pureTopNav = page.getByRole('navigation', { name: '主导航' })
  await pureTopNav.getByRole('button', { name: '业务' }).click()
  await page.getByRole('menuitem', { name: '客户管理' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('客户管理')
})

test('日期输入支持切换到月与年视图', async ({ page }) => {
  await page.goto('/design-system/form')
  const field = page.getByLabel('签约日期')
  await field.focus()
  // 面板通过日历按钮或 Alt+↓ 打开
  await field.press('Alt+ArrowDown')
  await page.getByRole('button', { name: '切换到月/年视图' }).click()
  await expect(page.getByRole('button', { name: '3月' })).toBeVisible()
  await page.getByRole('button', { name: '切换到月/年视图' }).click()
  await page.getByRole('button', { name: '2028', exact: true }).click()
  await page.getByRole('button', { name: '5月' }).click()
  await expect(page.locator('[data-day^="2028-05"]').first()).toBeVisible()
})

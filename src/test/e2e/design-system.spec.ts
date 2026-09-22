import { expect, test } from '@playwright/test'

const keyPattern =
  /\b(userSettings|colorSettings|headerActions|notifications|accessibility|menuSearch|pageTabs|favorites|sample|login|register|forgot|auth|gallery|password|timeAgo|tree)\.[a-zA-Z]/

const pages = [
  { path: '/design-system', title: '组件总览' },
  { path: '/design-system/basic', title: '基础控件' },
  { path: '/design-system/form', title: '表单与选择' },
  { path: '/design-system/data', title: '数据展示' },
  { path: '/design-system/feedback', title: '反馈与浮层' },
  { path: '/design-system/navigation', title: '导航与流程' },
  { path: '/design-system/metrics', title: '指标与图表' },
  { path: '/design-system/theme', title: '主题与设置' },
  { path: '/design-system/icons', title: '图标预览' },
]

test('组件总览按类型拆分，分类页都能打开且无未翻译 key', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  for (const entry of pages) {
    await page.goto(entry.path)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(entry.title)
    expect(await page.locator('body').innerText()).not.toMatch(keyPattern)
  }
  expect(errors).toEqual([])
})

test('侧栏设计系统分组列出全部分类页', async ({ page }) => {
  await page.goto('/design-system')
  for (const entry of pages.slice(1)) {
    await expect(page.getByRole('link', { name: entry.title }).first()).toBeVisible()
  }
  await page.getByRole('link', { name: '数据展示' }).first().click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('数据展示')
})

test('数据展示页：排序、列管理、行密度与页码分页', async ({ page }) => {
  await page.goto('/design-system/data')
  const table = page.getByRole('table', { name: '组织单元', exact: true })
  await expect(table).toBeVisible()
  await expect(table).toHaveAttribute('data-striped', 'true')
  const nameOf = (index: number) => table.getByRole('row').nth(index).getByRole('cell').nth(1)
  const before = await nameOf(1).innerText()

  // 表头排序：点击名称列头从升序切到降序
  await table.getByRole('columnheader', { name: '名称' }).getByRole('button').click()
  await expect(nameOf(1)).not.toHaveText(before)

  // 列管理：隐藏负责人列
  await page.getByRole('button', { name: '列', exact: true }).click()
  await page.getByRole('menuitemcheckbox', { name: '负责人' }).click()
  await page.keyboard.press('Escape')
  await expect(table.getByRole('columnheader', { name: '负责人' })).toHaveCount(0)

  // 行密度
  await page.getByRole('button', { name: '密度' }).click()
  await page.getByRole('menuitem', { name: '紧凑' }).click()
  await expect(table.locator('tbody tr').first().locator('td').first()).toHaveClass(/py-2/)

  // 页码分页器
  const pager = page.getByRole('button', { name: /第 12 页/ })
  await pager.click()
  await expect(page.getByRole('button', { name: /第 12 页/ })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('数据展示页：行内展开与列宽持久化', async ({ page }) => {
  await page.goto('/design-system/data')
  const table = page.getByRole('table', { name: '组织单元', exact: true })
  await expect(table.getByRole('button', { name: '展开行' }).first()).toBeVisible()
  await table.getByRole('button', { name: '展开行' }).first().click()
  await expect(table.getByRole('button', { name: '收起行' }).first()).toBeVisible()
  await expect(table.getByText('负责人', { exact: true }).last()).toBeVisible()

  // 键盘调整列宽后刷新，宽度应保持
  const handle = table.getByRole('separator', { name: '调整 名称 列宽' })
  const initial = await handle.getAttribute('aria-valuenow')
  await handle.focus()
  for (let index = 0; index < 3; index += 1) await handle.press('ArrowRight')
  const width = await handle.getAttribute('aria-valuenow')
  expect(width).not.toBe(initial)
  await page.reload()
  const reloaded = page
    .getByRole('table', { name: '组织单元', exact: true })
    .getByRole('separator', { name: '调整 名称 列宽' })
  await expect(reloaded).toHaveAttribute('aria-valuenow', width ?? '')

  // 「列 → 恢复默认」要把列宽一起复位
  await page.getByRole('button', { name: '列', exact: true }).click()
  await page.getByRole('menuitem', { name: '恢复默认' }).click()
  await expect(reloaded).toHaveAttribute('aria-valuenow', initial ?? '')
  // 偏好里的列宽与列顺序都应被清空（键可能仍在，但内容为空）
  const stored = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((item) => item.includes('table.design-data'))
    return key ? JSON.parse(localStorage.getItem(key) ?? '{}') : {}
  })
  expect(stored.sizes ?? {}).toEqual({})
  expect(stored.order ?? []).toEqual([])
})

test('数据展示页：表头与列管理都能拖拽调整列顺序，并保存到浏览器', async ({ page }) => {
  await page.goto('/design-system/data')
  const table = page.getByRole('table', { name: '组织单元', exact: true })
  /** 表头文字（去掉选择列与操作列） */
  const headers = async () =>
    (await table.locator('thead th').allInnerTexts()).map((text) => text.trim()).filter(Boolean)

  // 菜单要先加载完，表格才渲染出来
  await expect(table.getByRole('columnheader', { name: /ID/ })).toBeVisible()
  await expect.poll(headers).toEqual(['ID', '名称', '负责人', '状态', '更新时间'])

  // 1) 表头拖拽：把「负责人」拖到「名称」上（ID / 更新时间是固定列，不参与拖动）
  await table
    .getByRole('columnheader', { name: /负责人/ })
    .dragTo(table.getByRole('columnheader', { name: /名称/ }))
  await expect.poll(headers).toEqual(['ID', '负责人', '名称', '状态', '更新时间'])

  // 2) 列管理里拖拽：把「状态」拖到「名称」
  await page.getByRole('button', { name: '列', exact: true }).click()
  const item = (name: string) => page.getByRole('menuitemcheckbox', { name }).first()
  await item('状态').dragTo(item('名称'))
  await page.keyboard.press('Escape')
  await expect.poll(headers).toEqual(['ID', '负责人', '状态', '名称', '更新时间'])

  // 3) 刷新后顺序保留
  await page.reload()
  await expect
    .poll(async () =>
      (
        await page
          .getByRole('table', { name: '组织单元', exact: true })
          .locator('thead th')
          .allInnerTexts()
      )
        .map((text) => text.trim())
        .filter(Boolean),
    )
    .toEqual(['ID', '负责人', '状态', '名称', '更新时间'])
})

test('大数据量表：虚拟滚动只渲染可视窗口', async ({ page }) => {
  await page.goto('/design-system/data')
  const table = page.getByRole('table', { name: '大数据量记录' })
  const rendered = await table.locator('tbody tr').count()
  // 只渲染窗口内的行（含上下占位行），远小于 1000
  expect(rendered).toBeLessThan(40)
  await expect(page.getByText('共 1000 条')).toBeVisible()

  // 滚动后窗口前移：首行不再是第 1 条，且总高度按 1000 行撑开
  const scroller = table.locator('xpath=ancestor::*[@data-slot="table-scroll"][1]')
  const height = await scroller.evaluate((node) => node.scrollHeight)
  expect(height).toBeGreaterThan(20000)
  await expect(table.getByText('记录 1', { exact: true }).first()).toBeVisible()
  await scroller.evaluate((node) => {
    node.scrollTop = node.scrollHeight
  })
  await expect(table.getByText('记录 1000')).toBeVisible({ timeout: 5000 })

  // 表头吸顶：滚动后仍在容器可视区顶部
  const headerTop = await scroller.evaluate((node) => {
    const viewport = node.getBoundingClientRect()
    const header = node.querySelector('[data-slot="table-header"]')?.getBoundingClientRect()
    return header ? Math.round(header.top - viewport.top) : 999
  })
  expect(headerTop).toBeLessThan(2)
})

test('数据展示页：列表树搜索与表格树展开', async ({ page }) => {
  await page.goto('/design-system/data')
  const tree = page.getByRole('tree', { name: '组织单元' })
  await expect(tree.getByRole('checkbox')).toHaveCount(0)
  await page.getByLabel('搜索节点').fill('平台')
  await expect(tree.getByRole('treeitem')).toHaveCount(3)
  await page.getByLabel('搜索节点').fill('')
  await page.getByRole('button', { name: '展开全部' }).click()
  await expect(tree.getByRole('treeitem')).toHaveCount(11)
  await page.getByRole('button', { name: '收起全部' }).click()
  await expect(tree.getByRole('treeitem')).toHaveCount(2)

  // 勾选是可选能力：默认关闭，打开后父节点级联、祖先显示半选
  await page.getByRole('checkbox', { name: /启用勾选/ }).click()
  await page.getByRole('button', { name: '展开全部' }).click()
  await tree.getByRole('checkbox', { name: '选择 研发中心' }).check()
  await expect(tree.getByRole('checkbox', { name: '选择 平台组' })).toBeChecked()
  await expect(tree.getByRole('checkbox', { name: '选择 测试组' })).toBeChecked()
  await expect(tree.getByRole('treeitem', { name: /云和智能制造/ })).toHaveAttribute(
    'aria-checked',
    'mixed',
  )
  await expect(page.getByText(/已选 \d+ 项/)).toBeVisible()

  const treeTable = page.getByRole('table', { name: '组织单元（表格）' })
  await expect(treeTable.getByRole('row')).toHaveCount(7)
  await treeTable.getByRole('button', { name: '收起 云和智能制造' }).click()
  await expect(treeTable.getByRole('row')).toHaveCount(5)
})

test('表单页：验证码、密码强度与组合框', async ({ page }) => {
  await page.goto('/design-system/form')
  await page.getByLabel('验证码', { exact: true }).fill('123456')
  await expect(page.getByText('当前输入：123456')).toBeVisible()

  await page.getByLabel('密码', { exact: true }).fill('Abc12345!')
  await expect(page.getByText('强', { exact: true })).toBeVisible()

  await page.getByRole('combobox', { name: '负责人' }).click()
  await page.getByRole('textbox', { name: '负责人' }).fill('李娜')
  await page.getByRole('option', { name: /李娜/ }).first().click()
  await expect(page.getByRole('combobox', { name: '负责人' })).toContainText('李娜')

  await page.getByRole('combobox', { name: '归属组织' }).click()
  await page.getByRole('option', { name: '云和智能制造' }).click()
  await page.getByRole('option', { name: '研发中心' }).click()
  await page.getByRole('option', { name: '平台组' }).click()
  await expect(page.getByRole('combobox', { name: '归属组织' })).toContainText(
    '云和智能制造 / 研发中心 / 平台组',
  )
})

test('基础控件页：按钮加载态与可关闭标签', async ({ page }) => {
  await page.goto('/design-system/basic')
  await expect(page.getByRole('button', { name: '提交中' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '提交中' }).locator('svg')).toHaveCount(1)

  const tag = page.getByRole('button', { name: '清空 待处理' })
  await tag.click()
  await expect(page.getByText('待处理', { exact: true })).toHaveCount(0)

  // 输入清除与前后缀
  await page.getByRole('button', { name: '清空' }).first().click()
  await expect(page.getByLabel('关键字')).toHaveValue('')
  await expect(page.getByLabel('域名').locator('..')).toContainText('.com')
})

test('指标页：数字、趋势、图表与代码块', async ({ page }) => {
  await page.goto('/design-system/metrics')
  await expect(page.getByText('12,480')).toBeVisible()
  await expect(page.getByRole('img', { name: /客户总数/ }).first()).toBeVisible()
  await expect(page.getByText('GET /api/v1/customers')).toBeVisible()
  await page.getByRole('button', { name: '复制' }).click()
  await expect(page.getByText(/已复制|复制失败/)).toBeVisible()

  // 折线 / 环形 / 热力 / 条形四类图表都在，且悬停能读数
  await expect(page.getByRole('img', { name: /本月金额（万元）/ })).toBeVisible()
  await expect(page.getByRole('img', { name: '本月目标完成率' })).toBeVisible()
  const bars = page.getByRole('img', { name: '近 14 天新增' })
  await expect(bars.first()).toBeVisible()
  // 普通柱状图：悬停某根柱子显示数值
  await bars.locator('rect[fill="transparent"]').nth(12).dispatchEvent('mouseover')
  await expect(bars.getByText('14 个')).toBeVisible()
  await expect(page.getByRole('table', { name: '下单时段分布' })).toBeVisible()
  await expect(page.getByRole('list', { name: '来源渠道对比' })).toBeVisible()
  // 雷达 / 漏斗 / 甘特
  await expect(page.getByRole('img', { name: /本期 \/ 上期/ })).toBeVisible()
  await expect(page.getByRole('list', { name: '转化漏斗' })).toBeVisible()
  await expect(page.getByRole('list', { name: '任务排期' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: '需求评审' })).toBeVisible()
  // 悬停折线第 6 个取值（46）时图例给出读数
  const chart = page.getByRole('img', { name: /本月金额（万元）/ })
  await chart.locator('rect[fill="transparent"]').nth(5).hover()
  await expect(page.getByText('46', { exact: true })).toBeVisible()
})

test('无障碍预览里的「查看字号设置」会跳转并高亮', async ({ page }) => {
  await page.goto('/design-system/theme')
  const preview = page.locator('[data-slot="card"]').filter({ hasText: '阅读预览' })
  await preview.getByRole('link', { name: '查看字号设置' }).click()
  const sizeGroup = page.locator('fieldset').filter({ hasText: '字体大小' })
  await expect(sizeGroup).toHaveClass(/ring-2/)
  await expect(sizeGroup.getByRole('radio').first()).toBeFocused()
})

test('主题页：灰色模式与色弱模式写入根元素', async ({ page }) => {
  await page.goto('/design-system/theme')
  await page.getByRole('checkbox', { name: /灰色模式/ }).check()
  await expect(page.locator('html')).toHaveAttribute('data-grayscale', 'true')
  await page.getByRole('checkbox', { name: /色弱模式/ }).check()
  await expect(page.locator('html')).toHaveAttribute('data-color-weak', 'true')
  await page.getByRole('checkbox', { name: /灰色模式/ }).uncheck()
  await expect(page.locator('html')).toHaveAttribute('data-grayscale', 'false')
})

test('弹窗可拖动：鼠标、键盘与复位', async ({ page }) => {
  await page.goto('/design-system/feedback')
  await page.getByRole('button', { name: '打开弹窗' }).click()
  const content = page.locator('[data-slot="dialog-content"]')
  await expect(content).toHaveAttribute('data-draggable', 'true')
  const handle = page.locator('[data-slot="dialog-drag-handle"]')
  const handleBox = await handle.boundingBox()
  if (!handleBox) throw new Error('拖拽层未渲染')
  await expect(handle).toHaveCSS('cursor', 'grab')

  // 整条顶栏都可拖：从标题右侧的空白带按下也能拖
  await page.mouse.move(handleBox.x + handleBox.width - 96, handleBox.y + 20)
  await page.mouse.down()
  await page.mouse.move(handleBox.x + 60, handleBox.y + 60, { steps: 6 })
  // 拖动过程中必须关掉过渡，否则跟手会有 200ms 滞后
  await expect(content).toHaveAttribute('style', /transition-property: none/)
  await page.mouse.up()
  // 位移叠加在居中之上：断言的是 translate 变量里的偏移，不是直接覆盖 translate 属性
  await expect(content).toHaveAttribute('style', /--tw-translate-x: calc\(-50% \+ -?\d+px\)/)

  // 键盘方向键继续微调
  await page.keyboard.press('ArrowRight')
  const moved = await content.getAttribute('style')
  expect(moved).toContain('--tw-translate-x')

  // 复位按钮把偏移清空
  await page.getByRole('button', { name: '复位位置' }).click()
  await expect(content).toHaveAttribute('style', /--tw-translate-x: calc\(-50% \+ 0px\)/)

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  // 大触摸屏模式：draggable="always" 会打开标题栏 touch-action
  await page.getByRole('button', { name: '大触摸屏可拖弹窗' }).click()
  const touchContent = page.locator('[data-slot="dialog-content"]')
  await expect(touchContent).toHaveAttribute('data-drag-touch', 'true')
  await expect(page.locator('[data-slot="dialog-header"]')).toHaveCSS('touch-action', 'none')
  await page.keyboard.press('Escape')
})

test('基础控件页：步进、滑块、折叠与滚动区', async ({ page }) => {
  await page.goto('/design-system/basic')
  const number = page.getByLabel('并发数', { exact: true })
  await expect(number).toHaveValue('4')
  await page.getByRole('button', { name: '并发数 增加' }).click()
  await expect(number).toHaveValue('5')

  await expect(page.getByLabel('告警阈值', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '查看字段说明' }).click()
  await expect(page.getByText(/超过 20 需要平台管理员审批/)).toBeVisible()
  await expect(page.getByRole('list').filter({ hasText: '平台组' }).first()).toBeVisible()
})

test('表单页：多选与日期区间', async ({ page }) => {
  await page.goto('/design-system/form')
  const multi = page.getByRole('combobox', { name: '客户状态' })
  await expect(multi).toContainText('正常')
  await multi.click()
  await page.getByRole('checkbox', { name: '待处理' }).click()
  await expect(multi).toContainText('待处理')
  await page.getByRole('checkbox', { name: '正常' }).click()
  await page.getByRole('checkbox', { name: '待处理' }).click()
  await page.keyboard.press('Escape')
  await expect(multi).toContainText('全部状态')

  // 月历里点选区间：先点开始，再点结束
  const range = page.getByRole('button', { name: '签约区间' })
  await range.click()
  await page.getByRole('button', { name: '2026-09-08' }).click()
  await page.getByRole('button', { name: '2026-09-12' }).click()
  await page
    .locator('[data-radix-popper-content-wrapper]')
    .getByRole('button', { name: '确定', exact: true })
    .click()
  await expect(range).toContainText('2026-09-08 ~ 2026-09-12')
  // 快捷区间点了就生效并关闭，不用再点「确定」
  await range.click()
  await page.getByRole('button', { name: '近 7 天' }).click()
  await expect(range).toContainText('~')
  await expect(
    page.locator('[data-radix-popper-content-wrapper]').getByRole('button', {
      name: '确定',
      exact: true,
    }),
  ).toHaveCount(0)
})

test('表单页：上传校验、图片预览与提及', async ({ page }) => {
  await page.goto('/design-system/form')

  // 类型不符的附件直接给出错误提示
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello'),
  })
  await expect(page.getByText(/仅支持 .pdf,.png,.jpg 格式/)).toBeVisible()

  // 合规文件展示进度并可以移除
  await fileInput.setInputFiles({
    name: 'contract.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  })
  await expect(page.getByText('contract.pdf')).toBeVisible()
  await page.getByRole('button', { name: '删除 contract.pdf' }).click()
  await expect(page.getByText('contract.pdf')).toHaveCount(0)

  // 图片预览
  await page.getByRole('button', { name: /预览图片/ }).click()
  const previewDialog = page.getByRole('dialog')
  const previewImage = previewDialog.getByRole('img', { name: '品牌方标' })
  await expect(previewImage).toBeVisible()
  expect((await previewImage.boundingBox())?.height).toBeGreaterThan(300)
  await previewDialog.getByRole('button', { name: '放大' }).click()
  await expect(previewDialog.getByText('125%')).toBeVisible()
  await page.keyboard.press('Escape')

  // 提及候选：采纳后插入内联标签
  await page.getByRole('textbox', { name: '跟进记录' }).click()
  await page.keyboard.type('已联系 @张')
  await expect(page.getByRole('listbox', { name: '提及候选' })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.locator('.mention-tag').first()).toHaveText('@张伟')
  await expect(page.getByRole('textbox', { name: '跟进记录' })).toContainText('@张伟')
})

test('表单页：提及候选按剩余空间决定向下或向上展开', async ({ page }) => {
  await page.goto('/design-system/form')
  const editor = page.getByRole('textbox', { name: '跟进记录' })
  const list = page.getByRole('listbox', { name: '提及候选' })
  const side = async () => {
    const [box, panel] = await Promise.all([editor.boundingBox(), list.boundingBox()])
    if (!box || !panel) return 'missing'
    return panel.y + panel.height <= box.y + 1 ? 'top' : 'bottom'
  }

  // 输入框上方、下方空间都充足时向下展开
  await editor.evaluate((node) => node.scrollIntoView({ block: 'start' }))
  await editor.click()
  await page.keyboard.type('已联系 @张')
  await expect(list).toBeVisible()
  expect(await side()).toBe('bottom')

  // 输入框贴近视口底部时下方放不下列表最小样式，改为向上展开
  await editor.evaluate((node) => node.scrollIntoView({ block: 'end' }))
  await expect.poll(side).toBe('top')
})

test('图标预览页：全部图标可搜索与复制', async ({ page }) => {
  await page.goto('/design-system/icons')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('图标预览')
  const grid = page.locator('button[title]')
  expect(await grid.count()).toBeGreaterThan(50)

  // 连续输入不能因为清空按钮出现而失焦
  const search = page.getByLabel('搜索图标名称')
  await search.click()
  await search.pressSequentially('calendar')
  await expect(search).toHaveValue('calendar')
  await expect(search).toBeFocused()
  await expect(page.getByRole('button', { name: '复制图标名 CalendarDays' })).toBeVisible()
  await page.getByRole('button', { name: '复制图标名 CalendarDays' }).click()
  await expect(page.getByText(/已复制 CalendarDays|复制失败/)).toBeVisible()
})

test('数据展示页：固定列与快捷键导航', async ({ page }) => {
  await page.goto('/design-system/data')
  const table = page.getByRole('table', { name: '组织单元', exact: true })
  await expect(table.getByRole('columnheader', { name: 'ID' })).toHaveClass(/sticky/)
  await expect(table.getByRole('columnheader', { name: '更新时间' })).toHaveClass(/sticky/)

  // 全局快捷键 g + c 跳到客户管理
  await page.keyboard.press('g')
  await page.keyboard.press('c')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('客户管理')
})

test('命令面板：⌘K 呼出、只搜索菜单与当前页内容（⌘⇧S 兼容）', async ({ page }) => {
  await page.goto('/customers')
  // 菜单要先加载完，外壳与命令面板才挂上热键监听
  await expect(page.getByRole('heading', { level: 1 })).toContainText('客户管理')
  await page.keyboard.press('Meta+k')
  await expect(page.getByRole('combobox', { name: '搜索菜单' })).toBeVisible()

  await page.getByRole('combobox', { name: '搜索菜单' }).fill('云和智能制造')
  await expect(page.getByText('当前页内容').first()).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('combobox', { name: '搜索菜单' })).toHaveCount(0)
  await expect(page.locator('.content-search-hit').first()).toBeVisible()

  // 兼容别名：⌘⇧S 也能打开
  await page.keyboard.press('Meta+Shift+s')
  await expect(page.getByRole('combobox', { name: '搜索菜单' })).toBeVisible()
  await page.keyboard.press('Escape')

  // 徽标这类 span 文案同样可搜（早期只索引 h1/h2/p/li/td/button/a，会漏掉）
  await page.goto('/design-system')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('组件总览')
  await page.keyboard.press('Meta+k')
  await page.getByRole('combobox', { name: '搜索菜单' }).fill('待处理')
  await expect(page.getByText('当前页内容').first()).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.locator('.content-search-hit').first()).toContainText('待处理')
})

test('反馈页：多步加载、右键菜单与悬停卡片', async ({ page }) => {
  await page.goto('/design-system/feedback')
  const loader = page.locator('[data-slot="multi-step-loader"]')
  await expect(loader).toHaveAttribute('aria-busy', 'true')
  await page.getByRole('button', { name: '推进加载阶段' }).click()
  await page.getByRole('button', { name: '推进加载阶段' }).click()
  await expect(loader).toHaveAttribute('aria-busy', 'false')

  await page.getByText('在此区域右键打开菜单').click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: '复制编号' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: /张伟/ }).hover()
  await expect(page.getByText(/最近一次跟进 2 天前/)).toBeVisible()
})

test('品牌青柠跟随主题方案与主题色的色相', async ({ page }) => {
  await page.goto('/design-system')
  const values = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const context = canvas.getContext('2d', { willReadFrequently: true })!
    const probe = document.createElement('span')
    document.body.append(probe)
    // 走画布取 sRGB 通道：oklch/相对颜色语法会被序列化成非 rgb() 形式。
    const channels = () => {
      probe.style.color = 'var(--brand-lime)'
      context.fillStyle = getComputedStyle(probe).color
      context.fillRect(0, 0, 1, 1)
      return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
    }
    const root = document.documentElement
    const read = (palette: string, themeColor: string, baseColor = 'neutral') => {
      root.dataset.palette = palette
      root.dataset.themeColor = themeColor
      root.dataset.baseColor = baseColor
      return channels()
    }
    const result: Record<string, number[]> = { teal: read('teal', 'default') }
    for (const palette of ['blue', 'forest', 'violet', 'amber', 'graphite']) {
      result[palette] = read(palette, 'default')
    }
    for (const themeColor of ['blue', 'amber'])
      result[`custom-${themeColor}`] = read('custom', themeColor)
    result['custom-default'] = read('custom', 'default')
    probe.remove()
    return result
  })
  const total = (value: number[]) => value.reduce((sum, channel) => sum + channel, 0)
  // 默认青绿保留品牌青柠，其余方案各按自己的色相取值。
  expect(values.teal).toEqual([220, 239, 155])
  const [blueRed = 0, , blueBlue = 0] = values.blue ?? []
  expect(blueBlue).toBeGreaterThan(blueRed)
  const [forestRed = 0, forestGreen = 0, forestBlue = 0] = values.forest ?? []
  expect(forestGreen).toBeGreaterThan(forestRed)
  expect(forestGreen).toBeGreaterThan(forestBlue)
  const [violetRed = 0, violetGreen = 0, violetBlue = 0] = values.violet ?? []
  expect(violetBlue).toBeGreaterThan(violetGreen)
  expect(violetRed).toBeGreaterThan(violetGreen)
  const [amberRed = 0, amberGreen = 0, amberBlue = 0] = values.amber ?? []
  expect(amberRed).toBeGreaterThan(amberGreen)
  expect(amberGreen).toBeGreaterThan(amberBlue)
  expect(values['custom-blue']?.[2] ?? 0).toBeGreaterThan(values['custom-blue']?.[0] ?? 0)
  expect(values['custom-amber']?.[0] ?? 0).toBeGreaterThan(values['custom-amber']?.[2] ?? 0)
  // 石墨沿用中性冷灰，必须比海蓝的浅蓝面层更深，否则两者在色板里分不开。
  expect(total(values.blue ?? []) - total(values.graphite ?? [])).toBeGreaterThan(40)
  // 主题色「默认」跟随基础色：中性灰下是中性面层，不再保留品牌青柠。
  const neutral = values['custom-default'] ?? []
  expect(neutral).not.toEqual([220, 239, 155])
  expect(Math.max(...neutral) - Math.min(...neutral)).toBeLessThanOrEqual(4)
})

test('可拖动弹窗：位移与指针一致，双击标题复位', async ({ page }) => {
  await page.goto('/design-system/feedback')
  await page.getByRole('button', { name: '打开弹窗' }).click()
  const dialog = page.locator('[data-slot="dialog-content"]')
  await expect(dialog).toBeVisible()
  // 打开时居中：允许动画结束后的亚像素差
  await page.waitForTimeout(400)
  const before = await dialog.boundingBox()
  const handle = await page.locator('[data-slot="dialog-drag-handle"]').boundingBox()
  if (!before || !handle) throw new Error('弹窗或拖拽层没有尺寸')
  const start = { x: handle.x + handle.width / 2, y: handle.y + 20 }

  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x + 120, start.y + 60, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(200)

  // 位移必须等于指针位移：写成固定 translate 会盖掉居中，一按下就跳半个身位
  const moved = await dialog.boundingBox()
  if (!moved) throw new Error('拖动后拿不到弹窗尺寸')
  expect(Math.round(moved.x - before.x)).toBe(120)
  expect(Math.round(moved.y - before.y)).toBe(60)

  // 复位是带 200ms 过渡的，量位置要等它走完
  await page.getByRole('button', { name: '复位位置' }).click()
  await expect(dialog).toHaveAttribute('style', /--tw-translate-x: calc\(-50% \+ 0px\)/)
  await expect
    .poll(async () => Math.round((await dialog.boundingBox())?.x ?? 0))
    .toBe(Math.round(before.x))
  await expect
    .poll(async () => Math.round((await dialog.boundingBox())?.y ?? 0))
    .toBe(Math.round(before.y))
})

test('新增公共组件在演示页可交互', async ({ page }) => {
  await page.goto('/design-system/basic')
  const rate = page.getByRole('slider', { name: '服务评分' })
  await rate.press('ArrowRight')
  await expect(rate).toHaveAttribute('aria-valuenow', '4')

  await page.goto('/design-system/form')
  const calendarHeading = page.getByText('完整日历', { exact: true })
  const transferHeading = page.getByText('穿梭框', { exact: true })
  await expect(calendarHeading).toBeVisible()
  const calendarBox = await calendarHeading.boundingBox()
  const transferBox = await transferHeading.boundingBox()
  expect(calendarBox && transferBox && transferBox.x > calendarBox.x).toBeTruthy()
  expect(Math.abs((calendarBox?.y ?? 0) - (transferBox?.y ?? 0))).toBeLessThan(4)
  await page.getByRole('checkbox', { name: '操作员' }).click()
  await page.getByRole('button', { name: '移动到已选项' }).click()
  // 穿梭框两侧是"复选框组"而不是 listbox 的 option 列表，容器改为 role="group"
  // 后，listbox 缺少 option 子节点的 axe 违规才消失。
  await expect(page.getByRole('group', { name: '已选项' })).toContainText('操作员')

  await page.goto('/design-system/data')
  const separator = page.getByRole('separator', { name: '调整面板大小' })
  await separator.press('ArrowRight')
  await expect(separator).toHaveAttribute('aria-valuenow', '55')
  const firstHandle = page.getByRole('button', { name: /拖动第 1 项/ })
  await firstHandle.press('ArrowDown')
  await expect(page.getByLabel('字段顺序').locator('li').first()).toContainText('负责人')
})

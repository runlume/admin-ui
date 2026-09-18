import { test } from '@playwright/test'

/**
 * 截图评审工具，不是回归用例：默认跳过，需要时用 SCREENSHOTS=1 显式运行。
 * 它会往 /tmp/admin-design-shots 写多张 PNG，供人工核对视觉。
 */
const enabled = process.env.SCREENSHOTS === '1'
import { mkdirSync } from 'node:fs'

const out = '/tmp/admin-design-shots'
mkdirSync(out, { recursive: true })

test.use({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 })

test.skip(!enabled, 'set SCREENSHOTS=1 to capture review screenshots')

test('capture', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${out}/01-dashboard-light.png` })

  await page.getByRole('button', { name: /runlume\.local/ }).click()
  await page.getByRole('menuitem', { name: '设置' }).click()
  await page.getByRole('radio', { name: '深色' }).check()
  await page.getByRole('checkbox', { name: '显示页面标签栏' }).check()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${out}/02-dashboard-dark-tabs.png` })

  await page.getByRole('button', { name: /runlume\.local/ }).click()
  await page.getByRole('menuitem', { name: '设置' }).click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${out}/03-settings-dialog.png` })
  await page.keyboard.press('Escape')

  await page.goto('/customers')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/04-customers-dark.png` })

  await page.getByRole('button', { name: /runlume\.local/ }).click()
  await page.getByRole('menuitem', { name: '设置' }).click()
  await page.getByRole('radio', { name: '浅色' }).check()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await page.goto('/customers/CUS-1001')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/05-detail-light.png` })

  await page.goto('/design-system')
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}/06-design-overview.png`, fullPage: true })

  await page.goto('/')
  await page.getByRole('button', { name: /runlume\.local/ }).click()
  await page.getByRole('menuitem', { name: '设置' }).click()
  await page.getByRole('radio', { name: '海蓝' }).check()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/07-dashboard-blue.png` })

  await page.goto('/notifications')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/08-notifications-light.png` })

  await page.goto('/login')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/09-login-light.png` })

  await page.goto('/design-system/feedback')
  await page.getByRole('button', { name: '成功提示' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${out}/10-toast-success.png` })
  await page.getByRole('button', { name: '失败提示' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${out}/11-toast-error.png` })
  await page.getByRole('button', { name: '警告提示' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${out}/12-toast-warning.png` })

  for (const [index, name] of [
    'basic',
    'form',
    'data',
    'feedback',
    'navigation',
    'metrics',
    'theme',
  ].entries()) {
    await page.goto(`/design-system/${name}`)
    await page.waitForTimeout(600)
    await page.screenshot({
      path: `${out}/2${index}-design-${name}.png`,
      fullPage: true,
    })
  }
})

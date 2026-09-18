import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { chromium, type FullConfig } from '@playwright/test'

/**
 * 控制台未登录时任何路径都会回登录页，所以先跑一次真实登录，把会话写成
 * `storageState` 交给所有用例，省得每条用例各登录一遍。
 * 登录页自身的校验、角色差异由 `auth.spec.ts` 单独覆盖。
 */
export const authFile = 'src/test/e2e/.auth/admin.json'

export default async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects[0]?.use?.baseURL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3200'
  const browser = await chromium.launch()
  const page = await browser.newPage({ baseURL })
  await page.goto('/login')
  await page.getByRole('button', { name: 'admin', exact: true }).click()
  await page.getByRole('button', { name: '登录' }).click()
  await page.waitForURL((url) => url.pathname === '/')
  mkdirSync(dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
  await browser.close()
}

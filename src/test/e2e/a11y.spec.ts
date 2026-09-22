import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * 无障碍门禁：静态页面 + 逐个浮层展开态。
 *
 * 浮层单独扫描，是因为 Radix 打开浮层时会把背景设为 `aria-hidden`；如果背景控件
 * 仍然留在 Tab 顺序里，axe 的 `aria-hidden-focus` 会报错，键盘用户也会在浮层之外
 * 拿到焦点。这里同时断言「展开时零违规」与「关闭后焦点回到触发器」。
 */

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

/** 左键点击展开的浮层触发器。 */
const clickTriggers = ['dialog-trigger', 'sheet-trigger', 'dropdown-menu-trigger', 'select-trigger']

/** 右键展开的浮层触发器。 */
const contextTriggers = ['context-menu-trigger']

/** 每页每类触发器最多扫描几个，避免同一组件重复展开拖长套件。 */
const maxPerTrigger = 3

/**
 * 浮层展开时的已知例外（best-practice 规则，不是 WCAG 失败）。
 *
 * Radix 打开模态浮层会把背景整体 `aria-hidden`：页面里的 `<main>` 与 `<h1>` 随之
 * 退出无障碍树，浮层内容又渲染在 body 下的 portal 里、天然不在任何 landmark 内。
 * 模态对话框下 axe 会把这类情况降级为 needs review，菜单/选择器没有 `aria-modal`
 * 才会落成违规。背景不可见是刻意行为，因此这里只豁免这三条；颜色对比、ARIA 角色、
 * 焦点可tab 等实质性规则仍然全量强制。
 */
const overlayOnlyAllowlist = new Set(['landmark-one-main', 'page-has-heading-one', 'region'])

type Finding = {
  state: string
  rule: string
  impact: string | null
  nodes: { target: string; html: string }[]
}

async function findingsOf(page: Page, state: string): Promise<Finding[]> {
  const { violations } = await new AxeBuilder({ page }).analyze()
  return violations.map((violation) => ({
    state,
    rule: violation.id,
    impact: violation.impact ?? null,
    nodes: violation.nodes.slice(0, 8).map((node) => ({
      target: node.target.join(' '),
      html: node.html.slice(0, 200),
    })),
  }))
}

function report(findings: Finding[]) {
  return findings
    .map(
      (finding) =>
        `${finding.state} → ${finding.rule}（${finding.nodes.length} 个节点）\n` +
        finding.nodes
          .map((node) => `      ${node.target}\n        ${node.html.replace(/\s+/g, ' ')}`)
          .join('\n'),
    )
    .join('\n')
}

/** 收集而不是即时断言：一个页面里前面状态失败时不至于让后面的浮层漏扫。 */
async function audit(page: Page, state: string, findings: Finding[], allowlist?: Set<string>) {
  const next = (await findingsOf(page, state)).filter((finding) => !allowlist?.has(finding.rule))
  findings.push(...next)
  return findings.length
}

async function expectClean(findings: Finding[], label: string) {
  if (findings.length > 0) {
    await test.info().attach('a11y-findings', {
      body: JSON.stringify(findings, null, 2),
      contentType: 'application/json',
    })
  }
  expect(report(findings), `${label} 存在 axe 违规`).toEqual('')
}

test.describe('设计系统静态页面无障碍', () => {
  for (const entry of pages) {
    test(`${entry.title} 无 axe 违规`, async ({ page }) => {
      // 深浅两套语义色都要成立。主题走应用自己的解析（默认跟随系统），
      // 直接给根元素加 `.dark` 会与调色板/自定义色层不一致，扫出假阳性。
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto(entry.path)
      await expect(page.getByRole('heading', { level: 1 })).toContainText(entry.title)
      const findings: Finding[] = []
      await audit(page, `${entry.title}（浅色）`, findings)

      await page.emulateMedia({ colorScheme: 'dark' })
      await page.reload()
      await expect(page.getByRole('heading', { level: 1 })).toContainText(entry.title)
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
      await audit(page, `${entry.title}（深色）`, findings)
      await expectClean(findings, entry.title)
    })
  }
})

test.describe('浮层展开态无障碍', () => {
  for (const entry of pages) {
    test(`${entry.title} 浮层展开无违规且焦点可回归`, async ({ page }) => {
      await page.goto(entry.path)
      await expect(page.getByRole('heading', { level: 1 })).toContainText(entry.title)

      const findings: Finding[] = []
      await audit(page, `${entry.title}（静态）`, findings)

      const overlays = [
        ...clickTriggers.map((slot) => ({ slot, button: 'left' as const })),
        ...contextTriggers.map((slot) => ({ slot, button: 'right' as const })),
      ]

      for (const { slot, button } of overlays) {
        const triggers = page.locator(`[data-slot="${slot}"]:visible`)
        const count = Math.min(await triggers.count(), maxPerTrigger)
        for (let index = 0; index < count; index += 1) {
          const trigger = triggers.nth(index)
          await trigger.scrollIntoViewIfNeeded()
          await trigger.click({ button })

          const openContent = page.locator(
            '[data-slot="dialog-content"]:visible, [data-slot="sheet-content"]:visible, [data-slot="dropdown-menu-content"]:visible, [data-slot="context-menu-content"]:visible, [data-slot="select-content"]:visible',
          )
          await expect(openContent.first()).toBeVisible()
          // 浮层自带淡入/缩放动画，动画途中元素的透明度还没到 1，axe 会把混色当成最终颜色
          // 报假冲突；等动画跑完再扫描。
          await openContent
            .first()
            .evaluate((node) =>
              Promise.all(
                node
                  .getAnimations({ subtree: true })
                  .map((animation) => animation.finished.catch(() => undefined)),
              ),
            )

          // 浮层自身（含菜单项、选项）绝不能被一起设成 inert，否则展开着也点不动。
          const openContentInert = await openContent
            .first()
            .evaluate((node) => Boolean(node.closest('[inert]')))
          if (openContentInert) {
            findings.push({
              state: `${entry.title} → ${slot} #${index + 1}`,
              rule: '浮层自身被设为 inert',
              impact: 'critical',
              nodes: [],
            })
          }

          await audit(
            page,
            `${entry.title} → ${slot} #${index + 1}`,
            findings,
            overlayOnlyAllowlist,
          )

          await page.keyboard.press('Escape')
          await expect(openContent).toHaveCount(0)
          const released = await page.evaluate(
            () => document.querySelectorAll('[inert]').length === 0,
          )
          if (!released) {
            findings.push({
              state: `${entry.title} → ${slot} #${index + 1}`,
              rule: '关闭后残留 inert',
              impact: 'serious',
              nodes: [],
            })
          }
          // 右键菜单按 APG 是把焦点交还给打开前的元素，触发器本身不一定可聚焦，
          // 所以只对点击类浮层断言焦点回到触发器。
          if (button === 'left') {
            if (!(await trigger.evaluate((node) => node === document.activeElement))) {
              findings.push({
                state: `${entry.title} → ${slot} #${index + 1}`,
                rule: '焦点未回到触发器',
                impact: 'serious',
                nodes: [],
              })
            }
          }
        }
      }

      await expectClean(findings, entry.title)
    })
  }
})

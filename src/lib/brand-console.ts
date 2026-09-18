import { brandInfo } from './brand-info'

/**
 * 控制台样式只能用字面量（浏览器不解析 CSS 变量），这里登记一次，
 * 颜色取值与 src/index.css 的 --primary、--brand-lime、--foreground 对齐。
 */
const font = 'font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 13px;'
const styles = {
  text: `${font} padding: 6px 2px; color: #4f6d68;`,
  name: `${font} padding: 6px 8px; color: #ffffff; background: #086c6a; font-weight: 600;`,
  product: `${font} padding: 6px 8px; color: #244030; background: #dcef9b; font-weight: 600;`,
  icon: `${font} padding: 6px 6px; color: #d7f0ff; background: #065654;`,
  site: `${font} padding: 6px 8px; color: #d7f0ff; background: #065654; text-decoration: underline; text-underline-offset: 2px;`,
  warning: `${font} padding: 4px 2px; color: #92400e; font-weight: 600;`,
} as const

export type ConsoleMessage = {
  /** 可能带 `%c` 占位符。 */
  text: string
  /** 与 `%c` 顺序一一对应的样式。 */
  styles?: string[]
}

/**
 * 控制台要输出的内容。抽成纯函数（语言作参数），单元测试断言文案，
 * Playwright 断言它真的被打印出来。
 */
export function brandConsoleMessages(lang: string): ConsoleMessage[] {
  const zh = lang.toLowerCase().startsWith('zh')
  // 站点地址走环境变量，没配时回落到品牌默认值。
  const site = import.meta.env.VITE_APP_PLATFORM_WEB_BASEURL || brandInfo.site
  return [
    {
      text: zh
        ? `%c由%c${brandInfo.name}%c${brandInfo.product}%c驱动%c👉%c${site}`
        : `%cPowered by%c${brandInfo.name}%c${brandInfo.productEn}%c%c👉%c${site}`,
      styles: [styles.text, styles.name, styles.product, styles.text, styles.icon, styles.site],
    },
    { text: `%c${brandInfo.warning}`, styles: [styles.warning] },
  ]
}

let printed = false

/** 打印品牌信息。重复调用（HMR、重复挂载）只输出一次。 */
export function printBrandBanner(): void {
  if (printed) return
  printed = true
  // i18n 在 App 导入时已按用户的存储偏好写好 <html lang>，这里直接沿用。
  const lang = document.documentElement.lang || navigator.language
  for (const message of brandConsoleMessages(lang)) {
    console.info(message.text, ...(message.styles ?? []))
  }
}

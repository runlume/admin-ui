/**
 * 访问统计（GoatCounter）。
 *
 * 上报脚本由构建按 `VITE_APP_ANALYTICS_URL` 注入（见 `scripts/analytics.ts`），整页打开的那一次
 * 由脚本自己计数；这里只补单页应用切路由时的页面浏览 —— 否则不管点进多少个页面，
 * 后台只会留下入口页一条记录。
 *
 * 脚本自带 localhost / 内网 IP / `file:` / 预渲染过滤，本地开发与 Playwright 不会写进线上数据。
 */
declare global {
  interface Window {
    goatcounter?: { count: (vars?: { path?: string }) => void }
  }
}

/**
 * 模块求值时还没发生任何导航，此刻的地址就是入口页：它的那次访问由 `index.html` 里的脚本
 * 在整页加载时上报过了，这里只记下来，避免路由初始化的通知把入口页再算一次。
 */
let lastPath = window.location.pathname + window.location.search

/** 上报一次页面浏览。同一个路径连续上报只算一次，重复渲染不会多记。 */
export function trackPageview(path: string): void {
  if (path === lastPath) return
  lastPath = path
  window.goatcounter?.count({ path })
}

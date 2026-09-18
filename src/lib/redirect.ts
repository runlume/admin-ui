/**
 * 登录后回跳目标：只接受站内路径。
 *
 * 未登录访问深链接时会把目标带进登录页（`/login?redirect=…`），登录成功后跳回那里；
 * 带域名、协议或 `//host` 的值一律丢弃 —— 否则登录页就成了开放重定向的跳板。
 */
export function safeRedirect(value: string | null | undefined): string {
  const target = value?.trim()
  if (!target || !target.startsWith('/') || target.startsWith('//')) return '/'
  // 反斜杠在部分浏览器里等价于 `/`，`/\evil.com` 也要挡掉。
  if (target.startsWith('/\\')) return '/'
  return target
}

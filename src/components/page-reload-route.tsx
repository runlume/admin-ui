import { useLayoutEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { PAGE_RELOAD_PATH } from './page-reload-button'

export function PageReloadRoute() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const candidate: unknown = state?.returnTo
  const returnTo =
    typeof candidate === 'string' &&
    candidate.startsWith('/') &&
    !candidate.startsWith('//') &&
    !/[\\\r\n]/.test(candidate)
      ? candidate
      : '/'
  const target = returnTo.split(/[?#]/)[0] === PAGE_RELOAD_PATH ? '/' : returnTo
  useLayoutEffect(() => {
    // Return before paint so the temporary empty route never flashes on screen.
    queueMicrotask(() => {
      void navigate(target, {
        replace: true,
        // 标记这是"重建当前页"的回程，页面切换动画要跳过。
        state: { ...(state?.previousState ?? {}), pageReloadReturn: true },
        flushSync: true,
      })
    })
  }, [navigate, target, state])
  return null
}

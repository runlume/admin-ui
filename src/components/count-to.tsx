import { useEffect, useState, useSyncExternalStore } from 'react'
import { formatNumber } from '@/lib/metrics'

/** 系统"减少动态效果"设置，用外部存储订阅，避免在 effect 里同步 setState。 */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (callback) => {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)')
      query.addEventListener('change', callback)
      return () => query.removeEventListener('change', callback)
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
}

/**
 * 数字滚动。系统开启"减少动态效果"时直接显示终值。
 */
export function CountTo({
  value,
  duration = 1200,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  className,
}: {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  separator?: string
  className?: string
}) {
  const reduced = usePrefersReducedMotion()
  const animated = !reduced && duration > 0
  const [display, setDisplay] = useState(value)
  useEffect(() => {
    if (!animated) return
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(value * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, animated])
  return (
    <span data-slot="count-to" className={className}>
      {formatNumber(animated ? display : value, { decimals, prefix, suffix, separator })}
    </span>
  )
}

import { useId } from 'react'
import { sparklinePath, sparklinePoints } from '@/lib/metrics'
import { cn } from '@/lib/utils'

/** 迷你趋势线；数值序列自绘 SVG，不引图表库。 */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  smooth = true,
  label,
  className,
}: {
  values: number[]
  width?: number
  height?: number
  smooth?: boolean
  /** 图形的访问名称，通常写成"近 7 天趋势"。 */
  label: string
  className?: string
}) {
  const gradientId = `sparkline-${useId()}`
  const points = sparklinePoints(values, width, height)
  const line = sparklinePath(points, smooth)
  const area = points.length
    ? `${line} L${points.at(-1)!.x} ${height} L${points[0]!.x} ${height} Z`
    : ''
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      style={{ width, height }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={area} fill={`url(#${gradientId})`} />}
      <path
        d={line}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * 普通柱状图（纵向）：带纵轴刻度、网格线、横轴标签与悬停读数。
 * 适合"按天/按月"的数值对比，比迷你柱状更适合单独成块的图表区。
 */
export function ColumnChart({
  data,
  label,
  height = 220,
  tone = 'var(--primary)',
  valueSuffix = '',
  showAverage = true,
  className,
}: {
  data: { label: string; value: number }[]
  label: string
  height?: number
  tone?: string
  valueSuffix?: string
  /** 是否画一条平均值参考线。 */
  showAverage?: boolean
  className?: string
}) {
  const [active, setActive] = useState<number>()
  const width = 640
  const padding = { top: 16, right: 12, bottom: 26, left: 40 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const max = Math.max(...data.map((item) => item.value), 1)
  const step = innerWidth / Math.max(1, data.length)
  const barWidth = Math.max(6, Math.min(28, step * 0.55))
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max]
  const average = data.reduce((sum, item) => sum + item.value, 0) / Math.max(1, data.length)
  const yOf = (value: number) => padding.top + innerHeight - (value / max) * innerHeight

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('w-full', className)}
      style={{ height }}
      onMouseLeave={() => setActive(undefined)}
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={yOf(tick)}
            y2={yOf(tick)}
            stroke="var(--border)"
            strokeDasharray={tick === 0 ? undefined : '2 6'}
          />
          <text
            x={padding.left - 6}
            y={yOf(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {Math.round(tick)}
          </text>
        </g>
      ))}
      {showAverage && (
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={yOf(average)}
          y2={yOf(average)}
          stroke="var(--warning)"
          strokeDasharray="4 4"
        />
      )}
      {data.map((item, index) => {
        const x = padding.left + index * step + (step - barWidth) / 2
        const y = yOf(item.value)
        const barHeight = Math.max(2, padding.top + innerHeight - y)
        return (
          <g key={item.label}>
            <rect
              x={padding.left + index * step}
              y={padding.top}
              width={step}
              height={innerHeight}
              fill="transparent"
              onMouseEnter={() => setActive(index)}
            />
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={3}
              fill={tone}
              opacity={active === undefined || active === index ? 1 : 0.45}
            />
            {active === index && (
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-medium"
              >
                {item.value}
                {valueSuffix}
              </text>
            )}
            <text
              x={padding.left + index * step + step / 2}
              y={height - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {item.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

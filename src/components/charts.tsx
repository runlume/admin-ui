import { useId, useState } from 'react'
import { sparklinePath } from '@/lib/metrics'
import { cn } from '@/lib/utils'

/** 迷你柱状图：适合指标卡里的分布对比，纯 SVG 自绘。 */
export function MiniBars({
  values,
  label,
  height = 32,
  className,
}: {
  values: number[]
  label: string
  height?: number
  className?: string
}) {
  const max = Math.max(...values, 1)
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${values.length * 4} ${height}`}
      className={cn('w-full', className)}
      style={{ height }}
    >
      {values.map((value, index) => {
        const bar = (value / max) * (height - 2)
        return (
          <rect
            key={index}
            x={index * 4}
            y={height - bar}
            width={2.6}
            height={bar}
            rx={1}
            fill="var(--primary)"
            opacity={0.35 + 0.65 * (value / max)}
          />
        )
      })}
    </svg>
  )
}

/** 环形进度：额度、完成率这类单个百分比，比线性进度条更醒目。 */
export function DonutChart({
  value,
  max = 100,
  label,
  size = 96,
  tone = 'var(--primary)',
}: {
  value: number
  max?: number
  label: string
  size?: number
  tone?: string
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const radius = size / 2 - 8
  const circumference = 2 * Math.PI * radius
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg role="img" aria-label={label} width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute text-sm font-semibold tabular-nums">{Math.round(percent)}%</span>
    </div>
  )
}

/** 对比折线图：多条序列共用坐标轴，悬停显示数值。 */
export function LineChart({
  series,
  labels,
  height = 160,
  className,
}: {
  series: { name: string; values: number[]; tone?: string }[]
  labels: string[]
  height?: number
  className?: string
}) {
  const gradientId = useId()
  const [active, setActive] = useState<number>()
  const width = 480
  const all = series.flatMap((item) => item.values)
  const max = Math.max(...all, 1)
  const min = Math.min(...all, 0)
  const scale = (value: number) => height - 16 - ((value - min) / (max - min || 1)) * (height - 32)
  return (
    <div className={cn('space-y-2', className)}>
      <svg
        role="img"
        aria-label={series.map((item) => item.name).join(' / ')}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        onMouseLeave={() => setActive(undefined)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1={0}
            x2={width}
            y1={16 + (line * (height - 32)) / 3}
            y2={16 + (line * (height - 32)) / 3}
            stroke="var(--border)"
            strokeDasharray="2 6"
          />
        ))}
        {series.map((item, seriesIndex) => {
          const points = item.values.map((value, index) => ({
            x: (index / Math.max(1, item.values.length - 1)) * width,
            y: scale(value),
          }))
          return (
            <g key={item.name}>
              {seriesIndex === 0 && (
                <path
                  d={`${sparklinePath(points, true)} L${width} ${height} L0 ${height} Z`}
                  fill={`url(#${gradientId})`}
                />
              )}
              <path
                d={sparklinePath(points, true)}
                fill="none"
                stroke={item.tone ?? (seriesIndex === 0 ? 'var(--primary)' : 'var(--info)')}
                strokeWidth={2}
                strokeLinecap="round"
              />
              {points.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={active === index ? 4 : 2.5}
                  fill={item.tone ?? (seriesIndex === 0 ? 'var(--primary)' : 'var(--info)')}
                />
              ))}
            </g>
          )
        })}
        {labels.map((label, index) => (
          <g key={label}>
            <rect
              x={(index / Math.max(1, labels.length - 1)) * width - 16}
              y={0}
              width={32}
              height={height}
              fill="transparent"
              onMouseEnter={() => setActive(index)}
            />
            <text
              x={(index / Math.max(1, labels.length - 1)) * width}
              y={height - 2}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {label}
            </text>
          </g>
        ))}
      </svg>
      <ul className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {series.map((item, index) => (
          <li key={item.name} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ background: item.tone ?? (index === 0 ? 'var(--primary)' : 'var(--info)') }}
            />
            {item.name}
            {active !== undefined && (
              <span className="tabular-nums text-foreground">
                {item.values[active]?.toLocaleString('zh-CN')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 横向条形对比：类别不多时比折线更直观。 */
export function BarList({
  items,
  label,
  className,
}: {
  items: { name: string; value: number }[]
  label: string
  className?: string
}) {
  const max = Math.max(...items.map((item) => item.value), 1)
  return (
    <ul aria-label={label} className={cn('space-y-3', className)}>
      {items.map((item) => (
        <li key={item.name} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">{item.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {item.value.toLocaleString('zh-CN')}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** 热力小格：按周 × 时段展示分布，比表格更快看出高峰。 */
export function Heatmap({
  rows,
  columns,
  values,
  label,
  className,
}: {
  rows: string[]
  columns: string[]
  /** values[row][column]，取值 0–1。 */
  values: number[][]
  label: string
  className?: string
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table aria-label={label} className="w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            {/* 角格只占位，不承载数据，声明为展示单元避免被读成空表头。 */}
            <th role="presentation" />
            {columns.map((column) => (
              <th key={column} className="font-normal text-muted-foreground">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row}>
              <th scope="row" className="pr-2 text-right font-normal text-muted-foreground">
                {row}
              </th>
              {columns.map((column, columnIndex) => {
                const value = values[rowIndex]?.[columnIndex] ?? 0
                return (
                  <td key={column}>
                    <span
                      title={`${row} ${column} · ${Math.round(value * 100)}%`}
                      className="block h-6 rounded"
                      style={{
                        background:
                          value === 0
                            ? 'var(--muted)'
                            : `color-mix(in oklab, var(--primary) ${Math.round(value * 100)}%, transparent)`,
                      }}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 雷达图：多维度评分对比，适合能力/健康度画像。 */
export function RadarChart({
  axes,
  series,
  size = 220,
  className,
}: {
  /** 维度名称，各序列按同一顺序给值（0–1）。 */
  axes: string[]
  series: { name: string; values: number[]; tone?: string }[]
  size?: number
  className?: string
}) {
  const center = size / 2
  const radius = center - 34
  const point = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2
    return [center + Math.cos(angle) * radius * value, center + Math.sin(angle) * radius * value]
  }
  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      <svg
        role="img"
        aria-label={series.map((item) => item.name).join(' / ')}
        width={size}
        height={size}
      >
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <polygon
            key={ring}
            points={axes.map((_, index) => point(index, ring).join(',')).join(' ')}
            fill="none"
            stroke="var(--border)"
          />
        ))}
        {axes.map((axis, index) => {
          const [x, y] = point(index, 1)
          const [labelX, labelY] = point(index, 1.16)
          return (
            <g key={axis}>
              <line x1={center} y1={center} x2={x} y2={y} stroke="var(--border)" />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {axis}
              </text>
            </g>
          )
        })}
        {series.map((item, index) => {
          const tone = item.tone ?? (index === 0 ? 'var(--primary)' : 'var(--info)')
          return (
            <polygon
              key={item.name}
              points={item.values.map((value, axis) => point(axis, value).join(',')).join(' ')}
              fill={`color-mix(in oklab, ${tone} 18%, transparent)`}
              stroke={tone}
              strokeWidth={2}
            />
          )
        })}
      </svg>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {series.map((item, index) => (
          <li key={item.name} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ background: item.tone ?? (index === 0 ? 'var(--primary)' : 'var(--info)') }}
            />
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 漏斗图：各阶段数量与转化率，最后一列展示阶段间转化。 */
export function FunnelChart({
  stages,
  className,
}: {
  stages: { name: string; value: number }[]
  className?: string
}) {
  const top = Math.max(...stages.map((item) => item.value), 1)
  return (
    <ul aria-label="转化漏斗" className={cn('space-y-2', className)}>
      {stages.map((stage, index) => {
        const width = (stage.value / top) * 100
        const previous = stages[index - 1]?.value
        const rate = previous ? Math.round((stage.value / previous) * 100) : 100
        return (
          <li key={stage.name} className="flex items-center gap-3">
            <span className="w-20 shrink-0 truncate text-xs text-muted-foreground">
              {stage.name}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className="flex h-7 items-center justify-end rounded bg-primary pr-2 text-xs font-medium text-primary-foreground"
                style={{ width: `${Math.max(width, 6)}%` }}
              >
                {stage.value.toLocaleString('zh-CN')}
              </span>
            </span>
            <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {index === 0 ? '—' : `${rate}%`}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** 甘特图：任务条按天排布，支持进度与今日标线。 */
export function GanttChart({
  rows,
  days,
  today,
  className,
}: {
  rows: { name: string; start: number; span: number; progress?: number; tone?: string }[]
  /** 时间轴刻度，通常是日期或"第 N 天"。 */
  days: string[]
  /** 今日对应的列下标，传入后画一条竖线。 */
  today?: number
  className?: string
}) {
  const columnWidth = 40
  const width = days.length * columnWidth
  // 甘特图宽度随天数增长，窄屏需要横向滚动；容器本身可聚焦，键盘才能滚动。
  return (
    <div className={cn('overflow-x-auto', className)} tabIndex={0}>
      <div className="min-w-max">
        <div className="flex text-[10px] text-muted-foreground">
          <span className="w-28 shrink-0" />
          <div className="relative" style={{ width }}>
            {days.map((day, index) => (
              <span
                key={day}
                className="absolute -translate-x-1/2 text-center"
                style={{ left: index * columnWidth + columnWidth / 2 }}
              >
                {day}
              </span>
            ))}
          </div>
        </div>
        <ul aria-label="任务排期" className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.name} className="flex items-center">
              <span className="w-28 shrink-0 truncate pr-2 text-xs">{row.name}</span>
              <div className="relative h-6" style={{ width }}>
                {days.map((day, index) => (
                  <span
                    key={day}
                    aria-hidden="true"
                    className="absolute inset-y-0 border-l border-border/60"
                    style={{ left: index * columnWidth }}
                  />
                ))}
                <span
                  className="absolute top-1 h-4 rounded"
                  style={{
                    left: row.start * columnWidth + 2,
                    width: Math.max(row.span * columnWidth - 4, 8),
                    background: `color-mix(in oklab, ${row.tone ?? 'var(--primary)'} 35%, transparent)`,
                  }}
                >
                  <span
                    className="block h-full rounded"
                    style={{
                      width: `${row.progress ?? 100}%`,
                      background: row.tone ?? 'var(--primary)',
                    }}
                  />
                </span>
                {today !== undefined && today >= 0 && today < days.length && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 w-px bg-danger"
                    style={{ left: today * columnWidth + columnWidth / 2 }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

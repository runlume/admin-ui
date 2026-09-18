/** 指标卡的数值格式化与迷你趋势线取点。 */
export function formatNumber(
  value: number,
  options: { decimals?: number; separator?: string; prefix?: string; suffix?: string } = {},
) {
  const { decimals = 0, separator = ',', prefix = '', suffix = '' } = options
  const fixed = value.toFixed(decimals)
  const [integer = '0', decimal] = fixed.split('.')
  const grouped = separator ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : integer
  return `${prefix}${grouped}${decimal ? `.${decimal}` : ''}${suffix}`
}

export type SparklinePoint = { x: number; y: number }

/** 把数值序列映射到 SVG 坐标，y 轴反向（值越大越靠上）。 */
export function sparklinePoints(
  values: number[],
  width: number,
  height: number,
  padding = 2,
): SparklinePoint[] {
  if (!values.length) return []
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const innerHeight = Math.max(height - padding * 2, 1)
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0
  // 数值完全相同（含单个点）时压在中线，避免贴边显示。
  const flat = maximum === minimum
  return values.map((value, index) => ({
    x: padding + index * step,
    y: flat
      ? padding + innerHeight / 2
      : padding + innerHeight - ((value - minimum) / (maximum - minimum)) * innerHeight,
  }))
}

export function sparklinePath(points: SparklinePoint[], smooth = false) {
  if (!points.length) return ''
  if (!smooth || points.length < 3)
    return points.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' ')
  return points
    .map((point, index) => {
      if (!index) return `M${point.x} ${point.y}`
      const previous = points[index - 1] ?? point
      const middle = (previous.x + point.x) / 2
      return `C${middle} ${previous.y} ${middle} ${point.y} ${point.x} ${point.y}`
    })
    .join(' ')
}

export function trendDirection(values: number[]): 'up' | 'down' | 'flat' {
  if (values.length < 2) return 'flat'
  const first = values[0] ?? 0
  const last = values[values.length - 1] ?? 0
  if (last > first) return 'up'
  if (last < first) return 'down'
  return 'flat'
}

/** 与上期对比的百分比变化，用于指标卡的涨跌徽标。 */
export function trendPercent(current: number, previous: number): number | undefined {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return undefined
  return ((current - previous) / Math.abs(previous)) * 100
}

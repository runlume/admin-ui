import { Slider as SliderPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

/** 滑块：单值用于阈值，双值用于区间。 */
function Slider({
  className,
  value,
  onValueChange,
  label,
  ticks,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  label: string
  /** 刻度位置（与 value 同一坐标），用于标注关键档位。 */
  ticks?: number[]
}) {
  const values = value ?? [0]
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      aria-label={label}
      value={value}
      onValueChange={onValueChange}
      className={cn(
        'relative flex w-full touch-none select-none items-center data-[orientation=vertical]:h-40 data-[orientation=vertical]:w-4 data-[orientation=vertical]:flex-col',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5">
        <SliderPrimitive.Range className="absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full" />
      </SliderPrimitive.Track>
      {ticks && ticks.length > 0 && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-full mt-1">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute -translate-x-1/2 text-[10px] text-muted-foreground"
              style={{
                left: `${(((tick - (props.min ?? 0)) / ((props.max ?? 100) - (props.min ?? 0) || 1)) * 100).toFixed(2)}%`,
              }}
            >
              {tick}
            </span>
          ))}
        </span>
      )}
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label={`${label} ${index + 1}`}
          className="block size-4 rounded-full border border-primary/40 bg-card shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }

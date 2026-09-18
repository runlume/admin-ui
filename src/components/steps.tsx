import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepItem = { value: string; label: string; description?: string }
export type StepStatus = 'waiting' | 'process' | 'finish' | 'error'

/** 步骤条：横向展示流程进度，用当前步骤推导状态。 */
export function Steps({
  items,
  current,
  status = 'process',
  className,
}: {
  items: StepItem[]
  /** 当前步骤下标，从 0 开始。 */
  current: number
  status?: Extract<StepStatus, 'process' | 'error'>
  className?: string
}) {
  const stateOf = (index: number): StepStatus =>
    index < current ? 'finish' : index === current ? status : 'waiting'
  return (
    <ol
      data-slot="steps"
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-start', className)}
    >
      {items.map((item, index) => {
        const state = stateOf(index)
        return (
          <li key={item.value} className="flex min-w-0 flex-1 items-start gap-3">
            <span
              aria-hidden="true"
              data-state={state}
              className={cn(
                'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                state === 'finish' && 'border-primary bg-primary text-primary-foreground',
                state === 'process' && 'border-primary text-primary',
                state === 'error' && 'border-danger bg-danger-soft text-danger',
                state === 'waiting' && 'border-input text-muted-foreground',
              )}
            >
              {state === 'finish' ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block text-sm font-medium',
                  state === 'waiting' && 'text-muted-foreground',
                  state === 'error' && 'text-danger',
                )}
              >
                {item.label}
              </span>
              {item.description && (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {item.description}
                </span>
              )}
            </span>
            {index < items.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'mt-3.5 hidden h-px flex-1 shrink sm:block',
                  state === 'finish' ? 'bg-primary/40' : 'bg-border',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

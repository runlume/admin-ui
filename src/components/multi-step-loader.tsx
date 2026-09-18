import { CircleCheck, LoaderCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type LoadingStep = {
  key: string
  label: string
  description?: string
}

/**
 * 多步加载：初始化、导入、批处理这类有阶段的过程。
 * 已完成阶段打勾，当前阶段转圈，失败阶段标红。
 */
export function MultiStepLoader({
  steps,
  current,
  failed,
  className,
}: {
  steps: LoadingStep[]
  /** 当前阶段下标；等于 steps.length 表示全部完成。 */
  current: number
  /** 失败阶段的下标，传入后该阶段显示为失败。 */
  failed?: number
  className?: string
}) {
  return (
    <ol
      data-slot="multi-step-loader"
      aria-busy={current < steps.length}
      className={cn('space-y-3 rounded-xl border bg-card p-4', className)}
    >
      {steps.map((step, index) => {
        const state =
          failed === index
            ? 'failed'
            : index < current
              ? 'done'
              : index === current
                ? 'doing'
                : 'pending'
        return (
          <li key={step.key} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-4 shrink-0 items-center justify-center"
            >
              {state === 'done' && <CircleCheck className="size-4 text-success" />}
              {state === 'doing' && <LoaderCircle className="size-4 animate-spin text-primary" />}
              {state === 'failed' && <X className="size-4 text-danger" />}
              {state === 'pending' && <span className="size-2 rounded-full bg-border" />}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block text-sm',
                  state === 'pending' && 'text-muted-foreground',
                  state === 'failed' && 'text-danger',
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {step.description}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

import * as React from 'react'
import { Popover } from 'radix-ui'
import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { inputBaseClass } from './input'

export function TimeInput({
  ref,
  className,
  disabled,
  readOnly,
  onKeyDown,
  ...props
}: React.ComponentProps<'input'>) {
  const { i18n } = useTranslation()
  const english = i18n.language.startsWith('en')
  const native = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = React.useState(false)
  const [time, setTime] = React.useState('00:00')
  React.useImperativeHandle(ref, () => native.current!)
  function show(next: boolean) {
    if (next) setTime(native.current!.value || '00:00')
    setOpen(next)
  }
  function choose(index: number, value: string) {
    const parts = time.split(':')
    parts[index] = value
    const next = parts.join(':')
    const input = native.current!
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, next)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    setTime(next)
  }
  return (
    <Popover.Root open={open} onOpenChange={show}>
      <Popover.Anchor asChild>
        <div className="relative w-full min-w-0">
          <input
            {...props}
            ref={native}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(inputBaseClass, 'themed-time-input pr-10', className)}
            onKeyDown={(event) => {
              onKeyDown?.(event)
              if (
                !event.defaultPrevented &&
                event.altKey &&
                event.key === 'ArrowDown' &&
                !disabled &&
                !readOnly
              ) {
                event.preventDefault()
                show(true)
              }
            }}
          />
          <Popover.Trigger asChild>
            <button
              type="button"
              disabled={disabled || readOnly}
              aria-label={english ? 'Choose time' : '选择时间'}
              className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              <Clock className="size-4" />
            </button>
          </Popover.Trigger>
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          aria-label={english ? 'Choose time' : '选择时间'}
          className="z-50 w-48 rounded-xl border bg-popover p-2 text-popover-foreground shadow-md"
        >
          <div className="grid grid-cols-2 gap-2">
            {[24, 60].map((count, index) => (
              <div key={index}>
                <p className="pb-2 text-center text-xs text-muted-foreground">
                  {index === 0 ? (english ? 'Hour' : '时') : english ? 'Minute' : '分'}
                </p>
                <div
                  className="h-48 space-y-1 overflow-y-auto"
                  role="group"
                  aria-label={index === 0 ? (english ? 'Hour' : '时') : english ? 'Minute' : '分'}
                >
                  {Array.from({ length: count }, (_, number) => {
                    const value = String(number).padStart(2, '0')
                    const selected = time.split(':')[index] === value
                    return (
                      <button
                        type="button"
                        key={value}
                        aria-pressed={selected}
                        ref={(node) => {
                          if (node && selected) node.scrollIntoView?.({ block: 'nearest' })
                        }}
                        onClick={() => choose(index, value)}
                        className={cn(
                          'h-8 w-full rounded-md text-sm tabular-nums outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                          selected && 'bg-primary text-primary-foreground hover:bg-primary',
                        )}
                      >
                        {value}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end border-t pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-1 text-sm text-primary hover:bg-accent"
            >
              {english ? 'Done' : '完成'}
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

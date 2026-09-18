import * as React from 'react'
import { Select as Primitive } from 'radix-ui'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = Omit<React.ComponentProps<'select'>, 'size' | 'multiple'> & { size?: 'sm' | 'default' }
type Option = { value: string; label: React.ReactNode; disabled?: boolean; group?: string }
function optionsOf(children: React.ReactNode, group?: string, disabled = false): Option[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (
      !React.isValidElement<{
        value?: string | number
        children?: React.ReactNode
        label?: string
        disabled?: boolean
      }>(child)
    )
      return []
    if (child.type === React.Fragment) return optionsOf(child.props.children, group, disabled)
    if (child.type === 'optgroup' || child.type === NativeSelectOptGroup)
      return optionsOf(child.props.children, child.props.label, child.props.disabled)
    return [
      {
        value: String(child.props.value ?? child.props.children ?? ''),
        label: child.props.children,
        disabled: disabled || child.props.disabled,
        group,
      },
    ]
  })
}

/** Keeps native form values and change events while rendering a themed, keyboard-accessible menu. */
function NativeSelect({
  className,
  size = 'default',
  children,
  value,
  defaultValue,
  onChange,
  ref,
  id,
  name,
  disabled,
  required,
  onInvalid,
  ...props
}: Props) {
  const options = optionsOf(children)
  const initial = String(defaultValue ?? options.find((option) => !option.disabled)?.value ?? '')
  const [localValue, setLocalValue] = React.useState(initial)
  const requestedValue = value === undefined ? localValue : String(value)
  const match = options.findIndex((option) => option.value === requestedValue)
  const selected = match >= 0 ? match : options.findIndex((option) => !option.disabled)
  const selectedValue = options[selected]?.value ?? ''
  const resetValue = React.useRef(value === undefined ? initial : selectedValue)
  React.useLayoutEffect(() => {
    resetValue.current = value === undefined ? initial : selectedValue
  }, [value, initial, selectedValue])
  const resetting = React.useRef(false)
  const native = React.useRef<HTMLSelectElement>(null)
  const trigger = React.useRef<HTMLButtonElement>(null)
  React.useImperativeHandle(ref, () => native.current!)
  React.useEffect(() => {
    const select = native.current!
    select.focus = (options) => trigger.current?.focus(options)
    const reset = (event: Event) => {
      resetting.current = true
      queueMicrotask(() => {
        if (!event.defaultPrevented) {
          setLocalValue(initial)
          select.value = resetValue.current
        }
        resetting.current = false
      })
    }
    const form = select.form
    form?.addEventListener('reset', reset, true)
    return () => form?.removeEventListener('reset', reset, true)
  }, [initial])
  function change(index: string) {
    if (resetting.current || index === '' || options[Number(index)]?.value === selectedValue) return
    const select = native.current!
    const next = options[Number(index)]?.value
    if (next === undefined) return
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(select, next)
    select.dispatchEvent(new Event('change', { bubbles: true }))
  }
  return (
    <div data-slot="native-select-wrapper" className="relative w-full min-w-0">
      <Primitive.Root
        value={selected < 0 ? '' : String(selected)}
        onValueChange={change}
        disabled={disabled}
      >
        <Primitive.Trigger
          value={selectedValue}
          ref={trigger}
          id={id}
          onBlur={() =>
            native.current?.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
          }
          aria-label={props['aria-label']}
          aria-labelledby={props['aria-labelledby']}
          aria-describedby={props['aria-describedby']}
          aria-invalid={props['aria-invalid']}
          aria-required={required}
          data-slot="select-trigger"
          data-size={size}
          className={cn(
            'flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-card px-3.5 text-sm font-normal shadow-none outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 data-[size=sm]:h-8 aria-invalid:border-destructive [&>span:first-child]:truncate',
            className,
          )}
        >
          <span>{options[selected]?.label}</span>
          <Primitive.Icon>
            <ChevronDown
              data-slot="native-select-icon"
              className="size-4 shrink-0 text-muted-foreground"
            />
          </Primitive.Icon>
        </Primitive.Trigger>
        <Primitive.Portal>
          <Primitive.Content
            position="popper"
            sideOffset={4}
            data-slot="select-content"
            className="z-50 max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md"
          >
            <Primitive.ScrollUpButton className="flex justify-center py-1">
              <ChevronUp className="size-4" />
            </Primitive.ScrollUpButton>
            <Primitive.Viewport className="p-1">
              {options.map((option, index) => (
                <React.Fragment key={option.value}>
                  {option.group && options[index - 1]?.group !== option.group && (
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      {option.group}
                    </div>
                  )}
                  <Primitive.Item
                    value={String(index)}
                    data-value={option.value}
                    disabled={option.disabled}
                    className="relative flex min-h-9 cursor-default items-center rounded-md py-2 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=checked]:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <Primitive.ItemIndicator className="absolute left-2">
                      <Check className="size-4" />
                    </Primitive.ItemIndicator>
                    <Primitive.ItemText>{option.label}</Primitive.ItemText>
                  </Primitive.Item>
                </React.Fragment>
              ))}
            </Primitive.Viewport>
            <Primitive.ScrollDownButton className="flex justify-center py-1">
              <ChevronDown className="size-4" />
            </Primitive.ScrollDownButton>
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
      <select
        {...props}
        ref={native}
        name={name}
        disabled={disabled}
        required={required}
        value={selectedValue}
        tabIndex={-1}
        aria-label={undefined}
        aria-labelledby={undefined}
        aria-hidden="true"
        className="sr-only pointer-events-none"
        onInvalid={(event) => {
          event.preventDefault()
          trigger.current?.focus()
          onInvalid?.(event)
        }}
        onChange={(event) => {
          setLocalValue(event.target.value)
          onChange?.(event)
        }}
      >
        {children}
      </select>
    </div>
  )
}
function NativeSelectOption(props: React.ComponentProps<'option'>) {
  return <option {...props} />
}
function NativeSelectOptGroup(props: React.ComponentProps<'optgroup'>) {
  return <optgroup {...props} />
}
export { NativeSelect, NativeSelectOption, NativeSelectOptGroup }

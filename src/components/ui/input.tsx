import * as React from 'react'
import { Eye, EyeOff, X } from 'lucide-react'
import { useUiTranslation } from '../../lib/use-ui-translation'
import { TimeInput } from './time-input'
import { DateInput } from './date-input'
import { cn } from '@/lib/utils'

/**
 * 文本输入：支持前置/后置插槽、一键清空与密码可见切换。
 * 日期与时间仍走 DateInput / TimeInput，装饰器由本组件统一包裹。
 */
function Input({
  className,
  type,
  start,
  end,
  clearable = false,
  onClear,
  ref,
  ...props
}: React.ComponentPropsWithRef<'input'> & {
  /** 前置插槽，例如图标或单位。 */
  start?: React.ReactNode
  /** 后置插槽，例如单位或操作按钮。 */
  end?: React.ReactNode
  /** 有值时显示清空按钮（配合受控用法）。 */
  clearable?: boolean
  onClear?: () => void
}) {
  const { t } = useUiTranslation()
  const [revealed, setRevealed] = React.useState(false)
  const password = type === 'password'
  const controlType = password && revealed ? 'text' : type
  const Control =
    controlType === 'date' || controlType === 'datetime-local'
      ? DateInput
      : controlType === 'time'
        ? TimeInput
        : 'input'
  const showClear = clearable && String(props.value ?? '').length > 0
  // 结构只由属性决定：否则清空按钮出现/消失会重挂载输入框，连续输入会丢焦点。
  if (!start && !end && !clearable && !password)
    return (
      <Control
        ref={ref}
        type={controlType}
        data-slot="input"
        className={cn(inputBaseClass, className)}
        {...props}
      />
    )
  return (
    <div
      data-slot="input-wrapper"
      className={cn(
        'group relative flex h-10 w-full items-center overflow-hidden rounded-lg border border-input bg-card transition-[border-color,box-shadow,background-color] dark:bg-input/30',
        'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20',
        'has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-2 has-[[aria-invalid=true]]:ring-destructive/20',
        'has-[:disabled]:pointer-events-none has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
      )}
    >
      {start && (
        // 插槽里的图标统一 16px：不写尺寸时 lucide 默认 24px，在 40px 控件里会显大
        <span className="flex shrink-0 items-center pl-3 text-muted-foreground [&_svg:not([class*='size-'])]:size-4">
          {start}
        </span>
      )}
      <Control
        ref={ref}
        type={controlType}
        data-slot="input"
        className={cn(innerInputClass, className)}
        {...props}
      />
      <span className="flex shrink-0 items-center gap-1 pr-2 text-muted-foreground [&_svg:not([class*='size-'])]:size-4">
        {end}
        {showClear && (
          <button
            type="button"
            aria-label={t('clear')}
            className="rounded p-0.5 hover:text-foreground"
            onClick={() => {
              onClear?.()
            }}
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        )}
        {password && (
          <button
            type="button"
            aria-label={t(revealed ? 'hidePassword' : 'showPassword')}
            className="rounded p-0.5 hover:text-foreground"
            onClick={() => setRevealed((value) => !value)}
          >
            {revealed ? (
              <EyeOff aria-hidden="true" className="size-3.5" />
            ) : (
              <Eye aria-hidden="true" className="size-3.5" />
            )}
          </button>
        )}
      </span>
    </div>
  )
}

/** 输入本体的基础样式；日期、时间等自定义输入复用同一套外观。 */
export const inputBaseClass =
  'h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3.5 py-2 text-base shadow-none transition-[border-color,box-shadow,background-color] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-accent file:rounded-md file:mr-3 file:px-3 file:text-sm file:font-medium file:text-accent-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40'

/**
 * 带装饰时的输入本体：边框、底色与焦点环全部交给外层容器，
 * 否则会出现内外两层边框（内层边框在容器的圆角里露出来）。
 */
const innerInputClass =
  'h-full w-full min-w-0 border-0 bg-transparent px-3.5 py-2 text-base shadow-none outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus:border-0 focus:ring-0 focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

export { Input }

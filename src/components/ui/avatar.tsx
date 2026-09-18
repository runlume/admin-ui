import { Avatar as AvatarPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

const sizes = {
  sm: 'size-7 text-xs',
  default: 'size-9 text-sm',
  lg: 'size-12 text-base',
} as const

/** 头像：图片加载失败时回落到首字母。 */
function Avatar({
  src,
  name,
  size = 'default',
  className,
}: {
  src?: string
  /** 用于生成首字母回退与访问名称。 */
  name: string
  size?: keyof typeof sizes
  className?: string
}) {
  const initial = name.trim().slice(0, 1).toUpperCase()
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-primary/12 font-medium text-primary',
        sizes[size],
        className,
      )}
    >
      {src && <AvatarPrimitive.Image src={src} alt={name} className="size-full object-cover" />}
      <AvatarPrimitive.Fallback
        delayMs={src ? 300 : 0}
        className="flex size-full items-center justify-center"
      >
        {initial}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}

export { Avatar }

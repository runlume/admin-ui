import { cn } from '@/lib/utils'

/**
 * 品牌标识。直接复用平台控制台 public/brand 下的资源，不另建图片；
 * 深浅模式各用一份，`compact` 用于侧栏收起态，只显示方标。
 */
export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return compact ? (
    <span className={cn('inline-flex size-9 shrink-0', className)}>
      <img src="/brand/mark.svg" alt="Runlume" className="block size-full dark:hidden" />
      <img src="/brand/mark-dark.svg" alt="Runlume" className="hidden size-full dark:block" />
    </span>
  ) : (
    <span className={cn('brand-wordmark relative inline-flex w-32 shrink-0', className)}>
      <img src="/brand/wordmark-light.svg" alt="Runlume" className="block w-full dark:hidden" />
      <img src="/brand/wordmark-dark.svg" alt="Runlume" className="hidden w-full dark:block" />
      <svg
        viewBox="0 0 249 54"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
      >
        <g className="brand-wordmark-dot" fill="#086c6a">
          {[0, 1, 2, 3].map((index) => (
            <g
              key={index}
              transform={`translate(${242.2 + (index % 2) * 3.1} ${42.9 + Math.floor(index / 2) * 3.1})`}
            >
              <path d="M0 0l.45 -.45h2.85l-.45 .45Z" fill="white" opacity=".45" />
              <path d="M2.85 0l.45 -.45v2.85l-.45 .45Z" fill="black" opacity=".25" />
              <rect width="2.85" height="2.85" />
            </g>
          ))}
        </g>
      </svg>
    </span>
  )
}

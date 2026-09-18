import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { pagerItems, parsePageInput } from '@/lib/pager'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from '@/lib/utils'

/**
 * 页码分页器。
 * 与 PageButton 的上下页按钮组合使用，放进 PaginationBar 的右侧。
 */
export function PagePager({
  page,
  pageCount,
  onPageChange,
  className,
}: {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  className?: string
}) {
  const { t } = useTranslation()
  const [jump, setJump] = useState('')
  const total = Math.max(1, pageCount)
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {pagerItems(page, total).map((item, index) =>
        item === null ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            variant={item === page ? 'default' : 'outline'}
            size="sm"
            aria-label={t('sample.pageSummary', { page: item, count: total })}
            aria-current={item === page ? 'page' : undefined}
            className="min-w-8 px-2 tabular-nums"
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ),
      )}
      {total > 7 && (
        <span className="ml-1 flex items-center gap-1 text-xs text-muted-foreground">
          {t('jumpTo')}
          <Input
            aria-label={t('jumpTo')}
            inputMode="numeric"
            className="h-8 w-14 px-2 text-center"
            value={jump}
            onChange={(event) => setJump(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              const next = parsePageInput(jump, total)
              if (next) onPageChange(next)
              setJump('')
            }}
          />
          {t('jumpPage')}
        </span>
      )}
    </div>
  )
}

import { PaginationBar } from './pagination-bar'
import { PageButton } from './page-button'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function CursorPagination({
  count,
  page,
  pending,
  hasNext,
  hasPrevious,
  first,
  previous,
  next,
}: {
  count: number
  page: number
  pending: boolean
  hasNext: boolean
  hasPrevious: boolean
  first: () => void
  previous: () => void
  next: () => void
}) {
  const { t } = useTranslation()
  return (
    <PaginationBar mode="cursor" summary={t('pagination.cursorSummary', { page, count })}>
      {page > 1 && (
        <Button variant="ghost" size="sm" disabled={pending} onClick={first}>
          {t('pagination.firstPage')}
        </Button>
      )}
      <PageButton direction="previous" disabled={!hasPrevious || pending} onClick={previous}>
        {t('previous')}
      </PageButton>
      <PageButton direction="next" disabled={!hasNext || pending} onClick={next}>
        {t('next')}
      </PageButton>
    </PaginationBar>
  )
}

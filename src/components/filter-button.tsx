import type { ComponentProps } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

type FilterButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'variant' | 'size' | 'asChild'
> & {
  action: 'search' | 'clear'
}

export function FilterButton({ action, type, ...props }: FilterButtonProps) {
  const { t } = useTranslation()
  const searching = action === 'search'
  const Icon = searching ? Search : X
  return (
    <Button
      {...props}
      type={type ?? (searching ? 'submit' : 'button')}
      variant={searching ? 'secondary' : 'outline'}
    >
      <Icon aria-hidden="true" />
      {t(searching ? 'search' : 'clearFilters')}
    </Button>
  )
}

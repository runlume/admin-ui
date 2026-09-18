import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/page'
/** Do not expose router exceptions, implementation details or stack traces to users. */
export function RouteError() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-2xl p-6">
      <ErrorState message={t('errorDefault')} retry={() => window.location.reload()} />
    </div>
  )
}

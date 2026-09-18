import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router'
import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'

export const PAGE_RELOAD_PATH = '/_page-reload'

export function PageReloadButton() {
  const { t } = useTranslation()
  const [animation, setAnimation] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState<{
    pathname: string
    progress: 'loading' | 'complete' | null
  }>({ pathname: location.pathname, progress: null })
  let progress = feedback.progress
  if (feedback.pathname !== location.pathname) {
    progress =
      location.pathname === PAGE_RELOAD_PATH
        ? 'loading'
        : feedback.pathname === PAGE_RELOAD_PATH
          ? 'complete'
          : null
    setFeedback({ pathname: location.pathname, progress })
  }
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('pageReload.title')}
        title={t('pageReload.hint')}
        disabled={location.pathname === PAGE_RELOAD_PATH}
        onClick={(event) => {
          if (event.altKey || event.shiftKey) return
          if (event.ctrlKey || event.metaKey) {
            window.location.reload()
            return
          }
          setAnimation((value) => value + 1)
          void navigate(PAGE_RELOAD_PATH, {
            replace: true,
            state: {
              returnTo: location.pathname + location.search + location.hash,
              previousState: location.state,
            },
          })
        }}
      >
        <RefreshCw
          key={animation}
          aria-hidden="true"
          className={animation ? 'size-4 motion-safe:animate-[spin_1s_ease-in-out_1]' : 'size-4'}
          onAnimationEnd={() => setAnimation(0)}
        />
      </Button>
      {progress &&
        createPortal(
          <div
            role="progressbar"
            aria-label={t('pageReload.title')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress === 'complete' ? 100 : undefined}
            className="pointer-events-none fixed inset-x-0 top-0 z-[3000] h-0.5 origin-left bg-primary"
            style={{
              animation:
                progress === 'complete'
                  ? 'page-reload-complete 600ms ease-out forwards'
                  : undefined,
              transform: progress === 'loading' ? 'scaleX(0.15)' : undefined,
            }}
            onAnimationEnd={() => setFeedback((value) => ({ ...value, progress: null }))}
          />,
          document.body,
        )}
    </>
  )
}

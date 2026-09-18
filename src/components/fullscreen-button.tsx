import { useEffect, useState } from 'react'
import { Maximize, Minimize } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function FullscreenButton() {
  const { t } = useTranslation()
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement)
  const [pending, setPending] = useState(false)
  useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])
  if (!document.fullscreenEnabled) return null
  const label = t(fullscreen ? 'exitFullscreen' : 'enterFullscreen')
  async function toggle() {
    setPending(true)
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      toast.error(t('fullscreenFailed'))
    } finally {
      setPending(false)
    }
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      aria-pressed={fullscreen}
      disabled={pending}
      onClick={() => void toggle()}
    >
      {fullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
    </Button>
  )
}

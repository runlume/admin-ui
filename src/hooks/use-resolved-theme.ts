import { useSyncExternalStore } from 'react'
import { resolveTheme, useAppearance } from '@/lib/appearance'
const subscribe = (notify: () => void) => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
export function useResolvedTheme() {
  const theme = useAppearance((state) => state.theme)
  const dark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => false,
  )
  return resolveTheme(theme, dark)
}

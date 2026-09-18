import { useEffect, type ReactNode } from 'react'
import { useAppearance } from '@/lib/appearance'
import { useResolvedTheme } from '@/hooks/use-resolved-theme'
export function ThemeProvider({ children }: { children: ReactNode }) {
  const palette = useAppearance((state) => state.palette)
  const customColors = useAppearance((state) => state.customColors)
  const resolved = useResolvedTheme()
  const accessibility = useAppearance((state) => state.accessibility)
  const radius = useAppearance((state) => state.radius)
  const transition = useAppearance((state) => state.transition)
  const tabbarStyle = useAppearance((state) => state.tabbarStyle)
  useEffect(() => {
    // 圆角基数写回 CSS 变量，按钮、卡片、输入等由 --radius 派生的圆角一起变化。
    document.documentElement.style.setProperty('--radius', `${radius}rem`)
    document.documentElement.dataset.transition = transition
    document.documentElement.dataset.tabbar = tabbarStyle
  }, [radius, transition, tabbarStyle])
  useEffect(() => {
    const root = document.documentElement
    root.dataset.fontScale = String(accessibility.fontScale)
    root.dataset.fontWeight = accessibility.fontWeight
    root.dataset.highContrast = String(accessibility.highContrast)
    root.dataset.reduceMotion = String(accessibility.reduceMotion)
    root.dataset.underlineLinks = String(accessibility.underlineLinks)
    root.dataset.grayscale = String(accessibility.grayscale)
    root.dataset.colorWeak = String(accessibility.colorWeak)
  }, [accessibility])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.documentElement.dataset.theme = resolved
    document.documentElement.dataset.palette = palette
    document.documentElement.dataset.baseColor = customColors[resolved].baseColor
    document.documentElement.dataset.themeColor = customColors[resolved].themeColor
    document.documentElement.style.colorScheme = resolved
  }, [resolved, palette, customColors])
  return children
}

export const fontScales = [100, 112.5, 125, 150] as const
export const fontWeights = ['default', 'medium', 'bold'] as const
export type AccessibilityPreferences = {
  fontScale: (typeof fontScales)[number]
  fontWeight: (typeof fontWeights)[number]
  highContrast: boolean
  reduceMotion: boolean
  underlineLinks: boolean
  /** 灰色模式：全部颜色转灰度，便于打印与聚焦层次。 */
  grayscale: boolean
  /** 色弱模式：提高饱和度与对比度，帮助区分状态色。 */
  colorWeak: boolean
}
export const defaultAccessibility: AccessibilityPreferences = {
  fontScale: 100,
  fontWeight: 'default',
  highContrast: false,
  reduceMotion: false,
  underlineLinks: false,
  grayscale: false,
  colorWeak: false,
}
export function resolveAccessibility(value: unknown): AccessibilityPreferences {
  const saved = (value ?? {}) as Partial<AccessibilityPreferences>
  return {
    fontScale: fontScales.includes(saved.fontScale!) ? saved.fontScale! : 100,
    fontWeight: fontWeights.includes(saved.fontWeight!) ? saved.fontWeight! : 'default',
    highContrast: saved.highContrast === true,
    reduceMotion: saved.reduceMotion === true,
    underlineLinks: saved.underlineLinks === true,
    grayscale: saved.grayscale === true,
    colorWeak: saved.colorWeak === true,
  }
}

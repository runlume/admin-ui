// Names and ordering follow the legacy frontend's packages/themes/index.ts.
export const baseColors = ['neutral', 'stone', 'zinc', 'mauve', 'olive', 'mist', 'taupe'] as const
export const themeColors = [
  'default',
  'amber',
  'blue',
  'cyan',
  'emerald',
  'fuchsia',
  'green',
  'indigo',
  'lime',
  'orange',
  'pink',
  'purple',
  'red',
  'rose',
  'sky',
  'teal',
  'violet',
  'yellow',
] as const
export type BaseColor = (typeof baseColors)[number]
export type ThemeColor = (typeof themeColors)[number]
export type ColorChoice = { baseColor: BaseColor; themeColor: ThemeColor }
export type CustomColors = Record<'light' | 'dark', ColorChoice>

export function resolveCustomColors(value: unknown): CustomColors {
  const saved = value as Partial<Record<'light' | 'dark', Partial<ColorChoice>>> | undefined
  const choice = (mode: 'light' | 'dark'): ColorChoice => ({
    baseColor: baseColors.includes(saved?.[mode]?.baseColor as BaseColor)
      ? saved![mode]!.baseColor!
      : 'neutral',
    themeColor: themeColors.includes(saved?.[mode]?.themeColor as ThemeColor)
      ? saved![mode]!.themeColor!
      : 'default',
  })
  return { light: choice('light'), dark: choice('dark') }
}

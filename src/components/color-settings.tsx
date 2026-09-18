import type { CSSProperties } from 'react'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { palettes, useAppearance } from '@/lib/appearance'
import { baseColors, themeColors } from '@/lib/color-options'
import { useResolvedTheme } from '@/hooks/use-resolved-theme'

const optionClass =
  'flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-ring/40'
const swatchStyle = (kind: string, value: string): CSSProperties => ({
  backgroundColor: `var(--${kind}-swatch-${value})`,
})

export function ColorSettings() {
  const { t } = useTranslation()
  const mode = useResolvedTheme()
  const {
    palette,
    setPalette,
    theme,
    setTheme,
    customColors,
    syncColors,
    setBaseColor,
    setThemeColor,
    setSyncColors,
  } = useAppearance()
  const choice = customColors[mode]
  return (
    <div className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="font-medium">{t('colorSettings.presets')}</legend>
        <div className="grid grid-cols-2 gap-2">
          {palettes.map((value) => (
            <label key={value} className={optionClass}>
              <span
                aria-hidden="true"
                data-palette-swatch={value}
                className="size-3 shrink-0 rounded-full"
              />
              <span className="flex-1">{t(`colorSettings.${value}`)}</span>
              <input
                type="radio"
                name="settings-palette"
                value={value}
                checked={palette === value}
                onChange={() => setPalette(value)}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-xs text-muted-foreground">{t('colorSettings.hint')}</p>
      <fieldset className="space-y-3">
        <legend className="font-medium">{t('colorSettings.base')}</legend>
        <div className="grid grid-flow-col auto-cols-fr gap-2 overflow-x-auto pb-1">
          {baseColors.map((value) => (
            <label
              key={value}
              className={`${optionClass} relative min-w-11 flex-col justify-center whitespace-nowrap px-1 text-xs`}
            >
              <input
                className="sr-only"
                type="radio"
                name="settings-base"
                value={value}
                checked={palette === 'custom' && choice.baseColor === value}
                onChange={() => setBaseColor(value, mode)}
              />
              <span
                aria-hidden="true"
                className="size-5 rounded-full"
                style={swatchStyle('base', value)}
              />
              <span>{t(`colorSettings.bases.${value}`)}</span>
              {palette === 'custom' && choice.baseColor === value && (
                <Check aria-hidden="true" className="absolute right-1 top-1 size-3" />
              )}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="font-medium">{t('colorSettings.accent')}</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {themeColors.map((value) => (
            <label
              key={value}
              className={`${optionClass} relative flex-col justify-center px-1 text-xs`}
            >
              <input
                className="sr-only"
                type="radio"
                name="settings-accent"
                value={value}
                checked={palette === 'custom' && choice.themeColor === value}
                onChange={() => setThemeColor(value, mode)}
              />
              <span
                aria-hidden="true"
                className="size-5 rounded-full"
                style={swatchStyle('theme', value)}
              />
              <span>{t(`colorSettings.accents.${value}`)}</span>
              {palette === 'custom' && choice.themeColor === value && (
                <Check aria-hidden="true" className="absolute right-1 top-1 size-3" />
              )}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="font-medium">{t('theme')}</legend>
        <div className="flex flex-wrap gap-2">
          {(['light', 'dark', 'system'] as const).map((value) => (
            <label key={value} className={`${optionClass} flex-1 justify-center whitespace-nowrap`}>
              <input
                type="radio"
                name="settings-theme"
                value={value}
                checked={theme === value}
                onChange={() => setTheme(value)}
              />
              <span>{t(value)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center justify-between gap-3">
        <span>{t('colorSettings.sync')}</span>
        <input
          className="size-4"
          type="checkbox"
          checked={syncColors}
          onChange={(event) => setSyncColors(event.target.checked, mode)}
        />
      </label>
    </div>
  )
}

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppearance } from '@/lib/appearance'
import { fontScales, fontWeights } from '@/lib/accessibility'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

export function AccessibilitySettings() {
  const { t } = useTranslation()
  const { accessibility, setAccessibility, resetAccessibility } = useAppearance()
  const id = useId()
  const firstSize = useRef<HTMLInputElement>(null)
  const [resetMessage, setResetMessage] = useState('')
  const [highlight, setHighlight] = useState(false)
  useEffect(() => {
    if (!highlight) return
    const timer = window.setTimeout(() => setHighlight(false), 1600)
    return () => window.clearTimeout(timer)
  }, [highlight])
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">{t('accessibility.hint')}</p>
      <fieldset
        id={`${id}-size`}
        className={cn('min-w-0 space-y-3 rounded-md', highlight && 'ring-2 ring-primary/50')}
      >
        <legend className="font-medium">{t('accessibility.fontScale')}</legend>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-2">
          {fontScales.map((fontScale, index) => (
            <label
              key={fontScale}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border p-3 has-checked:border-primary has-checked:bg-accent"
            >
              <input
                ref={index === 0 ? firstSize : undefined}
                type="radio"
                name={`${id}-font-scale`}
                checked={accessibility.fontScale === fontScale}
                onChange={() => setAccessibility({ fontScale })}
              />
              <span>
                {t(`accessibility.scales.${Math.floor(fontScale)}`)}{' '}
                <span className="font-normal">{fontScale}%</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="min-w-0 space-y-3">
        <legend className="font-medium">{t('accessibility.fontWeight')}</legend>
        <div className="flex flex-wrap gap-2">
          {fontWeights.map((fontWeight) => (
            <label
              key={fontWeight}
              className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-md border p-3 has-checked:border-primary has-checked:bg-accent"
            >
              <input
                type="radio"
                name={`${id}-font-weight`}
                checked={accessibility.fontWeight === fontWeight}
                onChange={() => setAccessibility({ fontWeight })}
              />
              <span>{t(`accessibility.weights.${fontWeight}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {(['highContrast', 'reduceMotion', 'underlineLinks', 'grayscale', 'colorWeak'] as const).map(
        (key) => (
          <div key={key} className="space-y-1">
            <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
              <span>{t(`accessibility.${key}`)}</span>
              <input
                type="checkbox"
                aria-describedby={`${id}-${key}-hint`}
                checked={accessibility[key]}
                onChange={(event) => setAccessibility({ [key]: event.target.checked })}
              />
            </label>
            <p id={`${id}-${key}-hint`} className="text-sm text-muted-foreground">
              {t(`accessibility.${key}Hint`)}
            </p>
          </div>
        ),
      )}
      <section
        aria-label={t('accessibility.preview')}
        className="space-y-2 rounded-md border bg-card p-4"
      >
        <h3 className="font-semibold">{t('accessibility.preview')}</h3>
        <p>{t('accessibility.previewText')}</p>
        <a
          className="inline-flex min-h-11 items-center font-medium text-primary hover:underline"
          href={`#${id}-size`}
          onClick={(event) => {
            // 跳转到字号设置：滚动到该分组、聚焦第一个选项并短暂高亮，避免"点了没反应"。
            event.preventDefault()
            const target = firstSize.current
            target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
            target?.focus({ preventScroll: true })
            setHighlight(true)
          }}
        >
          {t('accessibility.previewLink')}
        </a>
      </section>
      <Button
        variant="outline"
        className="h-auto min-h-11 whitespace-normal"
        onClick={() => {
          resetAccessibility()
          setResetMessage(t('accessibility.resetDone'))
        }}
      >
        {t('accessibility.reset')}
      </Button>
      <p role="status" className="sr-only">
        {resetMessage}
      </p>
    </div>
  )
}

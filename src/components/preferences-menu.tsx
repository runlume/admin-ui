import { Check, Languages, Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppearance, type Theme } from '@/lib/appearance'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
export function PreferencesMenu({ action }: { action?: 'language' | 'theme' }) {
  const { t, i18n } = useTranslation()
  const theme = useAppearance((state) => state.theme)
  const setTheme = useAppearance((state) => state.setTheme)
  return (
    <div className="flex items-center gap-1">
      {action !== 'theme' && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('language')}
          title={t('language')}
          onClick={() => void i18n.changeLanguage(i18n.language === 'en' ? 'zh-CN' : 'en')}
        >
          <Languages className="size-4" />
        </Button>
      )}
      {action !== 'language' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('theme')}>
              <Sun className="size-4 dark:hidden" />
              <Moon className="hidden size-4 dark:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(
              [
                { value: 'light', icon: Sun },
                { value: 'dark', icon: Moon },
                { value: 'system', icon: Monitor },
              ] as const
            ).map(({ value, icon: Icon }) => (
              <DropdownMenuItem key={value} onSelect={() => setTheme(value as Theme)}>
                <Icon className="size-4" />
                <span className="flex-1">{t(value)}</span>
                {theme === value && <Check className="size-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

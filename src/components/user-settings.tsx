import type { ReactNode } from 'react'
import { useRef } from 'react'
import { Accessibility, Bell, Info, Monitor, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppearance } from '@/lib/appearance'
import type { NavigationGroup } from '@/lib/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { HeaderActionSettings } from './header-action-settings'
import { UserProfile, type ProfileContact } from './user-profile'
import { cn } from '@/lib/utils'
import { ColorSettings } from './color-settings'
import { AccessibilitySettings } from './accessibility-settings'
import { NotificationSettings } from './notification-settings'
import { AboutPanel } from './about-panel'
import { Slider } from './ui/slider'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { transitionOptions } from '@/lib/appearance'
import { layoutModes } from '@/lib/appearance'
import {
  defaultShortcuts,
  shortcutConflict,
  writeShortcuts,
  type ShortcutSetting,
} from '@/lib/preset-shortcuts'

export type UserProfileFacts = {
  displayName?: string
  userId?: string
  contacts?: ProfileContact[]
  editHref?: string
  editLabel?: string
  onSignOut?: () => void
}

/**
 * 设置弹窗：个人信息 / 系统设置 / 界面设置 / 通知设置 / 无障碍设置。
 * 标题与左侧导航固定，只有右侧内容区滚动；`system` 页签留给业务系统接入自身设置。
 */
export function UserSettings({
  view,
  onClose,
  groups,
  profile,
  systemContent,
  shortcuts,
  onShortcutsChange,
}: {
  view: 'settings' | 'profile' | null
  onClose: () => void
  groups: NavigationGroup[]
  profile?: UserProfileFacts
  systemContent?: ReactNode
  /** 自定义快捷键（与默认组合合并），保存后立即生效。 */
  shortcuts?: ShortcutSetting[]
  onShortcutsChange?: (next: ShortcutSetting[]) => void
}) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)
  const {
    multipleGroups,
    defaultGroups,
    showTabs,
    tabsAboveBreadcrumb,
    sidebarWidth,
    radius,
    transition,
    tabbarStyle,
    layout,
  } = useAppearance()
  return (
    <Dialog
      open={view !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        ref={dialogRef}
        onOpenAutoFocus={(event) => {
          if (view === 'settings') {
            event.preventDefault()
            dialogRef.current?.focus({ preventScroll: true })
          }
        }}
        className={cn(
          'flex max-h-[85dvh] flex-col overflow-clip',
          view === 'profile' ? 'sm:max-w-xl' : 'h-[620px] sm:max-w-2xl',
        )}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {t(view === 'profile' ? 'userSettings.profile' : 'userSettings.title')}
          </DialogTitle>
          <DialogDescription>
            {t(view === 'profile' ? 'userSettings.profileHint' : 'userSettings.saved')}
          </DialogDescription>
        </DialogHeader>
        {view === 'profile' ? (
          <UserProfile {...profile} />
        ) : (
          <Tabs
            defaultValue="interface"
            orientation="vertical"
            className="flex min-h-0 w-full flex-1 flex-col gap-5 sm:flex-row"
          >
            <TabsList
              className="w-full shrink-0 flex-row! items-start justify-start gap-1 rounded-none bg-transparent p-0 sm:w-40 sm:flex-col! sm:self-stretch sm:border-r sm:pr-4"
              aria-label={t('userSettings.title')}
            >
              <TabsTrigger className="user-settings-tab" value="system">
                <Settings />
                {t('userSettings.system')}
              </TabsTrigger>
              <TabsTrigger className="user-settings-tab" value="interface">
                <Monitor />
                {t('userSettings.interface')}
              </TabsTrigger>
              <TabsTrigger className="user-settings-tab" value="accessibility">
                <Accessibility />
                {t('accessibility.title')}
              </TabsTrigger>
              <TabsTrigger className="user-settings-tab" value="notifications">
                <Bell />
                {t('notifications.settings')}
              </TabsTrigger>
              <TabsTrigger className="user-settings-tab" value="about">
                <Info />
                {t('userSettings.about')}
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="system"
              className="flex min-h-0 items-center justify-center overflow-y-auto text-center text-sm text-muted-foreground"
            >
              {systemContent ?? t('userSettings.systemPending')}
            </TabsContent>
            <TabsContent
              value="accessibility"
              className="min-h-0 min-w-0 overflow-y-auto overscroll-contain pr-2 text-sm"
            >
              <AccessibilitySettings />
            </TabsContent>
            <TabsContent
              value="notifications"
              className="min-h-0 min-w-0 overflow-y-auto overscroll-contain pr-2 text-sm"
            >
              <NotificationSettings />
            </TabsContent>
            <TabsContent
              value="about"
              className="min-h-0 min-w-0 overflow-y-auto overscroll-contain pr-2 text-sm"
            >
              <AboutPanel />
            </TabsContent>
            <TabsContent
              value="interface"
              className="min-h-0 min-w-0 space-y-6 overflow-y-auto overscroll-contain pr-2 text-sm"
            >
              <label className="flex items-center justify-between gap-3">
                <span>{t('userSettings.multiple')}</span>
                <input
                  className="size-4 accent-primary"
                  type="checkbox"
                  checked={multipleGroups}
                  onChange={(event) =>
                    useAppearance.setState({
                      multipleGroups: event.target.checked,
                      defaultGroups: event.target.checked
                        ? defaultGroups
                        : defaultGroups.slice(0, 1),
                    })
                  }
                />
              </label>
              <fieldset className="space-y-3">
                <legend className="mb-3 font-medium">{t('userSettings.defaults')}</legend>
                {groups.map((group) => (
                  <label key={group.id} className="flex items-center justify-between gap-3">
                    <span>{t(group.label)}</span>
                    <input
                      className="size-4 accent-primary"
                      type="checkbox"
                      checked={defaultGroups.includes(group.id)}
                      onChange={(event) =>
                        useAppearance.setState({
                          defaultGroups: event.target.checked
                            ? multipleGroups
                              ? [...defaultGroups, group.id]
                              : [group.id]
                            : defaultGroups.filter((id) => id !== group.id),
                        })
                      }
                    />
                  </label>
                ))}
              </fieldset>
              <ColorSettings />
              <label className="flex items-center justify-between gap-3">
                <span>{t('userSettings.swapTabs')}</span>
                <input
                  className="size-4 accent-primary"
                  type="checkbox"
                  checked={tabsAboveBreadcrumb}
                  onChange={(event) =>
                    useAppearance.setState({ tabsAboveBreadcrumb: event.target.checked })
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>{t('userSettings.tabs')}</span>
                <input
                  className="size-4 accent-primary"
                  type="checkbox"
                  checked={showTabs}
                  onChange={(event) => useAppearance.setState({ showTabs: event.target.checked })}
                />
              </label>
              <HeaderActionSettings />
              <div className="space-y-3">
                <fieldset className="space-y-2">
                  <legend className="font-medium">
                    {t('userSettings.sidebarWidth')} · {sidebarWidth}px
                  </legend>
                  <Slider
                    label={t('userSettings.sidebarWidth')}
                    value={[sidebarWidth]}
                    min={200}
                    max={360}
                    step={4}
                    onValueChange={([value]) =>
                      value !== undefined && useAppearance.getState().setSidebarWidth(value)
                    }
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="font-medium">
                    {t('userSettings.radius')} · {radius}rem
                  </legend>
                  <Slider
                    label={t('userSettings.radius')}
                    value={[radius]}
                    min={0}
                    max={1.5}
                    step={0.25}
                    onValueChange={([value]) =>
                      value !== undefined && useAppearance.getState().setRadius(value)
                    }
                  />
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="font-medium">{t('transition')}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {transitionOptions.map((value) => (
                      <label
                        key={value}
                        className="flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 has-checked:border-primary has-checked:bg-primary/5"
                      >
                        <input
                          type="radio"
                          name="settings-transition"
                          checked={transition === value}
                          onChange={() => useAppearance.getState().setTransition(value)}
                        />
                        <span>{t(`userSettings.transitionOptions.${value}`)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="font-medium">{t('userSettings.layoutMode')}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {layoutModes.map((value) => (
                      <label
                        key={value}
                        className="flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 has-checked:border-primary has-checked:bg-primary/5"
                      >
                        <input
                          type="radio"
                          name="settings-layout"
                          checked={layout === value}
                          onChange={() => useAppearance.getState().setLayout(value)}
                        />
                        <span>{t(`userSettings.layoutOptions.${value}`)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="font-medium">{t('userSettings.tabbarStyle')}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(['card', 'line'] as const).map((value) => (
                      <label
                        key={value}
                        className="flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 has-checked:border-primary has-checked:bg-primary/5"
                      >
                        <input
                          type="radio"
                          name="settings-tabbar"
                          checked={tabbarStyle === value}
                          onChange={() => useAppearance.getState().setTabbarStyle(value)}
                        />
                        <span>{t(`tabsStyle.${value}`)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {onShortcutsChange && (
                  <fieldset className="space-y-2">
                    <legend className="font-medium">{t('shortcuts.title')}</legend>
                    <p className="text-xs text-muted-foreground">{t('shortcuts.hint')}</p>
                    <div className="space-y-2">
                      {defaultShortcuts.map((item) => {
                        const custom = shortcuts?.find((entry) => entry.path === item.path)
                        const value = custom?.combo ?? item.combo
                        const conflict = shortcutConflict(value, item.path, shortcuts ?? [])
                        return (
                          <label
                            key={item.path}
                            className="flex items-center justify-between gap-3"
                          >
                            <span>{t(item.label)}</span>
                            <span className="flex items-center gap-2">
                              {conflict && (
                                <span className="text-xs text-warning">
                                  {t('shortcuts.conflict')}
                                </span>
                              )}
                              <Input
                                className="h-8 w-28 text-center font-mono text-xs"
                                aria-label={`${t('shortcuts.title')} ${t(item.label)}`}
                                value={value}
                                readOnly
                                onKeyDown={(event) => {
                                  // 按下即录制：单字符记录为序列键，带修饰键记录为组合键。
                                  event.preventDefault()
                                  const key = event.key.toLowerCase()
                                  if (['shift', 'control', 'meta', 'alt'].includes(key)) return
                                  const combo =
                                    event.metaKey || event.ctrlKey
                                      ? `mod+${key}`
                                      : event.shiftKey
                                        ? `shift+${key}`
                                        : key.length === 1
                                          ? key
                                          : key
                                  const next = (shortcuts ?? []).filter(
                                    (entry) => entry.path !== item.path,
                                  )
                                  next.push({ path: item.path, combo })
                                  onShortcutsChange(next)
                                  writeShortcuts(next)
                                }}
                              />
                            </span>
                          </label>
                        )
                      })}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onShortcutsChange([])
                        writeShortcuts([])
                      }}
                    >
                      {t('shortcuts.reset')}
                    </Button>
                  </fieldset>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

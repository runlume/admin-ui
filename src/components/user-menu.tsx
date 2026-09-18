import type { ComponentType } from 'react'
import { ArrowUpRight, ChevronDown, LogOut, Settings, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

/**
 * 侧栏底部用户菜单。退出登录等动作由业务系统传入回调；
 * 组件不直接调用身份中心，避免把认证方式写进设计层。
 */
export function UserMenu({
  displayName,
  description,
  onOpenProfile,
  onOpenSettings,
  onSignOut,
  links = [],
}: {
  displayName: string
  description?: string
  onOpenProfile: () => void
  onOpenSettings: () => void
  onSignOut?: () => void
  /** 额外外链（官网、仓库…）：系统级入口统一收在菜单里，不占侧栏位置 */
  links?: { href: string; label: string; icon?: ComponentType<{ className?: string }> }[]
}) {
  const { t } = useTranslation()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start gap-3 rounded-lg bg-muted px-3 py-2 text-left"
        >
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary"
          >
            <UserRound className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="user-menu-text block truncate text-sm font-medium">{displayName}</span>
            {description && (
              <span className="user-menu-text block truncate text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </span>
          <ChevronDown
            className="user-menu-caret size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onOpenProfile}>
          <UserRound className="size-4" />
          {t('userSettings.profile')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onOpenSettings}>
          <Settings className="size-4" />
          {t('userSettings.title')}
        </DropdownMenuItem>
        {links.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {links.map((link) => {
              const Icon = link.icon ?? ArrowUpRight
              return (
                <DropdownMenuItem key={link.href} asChild>
                  <a href={link.href} target="_blank" rel="noreferrer">
                    <Icon className="size-4" />
                    {t(link.label)}
                  </a>
                </DropdownMenuItem>
              )
            })}
          </>
        )}
        {onSignOut && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSignOut}>
              <LogOut className="size-4" />
              {t('userSettings.signOut')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

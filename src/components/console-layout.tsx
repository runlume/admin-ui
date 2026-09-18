import { Button } from '@/components/ui/button'
import { Minimize2, type LucideIcon } from 'lucide-react'
/* oxlint-disable react/preserve-manual-memoization -- 分组与激活分组都来自 useMemo/props，memo 依赖不会被改写；编译器只是无法证明这一点 */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { FavoritesMenu } from '@/components/favorites-menu'
import { PageTabs } from '@/components/page-tabs'
import { NavigationGroup } from '@/components/navigation-group'
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import {
  ArrowUpRight,
  House,
  ListIndentDecrease,
  ListIndentIncrease,
  Pin,
  PinOff,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Brand } from '@/components/brand'
import { MenuSearch } from '@/components/menu-search'
import { FullscreenButton } from '@/components/fullscreen-button'
import { GithubLink } from '@/components/github-link'
import { PreferencesMenu } from '@/components/preferences-menu'
import { brandInfo } from '@/lib/brand-info'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useAppearance, type HeaderActionId } from '@/lib/appearance'
import {
  flattenNavigation,
  groupNavigation,
  isLeavingApp,
  resolveActiveItem,
  singleGroup,
  type NavigationGroupDefinition,
  type NavigationItem,
} from '@/lib/navigation'
import { cn } from '@/lib/utils'

export type ConsoleLayoutProps = {
  /** 全部菜单项，平铺传入；分组由 groups 决定。 */
  navigation: NavigationItem[]
  /** 菜单分组定义。不传时所有菜单落在一个分组里。 */
  groups?: NavigationGroupDefinition[]
  /** 浏览器标题后缀，同时用于移动端侧栏描述。 */
  title?: string
  brand?: ReactNode
  brandHref?: string
  /** 侧栏底部的外链，例如官网、仓库或帮助文档；默认用外链图标，可逐项指定图标。 */
  footerLinks?: { href: string; label: string; icon?: LucideIcon }[]
  /** 传入后启用收藏夹，并作为收藏数据的隔离键（通常用当前用户 ID）。 */
  favoritesKey?: string
  /** 侧栏品牌下方的账户/租户切换等控件。 */
  accountControl?: ReactNode
  /** 侧栏底部用户菜单；不传时显示 footerLink。 */
  userControl?: ReactNode
  /** 覆盖或补充顶栏快捷操作；未提供的 id 使用内置实现。 */
  headerActions?: Partial<Record<HeaderActionId, ReactNode>>
  /** 动态路由的面包屑标题，取最长匹配的父路径。 */
  pageTitles?: Record<string, string>
  /** 既不在菜单也不在 pageTitles 中时的标题兜底。 */
  fallbackTitle?: string
}

/**
 * 控制台外壳：侧栏 + 顶栏 + 页面标签栏 + 面包屑 + 内容区。
 * 页面只负责渲染业务内容，布局、主题、偏好与无障碍设置都在这里统一处理。
 */
export function ConsoleLayout(props: ConsoleLayoutProps) {
  const collapsed = useAppearance((state) => state.collapsed)
  const sidebarWidth = useAppearance((state) => state.sidebarWidth)
  return (
    <SidebarProvider
      open={!collapsed}
      onOpenChange={(open) => useAppearance.setState({ collapsed: !open })}
      style={
        {
          '--sidebar-width': `${sidebarWidth}px`,
          '--sidebar-width-icon': '76px',
        } as CSSProperties
      }
    >
      <ConsoleContent {...props} />
    </SidebarProvider>
  )
}

function resolvePageTitle(
  pathname: string,
  pageTitles: Record<string, string> | undefined,
  fallback?: string,
) {
  const parent = Object.keys(pageTitles ?? {})
    .filter((path) => pathname !== path && pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0]
  return (parent && pageTitles?.[parent]) ?? fallback
}

function ConsoleContent({
  navigation,
  groups: groupDefinitions,
  title = 'Runlume',
  brand,
  brandHref = '/',
  footerLinks,
  favoritesKey,
  accountControl,
  userControl,
  headerActions,
  pageTitles,
  fallbackTitle,
}: ConsoleLayoutProps) {
  const { t } = useTranslation()
  const [maximized, setMaximized] = useState(false)
  const { pathname, key: locationKey } = useLocation()
  const { state, isMobile, openMobile, setOpenMobile, setOpen, toggleSidebar } = useSidebar()
  const sidebarPinned = useAppearance((state) => state.sidebarPinned)
  const compact = !isMobile && state === 'collapsed'
  const layout = useAppearance((state) => state.layout)
  const trigger = useRef<HTMLButtonElement>(null)
  const definitions = useMemo(
    () => (groupDefinitions?.length ? groupDefinitions : singleGroup(t('overview'), House)),
    [groupDefinitions, t],
  )
  const { current, parents, activePath } = resolveActiveItem(navigation, pathname)
  const groups = useMemo(() => groupNavigation(navigation, definitions), [navigation, definitions])
  // 层级菜单：命中子项时该分组同样算激活（分组自带全量路径，无需再走菜单树）
  const activeGroup = groups.find((group) => group.paths.includes(activePath ?? ''))?.id
  const multipleGroups = useAppearance((state) => state.multipleGroups)
  const savedDefaultGroups = useAppearance((state) => state.defaultGroups)
  // 保存的分组偏好可能来自另一套菜单（业务系统换了分组 id），这里过滤后回落到第一个分组。
  const defaultGroups = useMemo(() => {
    const known = savedDefaultGroups.filter((id) =>
      definitions.some((definition) => definition.id === id),
    )
    return known.length ? known : definitions.slice(0, 1).map((definition) => definition.id)
  }, [savedDefaultGroups, definitions])
  const tabsAboveBreadcrumb = useAppearance((state) => state.tabsAboveBreadcrumb)
  const showTabs = useAppearance((state) => state.showTabs)
  const configuredActions = useAppearance((state) => state.headerActions)
  const actions: Partial<Record<HeaderActionId, ReactNode>> = {
    search: <MenuSearch groups={groups} />,
    fullscreen: isMobile ? null : <FullscreenButton />,
    language: <PreferencesMenu action="language" />,
    theme: <PreferencesMenu action="theme" />,
    // 仓库入口默认排最后；顺序与显隐在「设置 → 外观 → 顶栏快捷操作」里调
    github: <GithubLink href={brandInfo.repository} label={t('headerActions.github')} />,
    ...headerActions,
  }
  const currentLabel =
    current?.label ?? resolvePageTitle(pathname, pageTitles, fallbackTitle) ?? t('overview')
  /** 顶部导航下侧栏展示哪个分组：由顶栏点击决定，未点击时跟随当前路由。 */
  const [topGroup, setTopGroup] = useState<string | undefined>()
  const topMode = layout === 'top' || layout === 'top-side'
  const currentGroup = layout === 'top-side' ? (topGroup ?? activeGroup) : activeGroup
  const sidebarGroups = useMemo(
    // 只有顶部（混合）导航才把侧栏收窄到当前分组；侧边导航始终展示全部分组。
    () =>
      layout === 'top-side' && currentGroup
        ? groups.filter((group) => group.id === currentGroup)
        : groups,
    [layout, currentGroup, groups],
  )
  /** 面包屑：侧边模式放在顶栏左侧，顶部导航模式单独占一行。 */
  const breadcrumb = (
    <Breadcrumb aria-label={t('console')} className="min-w-0">
      <BreadcrumbList className="flex-nowrap text-xs">
        {pathname !== '/' && (
          <>
            <BreadcrumbItem className="hidden sm:inline-flex">
              <BreadcrumbLink asChild>
                <Link to="/" className="inline-flex items-center gap-1.5">
                  <House aria-hidden="true" className="size-3.5" />
                  {t('overview')}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:block" />
          </>
        )}
        {parents.map((parent) => (
          <Fragment key={parent.path}>
            <BreadcrumbItem className="hidden md:inline-flex">
              <BreadcrumbLink asChild>
                <Link to={parent.path}>{t(parent.label)}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </Fragment>
        ))}
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="truncate text-sm font-medium">
            {t(currentLabel)}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
  // 顶部+侧边模式下，点击顶栏一级项就展开对应分组，即使当前路由不属于该组。
  const effectiveGroup = layout === 'top-side' ? currentGroup : activeGroup
  const navigationKey = `${locationKey}:${effectiveGroup ?? ''}`
  const [selection, setSelection] = useState({
    defaults: defaultGroups,
    multiple: multipleGroups,
    navigationKey: '',
    ids: defaultGroups,
  })
  let expandedGroups = selection.ids
  if (
    selection.defaults !== defaultGroups ||
    selection.multiple !== multipleGroups ||
    selection.navigationKey !== navigationKey
  ) {
    const ids =
      selection.defaults === defaultGroups && selection.multiple === multipleGroups
        ? selection.ids
        : defaultGroups
    expandedGroups = effectiveGroup
      ? multipleGroups
        ? [...new Set([...ids, effectiveGroup])]
        : [effectiveGroup]
      : multipleGroups
        ? ids
        : ids.slice(0, 1)
    setSelection({
      defaults: defaultGroups,
      multiple: multipleGroups,
      navigationKey,
      ids: expandedGroups,
    })
  }
  function toggleGroup(id: string) {
    const current = multipleGroups ? expandedGroups : expandedGroups.slice(0, 1)
    const ids =
      compact || !current.includes(id)
        ? multipleGroups
          ? [...new Set([...current, id])]
          : [id]
        : current.filter((value) => value !== id)
    setSelection({ defaults: defaultGroups, multiple: multipleGroups, navigationKey, ids })
  }
  useEffect(() => {
    document.title = `${t(currentLabel)} · ${title}`
    setOpenMobile(false)
  }, [pathname, t, currentLabel, title, setOpenMobile])

  return (
    <>
      {/*
        跳转链接的可视样式必须都挂在 focus: 下：Tailwind 把 .fixed / .px-4 排在 .sr-only 之后，
        不带前缀就会盖掉 sr-only 的裁剪，未聚焦时也会在左上角留出一条色块。
      */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t('skip')}
      </a>
      <div
        hidden={maximized}
        onMouseEnter={() => {
          if (!isMobile && !sidebarPinned) setOpen(true)
        }}
        onMouseLeave={() => {
          if (!isMobile && !sidebarPinned) setOpen(false)
        }}
        onFocusCapture={() => {
          if (!isMobile && !sidebarPinned) setOpen(true)
        }}
      >
        {/* 纯顶部不渲染侧栏；顶部+侧边与侧边模式都保留侧栏。 */}
        {(layout !== 'top' || isMobile) && (
          <Sidebar
            role={isMobile ? undefined : 'complementary'}
            aria-label={t('navigation')}
            collapsible="icon"
            mobileTitle={t('navigation')}
            mobileDescription={title}
            onMobileCloseAutoFocus={(event) => {
              event.preventDefault()
              trigger.current?.focus()
            }}
          >
            <SidebarHeader className={cn('gap-0 p-0 pb-3', compact && 'items-center')}>
              <div
                className={cn('flex h-[76px] items-center px-6', compact && 'justify-center px-2')}
              >
                <NavLink to={brandHref} aria-label={title} onClick={() => setOpenMobile(false)}>
                  {brand ?? <Brand compact={compact} />}
                </NavLink>
              </div>
              {accountControl && (
                <div className={cn('w-full px-4 pb-2', compact && 'px-2')}>{accountControl}</div>
              )}
            </SidebarHeader>
            <SidebarContent className="scrollbar-thin group-data-[collapsible=icon]:overflow-y-auto">
              <SidebarGroup className="px-3 pt-0">
                {!compact && (
                  <SidebarGroupLabel className="mb-2 px-3 text-[11px] tracking-wider text-muted-foreground">
                    {t('navigation')}
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <nav aria-label={t('navigation')}>
                    <SidebarMenu className={cn(compact && 'items-center')}>
                      {sidebarGroups.map((group) => (
                        <NavigationGroup
                          key={group.id}
                          group={group}
                          activePath={activePath}
                          compact={compact}
                          expanded={(multipleGroups
                            ? expandedGroups
                            : expandedGroups.slice(0, 1)
                          ).includes(group.id)}
                          onToggle={() => toggleGroup(group.id)}
                        />
                      ))}
                    </SidebarMenu>
                  </nav>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="gap-3 p-4 pt-3">
              {!isMobile && (
                <div
                  className={cn('flex justify-between', compact && 'flex-col items-center gap-2')}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg bg-muted text-sidebar-foreground hover:bg-sidebar-accent [&_svg]:size-5"
                    aria-label={t(sidebarPinned ? 'unpinSidebar' : 'pinSidebar')}
                    title={t(sidebarPinned ? 'unpinSidebar' : 'pinSidebar')}
                    aria-pressed={sidebarPinned}
                    onClick={() => useAppearance.setState({ sidebarPinned: !sidebarPinned })}
                  >
                    {sidebarPinned ? <Pin /> : <PinOff />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg bg-muted text-sidebar-foreground hover:bg-sidebar-accent [&_svg]:size-5"
                    aria-label={t(compact ? 'expand' : 'collapse')}
                    title={t(compact ? 'expand' : 'collapse')}
                    aria-expanded={!compact}
                    onClick={toggleSidebar}
                  >
                    {compact ? <ListIndentIncrease /> : <ListIndentDecrease />}
                  </Button>
                </div>
              )}
              {/* 侧栏底部：外链在上、用户菜单在下；顶部导航模式下用户信息在顶栏，不重复。 */}
              {(!topMode || isMobile) && footerLinks?.length ? (
                <SidebarMenu>
                  {footerLinks.map((link) => {
                    const Icon = link.icon ?? ArrowUpRight
                    return (
                      <SidebarMenuItem
                        key={link.href}
                        className={cn(compact && 'flex justify-center')}
                      >
                        <SidebarMenuButton
                          asChild
                          tooltip={t(link.label)}
                          className="h-10 text-xs text-muted-foreground"
                        >
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={t(link.label)}
                          >
                            <Icon className="size-4" />
                            {!compact && <span>{t(link.label)}</span>}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              ) : null}
              {topMode && !isMobile ? null : userControl}
            </SidebarFooter>
          </Sidebar>
        )}
      </div>
      <div className="min-w-0 flex-1 bg-background">
        <div className="sticky top-0 z-20 flex flex-col bg-background">
          <header
            style={{
              display: maximized ? 'none' : undefined,
              marginTop: !tabsAboveBreadcrumb && showTabs ? 8 : undefined,
              borderTopWidth: !tabsAboveBreadcrumb && showTabs ? 1 : undefined,
            }}
            className={cn(
              'flex items-center justify-between gap-3 border-b bg-background pl-2 pr-4 sm:pr-8',
              topMode && !isMobile ? 'h-16 pl-4' : 'h-[52px]',
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              {topMode && !isMobile && (
                <nav aria-label={t('primaryNavigation')} className="flex items-center gap-2">
                  {/* 纯顶部没有侧栏，品牌补在顶栏最左侧；顶部+侧边时品牌仍在侧栏。 */}
                  {layout === 'top' && (
                    <Link to={brandHref} className="mr-2 inline-flex shrink-0">
                      {brand ?? <Brand />}
                    </Link>
                  )}
                  {/* 纯顶部：一级项展开该分组的菜单；顶部+侧边：点击切换左侧菜单。 */}
                  {/* 点一级分组直接切换左侧菜单，不再弹出下拉。 */}
                  {groups.map((group) =>
                    layout === 'top' ? (
                      <DropdownMenu key={group.id}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 gap-2 rounded-lg px-3 data-[state=open]:bg-accent"
                          >
                            <group.icon aria-hidden="true" className="size-4" />
                            {t(group.label)}
                            <ChevronDown aria-hidden="true" className="size-3.5 opacity-60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-52">
                          {/* 顶部下拉里用缩进表达层级：菜单层级不变，展开成一张平铺列表更好点。 */}
                          {flattenNavigation(group.items).map(({ item, depth }) => (
                            <DropdownMenuItem key={item.path} asChild>
                              {isLeavingApp(item) ? (
                                <a
                                  href={item.external?.url}
                                  target={item.external?.target === 'self' ? '_self' : '_blank'}
                                  rel="noreferrer"
                                  className="gap-2"
                                  style={depth ? { paddingLeft: `${8 + depth * 16}px` } : undefined}
                                >
                                  <item.icon aria-hidden="true" className="size-4" />
                                  {t(item.label)}
                                  <ArrowUpRight aria-hidden="true" className="ml-auto size-3.5" />
                                </a>
                              ) : (
                                <Link
                                  to={item.path}
                                  className="gap-2"
                                  style={depth ? { paddingLeft: `${8 + depth * 16}px` } : undefined}
                                >
                                  <item.icon aria-hidden="true" className="size-4" />
                                  {t(item.label)}
                                  {item.external && (
                                    <ArrowUpRight aria-hidden="true" className="ml-auto size-3.5" />
                                  )}
                                </Link>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button
                        key={group.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-current={topGroup === group.id ? 'true' : undefined}
                        className={cn(
                          'h-9 gap-2 rounded-lg px-3',
                          topGroup === group.id &&
                            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                        )}
                        onClick={() => setTopGroup(group.id)}
                      >
                        <group.icon aria-hidden="true" className="size-4" />
                        {t(group.label)}
                      </Button>
                    ),
                  )}
                </nav>
              )}
              {isMobile && (
                <SidebarTrigger
                  ref={trigger}
                  className="size-9 shrink-0"
                  aria-label={t(isMobile ? 'menu' : compact ? 'expand' : 'collapse')}
                  aria-expanded={isMobile ? openMobile : !compact}
                />
              )}
              {favoritesKey && (
                <span className={cn(topMode && !isMobile && 'hidden')}>
                  <FavoritesMenu key={favoritesKey} userId={favoritesKey} navigation={navigation} />
                </span>
              )}
              {!topMode && breadcrumb}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {topMode && !isMobile && userControl && (
                <div className="[&_.user-menu-caret]:hidden [&_.user-menu-text]:sr-only [&_button]:gap-1 [&_button]:bg-transparent [&_button]:px-1">
                  {userControl}
                </div>
              )}
              {configuredActions
                .filter((action) => action.visible && !(topMode && !isMobile))
                .map((action) => (
                  <Fragment key={action.id}>{actions[action.id]}</Fragment>
                ))}
            </div>
          </header>
          {topMode && !isMobile && !maximized && (
            <div
              data-row="secondary"
              // 顶部两种模式下这一行承载快捷操作：留出上边距，通知角标（向上溢出 4px）不再贴住行顶
              className="flex h-12 items-center justify-between gap-3 border-b bg-background px-4 pt-1"
            >
              <div className="flex min-w-0 items-center gap-3">
                {favoritesKey && (
                  <FavoritesMenu key={favoritesKey} userId={favoritesKey} navigation={navigation} />
                )}
                {breadcrumb}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {configuredActions
                  .filter((action) => action.visible)
                  .map((action) => (
                    <Fragment key={action.id}>{actions[action.id]}</Fragment>
                  ))}
              </div>
            </div>
          )}
          {showTabs && !maximized && (
            <div style={{ order: tabsAboveBreadcrumb ? 1 : -1 }}>
              <PageTabs
                onMaximize={() => setMaximized(true)}
                navigation={navigation}
                label={currentLabel}
                owner={activePath}
              />
            </div>
          )}
        </div>
        {maximized && (
          <Button
            className="fixed right-4 top-4 z-30"
            variant="outline"
            onClick={() => {
              setMaximized(false)
              requestAnimationFrame(() =>
                document.querySelector<HTMLAnchorElement>('[aria-current=page][title]')?.focus(),
              )
            }}
          >
            <Minimize2 />
            {t('restorePage')}
          </Button>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className="page-transition mx-auto max-w-[1560px] px-4 py-7 focus:outline-none sm:px-8 sm:py-9"
        >
          {/* 按路径重建内容容器，配合 data-transition 播放切换动画。 */}
          <div key={pathname} className="page-transition-content">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  )
}

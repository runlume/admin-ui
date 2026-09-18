import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Menu, Maximize2, ArrowLeftToLine, ArrowRightToLine, FileText, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { flattenNavigation, type NavigationItem } from '@/lib/navigation'
import { Button } from './ui/button'
import { ContextMenu, DropdownMenu } from 'radix-ui'
import { PAGE_RELOAD_PATH } from './page-reload-button'
import { cn } from '@/lib/utils'
import { Tooltip as HoverCard } from 'radix-ui'

type PageTab = {
  path: string
  href: string
  label: string
  owner: string
  state: Record<string, unknown>
}
const closeKey = '__runlumePageTabClose'

export function PageTabs({
  navigation,
  label,
  owner,
  onMaximize,
}: {
  navigation: NavigationItem[]
  label: string
  onMaximize?: () => void
  owner?: string
}) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const active = useRef<HTMLAnchorElement>(null)
  const [snapshot, setSnapshot] = useState<{
    tabs: PageTab[]
    locationKey: string
    permissions: string
    pending?: { token: string; path: string }
  }>({ tabs: [], locationKey: '', permissions: '' })
  /** 层级菜单要展开成平铺列表，页签才能找到自己的标题与图标。 */
  const flat = flattenNavigation(navigation).map((entry) => entry.item)
  const permissions = flat.map((item) => item.path).join('|')
  let tabs = snapshot.tabs
  if (snapshot.locationKey !== location.key || snapshot.permissions !== permissions) {
    tabs = tabs.filter((tab) => flat.some((item) => item.path === tab.owner))
    const routeState =
      location.state && typeof location.state === 'object' ? { ...location.state } : {}
    if (snapshot.pending && routeState[closeKey] === snapshot.pending.token) {
      tabs = tabs.filter((tab) => tab.path !== snapshot.pending?.path)
    }
    delete routeState[closeKey]
    if (owner && location.pathname !== PAGE_RELOAD_PATH) {
      const next = {
        path: location.pathname,
        href: location.pathname + location.search + location.hash,
        label,
        owner,
        state: routeState,
      }
      const index = tabs.findIndex((tab) => tab.path === next.path)
      tabs = index < 0 ? [...tabs, next] : tabs.map((tab, i) => (i === index ? next : tab))
    }
    setSnapshot({ tabs, locationKey: location.key, permissions })
  }
  const strip = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const node = strip.current
    if (!node) return
    const fit = () => {
      const columns = Math.max(6, Math.min(12, tabs.length))
      const tabWidth = Math.max(72, (node.clientWidth - 24 - (columns - 1) * 4) / columns)
      node.style.setProperty('--page-tab-width', `${tabWidth}px`)
      const step = tabWidth + 4
      const overflow = 12 + tabs.length * step - 4 - node.clientWidth
      const padding = (step - (overflow % step)) % step
      node.style.paddingRight = `${overflow > 0 ? (padding < 12 ? padding + step : padding) : 12}px`
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(node)
    return () => observer.disconnect()
  }, [tabs.length])
  useEffect(() => {
    const node = strip.current
    const tab = active.current?.parentElement
    if (!node || !tab) return
    const bounds = node.getBoundingClientRect()
    const item = tab.getBoundingClientRect()
    const step = tab.offsetWidth + 4
    if (item.left < bounds.left + 12) node.scrollLeft += item.left - bounds.left - 12
    else if (item.right > bounds.right) {
      const target = node.scrollLeft + item.right - bounds.right
      node.scrollLeft = Math.ceil(target / step) * step
    }
  }, [location.pathname])
  const index = tabs.findIndex((tab) => tab.path === location.pathname)
  function retain(keep: PageTab[]) {
    setSnapshot((current) => ({ ...current, tabs: keep }))
  }
  function close(tab: PageTab) {
    if (tab.path !== location.pathname) {
      retain(tabs.filter((item) => item.path !== tab.path))
      return
    }
    const remaining = tabs.filter((item) => item.path !== tab.path)
    const target = remaining[Math.max(0, index - 1)] ?? { href: '/', state: {} }
    const token = crypto.randomUUID()
    setSnapshot((current) => ({ ...current, pending: { token, path: tab.path } }))
    // Removal is committed only by the destination state, after any route blocker allows navigation.
    void navigate(target.href, { state: { ...target.state, [closeKey]: token } })
  }
  function renderMenuItems(Menu: typeof ContextMenu | typeof DropdownMenu) {
    return (
      <>
        {onMaximize && (
          <Menu.Item onSelect={onMaximize}>
            <Maximize2 />
            {t('maximizePage')}
          </Menu.Item>
        )}
        <Menu.Item
          disabled={index < 0 || tabs.length < 2}
          onSelect={() => retain(tabs.filter((tab) => tab.path === location.pathname))}
        >
          <X aria-hidden="true" />
          {t('pageTabs.closeOthers')}
        </Menu.Item>
        <Menu.Item disabled={index <= 0} onSelect={() => retain(tabs.slice(index))}>
          <ArrowLeftToLine aria-hidden="true" />
          {t('pageTabs.closeLeft')}
        </Menu.Item>
        <Menu.Item
          disabled={index < 0 || index === tabs.length - 1}
          onSelect={() => retain(tabs.slice(0, index + 1))}
        >
          <ArrowRightToLine aria-hidden="true" />
          {t('pageTabs.closeRight')}
        </Menu.Item>
        <Menu.Separator className="my-1 h-px bg-border" />
        {tabs.map((tab) => {
          const Icon = flat.find((item) => item.path === tab.owner)?.icon ?? FileText
          return (
            <Menu.Item key={tab.path} asChild>
              <Link
                to={tab.href}
                state={tab.state}
                aria-current={tab.path === location.pathname ? 'page' : undefined}
              >
                <Icon aria-hidden="true" />
                {t(tab.label)}
              </Link>
            </Menu.Item>
          )
        })}
      </>
    )
  }
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <nav
          aria-label={t('pageTabs.title')}
          className="relative z-10 flex min-w-0 items-center bg-muted pl-2 pr-4 sm:pr-8"
        >
          <div
            ref={strip}
            onWheel={(event) => {
              const node = strip.current
              if (!node || node.scrollWidth <= node.clientWidth) return
              const delta =
                Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : event.deltaY
              if (delta === 0) return
              event.preventDefault()
              node.scrollLeft += delta
            }}
            className="page-tab-strip flex min-w-0 flex-1 touch-pan-x snap-x snap-proximity scroll-pl-3 gap-1 overflow-x-auto overscroll-x-contain pl-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((tab) => {
              const Icon = navigation.find((item) => item.path === tab.owner)?.icon ?? FileText
              const selected = tab.path === location.pathname
              return (
                <div
                  key={tab.path}
                  className={cn(
                    'page-tab group relative flex h-9 w-[var(--page-tab-width)] shrink-0 snap-start items-center pr-1 text-muted-foreground',
                    selected && 'page-tab-active text-foreground',
                  )}
                >
                  <HoverCard.Provider delayDuration={450}>
                    <HoverCard.Root>
                      <HoverCard.Trigger asChild>
                        <Link
                          ref={selected ? active : undefined}
                          onDoubleClick={onMaximize}
                          to={tab.href}
                          state={tab.state}
                          aria-label={t('pageTabs.open', { title: t(tab.label) })}
                          aria-current={selected ? 'page' : undefined}
                          className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-t-xl px-2 text-xs outline-offset-[-2px]"
                        >
                          <Icon aria-hidden="true" className="size-4 shrink-0" />
                          <span className="page-tab-label min-w-0 flex-1">{t(tab.label)}</span>
                        </Link>
                      </HoverCard.Trigger>
                      <HoverCard.Portal>
                        <HoverCard.Content
                          side="bottom"
                          align="start"
                          sideOffset={8}
                          collisionPadding={12}
                          className="z-50 w-72 rounded-xl border bg-popover p-4 text-sm text-popover-foreground shadow-lg"
                        >
                          <p className="break-words font-medium">{t(tab.label)}</p>
                          <p className="mt-2 break-all text-xs text-muted-foreground">{tab.path}</p>
                        </HoverCard.Content>
                      </HoverCard.Portal>
                    </HoverCard.Root>
                  </HoverCard.Provider>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'size-6 shrink-0 rounded-full hover:bg-foreground/10',
                      !selected &&
                        'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
                    )}
                    aria-label={t('pageTabs.close', { title: t(tab.label) })}
                    disabled={tab.path === '/' && tabs.length === 1}
                    onClick={() => close(tab)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              )
            })}
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('pageTabs.manage')}
                title={t('pageTabs.manage')}
              >
                <Menu className="size-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 max-h-96 w-56 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md [&_[role=menuitem]]:flex [&_[role=menuitem]]:items-center [&_[role=menuitem]]:gap-2 [&_[role=menuitem]]:rounded-sm [&_[role=menuitem]]:px-2 [&_[role=menuitem]]:py-1.5 [&_[role=menuitem]]:text-sm [&_[role=menuitem]]:outline-none [&_[data-highlighted]]:bg-accent [&_[data-disabled]]:pointer-events-none [&_[data-disabled]]:opacity-50 [&_svg]:size-4"
              >
                {renderMenuItems(DropdownMenu)}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </nav>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="z-50 max-h-96 w-56 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md [&_[role=menuitem]]:flex [&_[role=menuitem]]:items-center [&_[role=menuitem]]:gap-2 [&_[role=menuitem]]:rounded-sm [&_[role=menuitem]]:px-2 [&_[role=menuitem]]:py-1.5 [&_[role=menuitem]]:text-sm [&_[role=menuitem]]:outline-none [&_[data-highlighted]]:bg-accent [&_[data-disabled]]:pointer-events-none [&_[data-disabled]]:opacity-50 [&_svg]:size-4">
          {renderMenuItems(ContextMenu)}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

import { useId, useState } from 'react'
import { NavLink } from 'react-router'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  containsActivePath,
  isLeavingApp,
  type NavigationGroup as NavigationGroupType,
  type NavigationItem,
} from '@/lib/navigation'
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

/** 可折叠菜单分组。收起态直接点击分组会先展开侧栏，避免只看到图标不知道点了什么。 */
export function NavigationGroup({
  group,
  activePath,
  compact,
  expanded,
  onToggle,
}: {
  group: NavigationGroupType
  activePath?: string
  compact: boolean
  expanded: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const { setOpen } = useSidebar()
  const id = useId()
  // 层级菜单：命中子项时分组同样算激活（收起态的图标高亮用）
  const active = group.paths.includes(activePath ?? '')
  return (
    <SidebarMenuItem className={cn(!compact && 'w-full')}>
      <SidebarMenuButton
        tooltip={compact ? t(group.label) : undefined}
        aria-label={t(group.label)}
        title={t(group.label)}
        aria-expanded={!compact && expanded}
        aria-controls={id}
        isActive={compact && active}
        className="h-10 gap-3 rounded-lg px-3 font-medium"
        onClick={() => {
          if (compact) {
            setOpen(true)
            onToggle()
          } else onToggle()
        }}
      >
        <group.icon className="size-[18px]! shrink-0" aria-hidden="true" />
        {!compact && (
          <>
            <span className="min-w-0 flex-1 truncate">{t(group.label)}</span>
            <ChevronDown
              aria-hidden="true"
              className={cn('ml-auto transition-transform', !expanded && '-rotate-90')}
            />
          </>
        )}
      </SidebarMenuButton>
      <SidebarMenuSub id={id} className={cn((compact || !expanded) && 'hidden')}>
        <NavigationItems items={group.items} activePath={activePath} />
      </SidebarMenuSub>
    </SidebarMenuItem>
  )
}

/**
 * 递归渲染菜单项：
 * - 叶子节点是链接（`NavLink`）；
 * - 带 `children` 的节点是可展开容器，展开后缩进一层继续渲染子项。
 *
 * 顶部导航的下拉菜单也复用这个组件（`depth` 决定缩进）。
 */
export function NavigationItems({
  items,
  activePath,
  depth = 0,
}: {
  items: NavigationItem[]
  activePath?: string
  depth?: number
}) {
  return (
    <>
      {items.map((item) =>
        item.children?.length ? (
          // key 里带上"是否命中当前路由"：路由进/出子树时重新挂载，
          // 展开态自然跟着重置，不需要 effect 里 setState。
          <NavigationBranch
            key={`${item.path}:${containsActivePath(item, activePath) ? 'active' : 'idle'}`}
            item={item}
            activePath={activePath}
            depth={depth}
          />
        ) : (
          <LeafItem key={item.path} item={item} activePath={activePath} depth={depth} />
        ),
      )}
    </>
  )
}

function LeafItem({
  item,
  activePath,
  depth,
}: {
  item: NavigationItem
  activePath?: string
  depth: number
}) {
  const { t } = useTranslation()
  const { setOpenMobile } = useSidebar()
  const leaving = isLeavingApp(item)
  const content = (
    <>
      <item.icon aria-hidden="true" />
      <span>{t(item.label)}</span>
      {item.external && (
        <ArrowUpRight aria-hidden="true" className="ml-auto size-3.5 text-muted-foreground" />
      )}
    </>
  )
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild
        isActive={activePath === item.path}
        className={cn('h-9 text-muted-foreground', depth > 0 && 'ml-3')}
      >
        {leaving ? (
          // 新窗口 / 当前窗口的外链：直接用 <a>，不走路由
          <a
            href={item.external?.url}
            target={item.external?.target === 'self' ? '_self' : '_blank'}
            rel="noreferrer"
            aria-label={t(item.label)}
            title={item.external?.url}
            onClick={() => setOpenMobile(false)}
          >
            {content}
          </a>
        ) : (
          <NavLink
            to={item.path}
            end
            aria-label={t(item.label)}
            title={t(item.label)}
            aria-current={activePath === item.path ? 'page' : undefined}
            onClick={() => setOpenMobile(false)}
          >
            {content}
          </NavLink>
        )}
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

/** 可展开的容器节点：默认在「当前路由落在它的子树里」时展开。 */
function NavigationBranch({
  item,
  activePath,
  depth,
}: {
  item: NavigationItem
  activePath?: string
  depth: number
}) {
  const { t } = useTranslation()
  const active = containsActivePath(item, activePath)
  const [open, setOpen] = useState(active)
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild
        isActive={false}
        className={cn('h-9 text-muted-foreground', depth > 0 && 'ml-3')}
      >
        <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          <item.icon aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-left">{t(item.label)}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn('size-3.5 transition-transform', !open && '-rotate-90')}
          />
        </button>
      </SidebarMenuSubButton>
      {open && (
        <SidebarMenuSub className="mx-0 border-l-0 px-0">
          <NavigationItems items={item.children ?? []} activePath={activePath} depth={depth + 1} />
        </SidebarMenuSub>
      )}
    </SidebarMenuSubItem>
  )
}

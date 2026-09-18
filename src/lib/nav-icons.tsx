import type { ComponentType } from 'react'
import {
  Bell,
  Blocks,
  Braces,
  ChartColumn,
  ChartPie,
  ChartLine,
  Circle,
  CircleGauge,
  ClipboardList,
  Cog,
  Database,
  FileText,
  FolderTree,
  Gauge,
  Globe,
  History,
  LayoutDashboard,
  Layers,
  ListChecks,
  ListTree,
  MenuSquare,
  MessagesSquare,
  Package,
  Palette,
  ScrollText,
  Settings,
  ShieldCheck,
  Table,
  Tag,
  Tags,
  UsersRound,
  Wallet,
  Wrench,
} from 'lucide-react'
import { GithubMark } from '@/components/github-link'
import type { NavigationIcon } from './navigation'

/**
 * 侧栏图标白名单。
 *
 * 侧栏在首屏就要渲染，这里用**静态图标**，避免把 lucide 的全量图标表
 * （`lucide-react/dynamic` 的 `dynamicIconImports`，约 240KB）打进入口包。
 * 需要更多图标：在这里加一行即可；图标预览页仍然可以查全量图标名。
 */
const navIcons: Record<string, ComponentType<{ className?: string }>> = {
  bell: Bell,
  blocks: Blocks,
  braces: Braces,
  'chart-column': ChartColumn,
  'chart-line': ChartLine,
  'chart-pie': ChartPie,
  circle: Circle,
  'circle-gauge': CircleGauge,
  clipboard: ClipboardList,
  'clipboard-list': ClipboardList,
  cog: Cog,
  database: Database,
  'file-text': FileText,
  'folder-tree': FolderTree,
  gauge: Gauge,
  globe: Globe,
  history: History,
  /** 自绘的品牌标识也走同一张表：菜单里可以写 icon: 'github' */
  github: GithubMark,
  'layout-dashboard': LayoutDashboard,
  layers: Layers,
  'list-checks': ListChecks,
  'list-tree': ListTree,
  'menu-square': MenuSquare,
  'messages-square': MessagesSquare,
  package: Package,
  palette: Palette,
  'scroll-text': ScrollText,
  settings: Settings,
  'shield-check': ShieldCheck,
  table: Table,
  tag: Tag,
  tags: Tags,
  'users-round': UsersRound,
  wallet: Wallet,
  wrench: Wrench,
}

/** 后端可能写 `ChartLine`、`chart-line` 或 `chart_line`，统一成 kebab-case。 */
export function toKebabIconName(name: string): string {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

/**
 * 按名字解析侧栏图标。命中白名单就用对应图标，否则回落到圆形占位，
 * 并把 `known: false` 交给调用方写 warning——菜单不会因为图标名写错而不显示。
 */
export function resolveNavIcon(name: string | undefined): { icon: NavigationIcon; known: boolean } {
  const kebab = name ? toKebabIconName(name) : ''
  const icon = kebab ? navIcons[kebab] : undefined
  return icon ? { icon, known: true } : { icon: Circle, known: false }
}

import {
  defaultAccessibility,
  resolveAccessibility,
  type AccessibilityPreferences,
} from '@/lib/accessibility'
import {
  resolveCustomColors,
  type BaseColor,
  type ColorChoice,
  type CustomColors,
  type ThemeColor,
} from '@/lib/color-options'
import { storageKey } from '@/lib/storage-key'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export const pageTransitions = [
  'none',
  'fade',
  'slide',
  'slide-left',
  'slide-right',
  'slide-up',
  'slide-down',
] as const
export type PageTransition = (typeof pageTransitions)[number]
export const tabbarStyles = ['card', 'line'] as const
export type TabbarStyle = (typeof tabbarStyles)[number]
/** 布局：侧边导航、顶部+侧边（混合）、纯顶部。 */
export const layoutModes = ['side', 'top-side', 'top'] as const
export type LayoutMode = (typeof layoutModes)[number]

export function resolveLayoutMode(value: unknown): LayoutMode {
  return layoutModes.includes(value as LayoutMode) ? (value as LayoutMode) : 'side'
}

export function resolveTabbarStyle(value: unknown): TabbarStyle {
  return tabbarStyles.includes(value as TabbarStyle) ? (value as TabbarStyle) : 'card'
}

export function resolveSidebarWidth(value: unknown): number {
  return typeof value === 'number' && value >= 200 && value <= 360 ? value : 244
}

export function resolveRadius(value: unknown): number {
  return typeof value === 'number' && value >= 0 && value <= 1.5 ? value : 0.5
}

export const transitionOptions = [...pageTransitions, 'auto'] as const
export type TransitionOption = (typeof transitionOptions)[number]

export function resolveTransition(value: unknown): TransitionOption {
  return transitionOptions.includes(value as TransitionOption)
    ? (value as TransitionOption)
    : 'none'
}

/** 主题方案：青绿（默认）与五个可选配色，定义见 palettes.css。 */
export const palettes = ['teal', 'blue', 'forest', 'violet', 'amber', 'graphite'] as const
export type Palette = (typeof palettes)[number] | 'custom'

export function resolvePalette(value: unknown): Palette {
  return value === 'custom' || palettes.includes(value as (typeof palettes)[number])
    ? (value as Palette)
    : 'teal'
}

/** 顶栏快捷操作。业务系统可增删 id，并在 ConsoleLayout 传入对应节点。 */
export const headerActionIds = [
  'search',
  'notifications',
  'reload',
  'fullscreen',
  'language',
  'theme',
  'github',
] as const
export type HeaderActionId = (typeof headerActionIds)[number]

export function resolveTheme(theme: Theme, prefersDark: boolean): 'light' | 'dark' {
  return theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
}

/**
 * 合并保存的快捷操作偏好：只保留已知 id，并把后来新增的 id 插回默认位置，
 * 既保留用户调整过的顺序，也不会让新入口（例如通知）消失。
 */
export function resolveHeaderActions(
  saved: Appearance['headerActions'] | undefined,
  current: Appearance['headerActions'],
): Appearance['headerActions'] {
  const kept = (saved ?? []).filter((action) => headerActionIds.includes(action.id))
  if (!kept.length) return current
  const merged = [...kept]
  for (const id of headerActionIds) {
    if (merged.some((action) => action.id === id)) continue
    const action = current.find((item) => item.id === id)
    if (!action) continue
    const defaultIndex = headerActionIds.indexOf(id)
    const previous = headerActionIds
      .slice(0, defaultIndex)
      .reverse()
      .map((candidate) => merged.findIndex((item) => item.id === candidate))
      .find((index) => index >= 0)
    const next = headerActionIds
      .slice(defaultIndex + 1)
      .map((candidate) => merged.findIndex((item) => item.id === candidate))
      .find((index) => index >= 0)
    const insertAt = previous !== undefined ? previous + 1 : (next ?? merged.length)
    merged.splice(insertAt, 0, action)
  }
  return merged
}

type Appearance = {
  theme: Theme
  accessibility: AccessibilityPreferences
  /** 侧栏展开宽度（像素）。 */
  sidebarWidth: number
  /** 全局圆角基数（rem）。 */
  radius: number
  /** 页面切换动画；'auto' 按前进/后退自动选方向。 */
  transition: PageTransition | 'auto'
  /** 页面标签栏样式：卡片式或下划线式。 */
  tabbarStyle: TabbarStyle
  /** 布局模式：侧边导航或顶部导航。 */
  layout: LayoutMode
  setAccessibility: (preferences: Partial<AccessibilityPreferences>) => void
  resetAccessibility: () => void
  palette: Palette
  customColors: CustomColors
  syncColors: boolean
  collapsed: boolean
  sidebarPinned: boolean
  multipleGroups: boolean
  defaultGroups: string[]
  showTabs: boolean
  tabsAboveBreadcrumb: boolean
  headerActions: { id: HeaderActionId; visible: boolean }[]
  setTheme: (theme: Theme) => void
  setPalette: (palette: Palette) => void
  setBaseColor: (color: BaseColor, mode: 'light' | 'dark') => void
  setThemeColor: (color: ThemeColor, mode: 'light' | 'dark') => void
  setSyncColors: (sync: boolean, mode: 'light' | 'dark') => void
  setSidebarWidth: (width: number) => void
  setRadius: (radius: number) => void
  setTransition: (transition: TransitionOption) => void
  setTabbarStyle: (style: TabbarStyle) => void
  setLayout: (layout: LayoutMode) => void
  toggleSidebar: () => void
}

function updateColors(
  state: Appearance,
  mode: 'light' | 'dark',
  choice: ColorChoice,
): CustomColors {
  return state.syncColors
    ? { light: choice, dark: choice }
    : { ...state.customColors, [mode]: choice }
}

/** 只保存浏览器偏好；服务端数据不进入这里。 */
export const useAppearance = create<Appearance>()(
  persist(
    (set) => ({
      theme: 'system',
      accessibility: defaultAccessibility,
      sidebarWidth: 244,
      radius: 0.5,
      transition: 'none',
      tabbarStyle: 'card',
      layout: 'side',
      setAccessibility: (preferences) =>
        set((state) => ({
          accessibility: resolveAccessibility({ ...state.accessibility, ...preferences }),
        })),
      resetAccessibility: () => set({ accessibility: { ...defaultAccessibility } }),
      palette: 'teal',
      customColors: resolveCustomColors(undefined),
      syncColors: true,
      collapsed: false,
      sidebarPinned: true,
      multipleGroups: true,
      // 侧栏默认展开的分组：业务 + 设计系统 + 动态菜单（系统收起）。id 来自
      // src/app/navigation.ts 与示例后台菜单，业务系统按自己的分组改这里。
      defaultGroups: ['business', 'design', 'dynamic'],
      showTabs: false,
      tabsAboveBreadcrumb: false,
      headerActions: headerActionIds.map((id) => ({ id, visible: true })),
      setTheme: (theme) => set({ theme }),
      setPalette: (palette) => set({ palette }),
      setBaseColor: (baseColor, mode) =>
        set((state) => ({
          palette: 'custom',
          customColors: updateColors(state, mode, { ...state.customColors[mode], baseColor }),
        })),
      setThemeColor: (themeColor, mode) =>
        set((state) => ({
          palette: 'custom',
          customColors: updateColors(state, mode, { ...state.customColors[mode], themeColor }),
        })),
      setSyncColors: (syncColors, mode) =>
        set((state) => ({
          syncColors,
          customColors: syncColors
            ? { light: state.customColors[mode], dark: state.customColors[mode] }
            : state.customColors,
        })),
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth: resolveSidebarWidth(sidebarWidth) }),
      setRadius: (radius) => set({ radius: resolveRadius(radius) }),
      setTransition: (transition) => set({ transition: resolveTransition(transition) }),
      setTabbarStyle: (tabbarStyle) => set({ tabbarStyle: resolveTabbarStyle(tabbarStyle) }),
      setLayout: (layout) => set({ layout: resolveLayoutMode(layout) }),
      toggleSidebar: () => set((state) => ({ collapsed: !state.collapsed })),
    }),
    {
      name: storageKey('appearance'),
      version: 2,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<Appearance>
        return {
          ...current,
          ...saved,
          palette: resolvePalette(saved.palette),
          accessibility: resolveAccessibility(saved.accessibility),
          customColors: resolveCustomColors(saved.customColors),
          syncColors: saved.syncColors !== false,
          sidebarWidth: resolveSidebarWidth(saved.sidebarWidth),
          radius: resolveRadius(saved.radius),
          transition: resolveTransition(saved.transition),
          tabbarStyle: resolveTabbarStyle(saved.tabbarStyle),
          layout: resolveLayoutMode(saved.layout),
          headerActions: resolveHeaderActions(saved.headerActions, current.headerActions),
        }
      },
      partialize: ({
        accessibility,
        theme,
        palette,
        customColors,
        syncColors,
        collapsed,
        sidebarPinned,
        multipleGroups,
        defaultGroups,
        showTabs,
        tabsAboveBreadcrumb,
        sidebarWidth,
        radius,
        transition,
        tabbarStyle,
        layout,
        headerActions,
      }) => ({
        accessibility,
        theme,
        palette,
        customColors,
        syncColors,
        collapsed,
        sidebarPinned,
        multipleGroups,
        defaultGroups,
        showTabs,
        tabsAboveBreadcrumb,
        sidebarWidth,
        radius,
        transition,
        tabbarStyle,
        layout,
        headerActions,
      }),
    },
  ),
)

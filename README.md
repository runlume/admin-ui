# @runlume/admin-ui

Runlume 标准后台组件库：语义 Token、UI 原语、数据组件，以及**控制台外壳**（侧栏分组导航、顶栏与
面包屑、页签、菜单搜索、收藏夹、用户菜单与设置弹窗、外观与无障碍偏好）。业务应用只需要接自己的
路由、会话与数据，界面基线直接从这里取。

配套仓库：[admin-react](https://github.com/runlume/admin-react)（标准后台应用：路由、菜单、会话接线
与标准页面的参考实现）在 `../admin-react`，[admin-design](https://github.com/runlume/admin-design)
（文档站与官网）在上一层目录。

## 安装

```bash
pnpm add @runlume/admin-ui
```

样式入口二选一：

```css
/* 用 Tailwind 的宿主：Token + 组件样式，工具类由你自己的构建产出 */
@import 'tailwindcss';
@import '@runlume/admin-ui/theme.css';
@source '../node_modules/@runlume/admin-ui/dist-package';
```

```ts
// 不用 Tailwind 的宿主：预构建完整样式
import '@runlume/admin-ui/styles.css'
```

## 用法

```tsx
import { ConsoleLayout } from '@runlume/admin-ui/components/console-layout'
import { UserMenu } from '@runlume/admin-ui/components/user-menu'
import { useAppearance } from '@runlume/admin-ui/lib/appearance'
import { shellEn, shellZh } from '@runlume/admin-ui/lib/shell-messages'
```

导出面：

| 子路径                           | 内容                                                                   |
| -------------------------------- | ---------------------------------------------------------------------- |
| `@runlume/admin-ui`              | 全量导出（组件 + lib + hooks）                                         |
| `@runlume/admin-ui/ui/*`         | 原语组件（button、dialog、table、sidebar…）                            |
| `@runlume/admin-ui/components/*` | 数据组件与外壳组件（data-table、console-layout、user-settings…）       |
| `@runlume/admin-ui/lib/*`        | 通用工具与状态（appearance、navigation、permissions、shell-messages…） |
| `@runlume/admin-ui/hooks/*`      | 通用 hook                                                              |
| `@runlume/admin-ui/theme.css`    | Token + 组件样式（Tailwind 宿主）                                      |
| `@runlume/admin-ui/styles.css`   | 预构建完整样式                                                         |

外壳文案随包提供，合并进宿主的 i18n 即可，宿主同名 key 优先：

```ts
resources: { 'zh-CN': { translation: { ...shellZh, ...appZh } } }
```

需要数据的组件一律由宿主传值：`ConsoleLayout` 的 `brand` / `repositoryUrl`、`NotificationsButton` 的
`unread`、`AboutPanel` 的一组品牌参数、`UserSettings` 的 `aboutContent` 与 `shortcutDefaults`。

对等依赖（宿主提供，不随包安装）：`react` / `react-dom`（18.2+）、`react-router`（6.4–7）、
`i18next` 与 `react-i18next` —— 外壳组件用它们做路由与文案。只要 UI 原语、不要外壳时，
从 `@runlume/admin-ui/ui/*` 按子路径引入即可，不触发根入口。

## 目录

| 路径                                 | 内容                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `src/components/ui/`                 | 原语组件（基于 radix-ui 与语义 Token）                                           |
| `src/components/`                    | 数据组件与外壳组件                                                               |
| `src/lib/`                           | 状态与工具：appearance、notification-preferences、navigation、权限、快捷键、文案 |
| `src/hooks/`                         | 通用 hook                                                                        |
| `src/theme.css` `src/components.css` | 样式层（分层约定见 AGENTS.md）                                                   |
| `src/admin-ui.ts`                    | 入口，按目录全量导出                                                             |

## 开发

```bash
pnpm install
pnpm check          # format:check + typecheck + lint + 单测 + 构建
pnpm build:lib      # 构建 dist-package（宿主通过 link: 取用）
pnpm test:package   # 校验发布产物可被引用
```

本地联调：在宿主仓库写 `overrides: { '@runlume/admin-ui': link:../admin-ui }`，改完本仓库执行
`pnpm build:lib`。

## 协议

Apache-2.0，见 [LICENSE](LICENSE) 与 [NOTICE](NOTICE)。

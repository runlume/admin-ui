# admin-ui 协作约定

本仓库是 **Runlume 标准后台组件库**（npm 包 `@runlume/admin-ui`）：语义 Token、UI 原语、数据组件、
控制台外壳与标准页型。应用层（路由、菜单、会话、业务页面）在 `admin-react` 仓库，本仓库不为任何
具体业务写代码。

## 1. 边界

允许：与业务无关的 UI 能力 —— 组件、样式层、通用 hook、纯前端状态（外观与无障碍偏好）。

禁止：

- 引入业务路由表、业务接口、会话与身份实现、演示数据；需要数据时用 **props 注入**。
- 绑定具体产品：品牌、仓库地址、站点地址一律由宿主传入（例如 `ConsoleLayout.brand`、
  `AboutPanel` 的一组 props），组件里不出现 `runlume.app` 之类的常量。
- 复制宿主实现：宿主需要什么就在这里补能力，再到 `admin-react` 升级版本，不允许两边各写一份。

## 2. 样式分层

| 文件                 | 内容                                              | 谁用                         |
| -------------------- | ------------------------------------------------- | ---------------------------- |
| `src/theme.css`      | Token → Tailwind 映射、语义取值、配色、无障碍覆盖 | 用 Tailwind 的宿主 `@import` |
| `src/components.css` | 组件自身的结构、动效与状态样式                    | 由 `theme.css` 带入          |
| `src/admin-ui.css`   | 预构建完整入口（Tailwind + 动画 + 上面两份）      | 不用 Tailwind 的宿主         |

新增组件样式写进 `components.css` 并注明对应组件；Token 变更必须同步 `theme.css` 的映射与六套配色。

## 3. 导出面 = 契约

- `src/admin-ui.ts` 是入口，按目录全量导出；**删改导出名是破坏性变更**，必须升 minor/major 并写
  `BREAKING CHANGE`。同名冲突（如 `NavigationGroup`、`PasswordStrength`）只保留一个，另一个走子路径。
- 子路径导出面固定为 `./components/*`、`./ui/*`、`./hooks/*`、`./lib/*`、`./theme.css`、`./styles.css`；
  产物按文件保留（`preserveModules`），宿主只引到自己用到的那几个模块。
- 文案：外壳与标准页型的 key 放 `src/lib/shell-messages.ts`（`shellZh` / `shellEn`），宿主合并即可。
  组件里不写死中文或英文，一律 `t('…')`。

## 4. 组件约定

- 受控优先：能由宿主决定的状态就不放进组件内部（通知数据、品牌、菜单、会话）。
- 无障碍：可交互元素要有可访问名称；依赖 `prefers-reduced-motion` 的动效必须可关闭。
- 每个组件要有对应测试（`src/test/components` 或 `src/test/unit`）；jsdom 覆盖逻辑，布局与视觉回归
  交给宿主仓库的 Playwright。

## 5. 验证与发布

```bash
pnpm install
pnpm check          # format:check + typecheck + lint + 单测 + 构建产物
pnpm build:lib      # 只构建 dist-package
pnpm test:package   # 冒烟验证发布产物可被引用
```

- 提交：中文 Conventional Commit，一个提交一个内聚目标。
- 发布：`pnpm version <patch|minor|major>` 后 `pnpm publish`（`prepack` 会自动构建产物）；
  **未经明确指示不要发布**。
- 本地联调：宿主仓库用 `overrides: '@runlume/admin-ui': link:../admin-ui` 指向本仓库，改完执行
  `pnpm build:lib` 让宿主拿到新产物。

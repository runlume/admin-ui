# @runlume/admin-ui

The Runlume standard admin component library: semantic tokens, UI primitives, data components and the
**console shell** (grouped sidebar, top bar with breadcrumbs, page tabs, menu search, favorites, user menu
and settings dialog, appearance and accessibility preferences).

The matching application (routes, menus, session wiring and reference pages) lives in `admin-react`.

## Install

```bash
pnpm add @runlume/admin-ui
```

```css
/* Tailwind hosts: tokens + component styles, utilities come from your own build */
@import 'tailwindcss';
@import '@runlume/admin-ui/theme.css';
@source '../node_modules/@runlume/admin-ui/dist-package';
```

```ts
// Non-Tailwind hosts: the prebuilt stylesheet
import '@runlume/admin-ui/styles.css'
```

## Usage

Entry points: `@runlume/admin-ui` (all exports), `./ui/*` (primitives), `./components/*` (data and shell
components), `./lib/*` (state and helpers), `./hooks/*`, `./theme.css` and `./styles.css`.

Shell messages ship with the package; merge them into your i18n resources and let your own keys win:

```ts
resources: { en: { translation: { ...shellEn, ...appStrings } } }
```

Components that need data take it from props: `ConsoleLayout.brand` / `repositoryUrl`,
`NotificationsButton.unread`, `AboutPanel` brand props, `UserSettings.aboutContent` / `shortcutDefaults`.

## Development

```bash
pnpm install
pnpm check       # format check + typecheck + lint + unit tests + build
pnpm build:lib   # build dist-package for hosts that link to this repo
pnpm test:package
pnpm docs:build  # design system documentation site
```

## License

Apache-2.0, see [LICENSE](LICENSE) and [NOTICE](NOTICE).

import type { ReactNode } from 'react'
import { Layers3, Palette, ShieldCheck, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Brand } from './brand'
import { GithubLink } from './github-link'
import { PreferencesMenu } from './preferences-menu'

/** 品牌站点：业务系统换成自己的官网。 */
const brandUrl = import.meta.env.VITE_APP_PLATFORM_WEB_BASEURL || 'https://runlume.app'

/** 模板自身的开源仓库，业务系统换成自己的。 */
const repositoryUrl = 'https://github.com/runlume/admin-design'

const points: { icon: LucideIcon; key: string }[] = [
  { icon: Palette, key: 'theme' },
  { icon: Layers3, key: 'layout' },
  { icon: ShieldCheck, key: 'pages' },
]

/**
 * 未登录页外壳：左侧品牌区、右侧表单区、底部版权。
 * 登录、注册、找回密码共用，业务系统接入真实身份服务时替换表单即可。
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r bg-sidebar p-12 lg:flex xl:p-16">
        <Brand className="w-36" />
        <div className="max-w-lg">
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-primary">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
            {t('auth.badge')}
          </span>
          <h1 className="text-[42px] font-semibold leading-[1.25] tracking-tight xl:text-5xl">
            {t('auth.title')}
          </h1>
          <p className="mt-6 max-w-sm text-base leading-8 text-muted-foreground">
            {t('auth.description')}
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {points.map(({ icon: Icon, key }) => (
              <span key={key} className="flex items-center gap-2">
                <Icon className="size-4 text-primary" aria-hidden="true" />
                {t(`auth.points.${key}`)}
              </span>
            ))}
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground">RUNLUME ADMIN DESIGN</p>
      </section>
      <section className="flex flex-col">
        <header className="flex h-24 shrink-0 items-center gap-4 px-6 sm:px-10">
          <Brand className="w-32 lg:hidden" />
          <a
            href={brandUrl}
            className="hidden text-xs text-muted-foreground hover:text-primary lg:inline"
            rel="noreferrer"
            target="_blank"
          >
            runlume.app
          </a>
          {/* 右侧操作区：语言 / 亮暗常驻，仓库入口排在最后 */}
          <div className="ml-auto flex items-center gap-5">
            <PreferencesMenu />
            <GithubLink className="ml-1" href={repositoryUrl} label={t('githubRepo')} />
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <footer className="shrink-0 px-8 py-6 text-center text-xs text-muted-foreground">
          {t('auth.footer')}
        </footer>
      </section>
    </main>
  )
}

/** 表单区标题：图标 + 标题 + 说明，三个未登录页保持一致。 */
export function AuthHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <>
      <div className="mb-7 flex size-12 items-center justify-center rounded-xl border bg-card">
        <Icon className="size-6 text-primary" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
    </>
  )
}

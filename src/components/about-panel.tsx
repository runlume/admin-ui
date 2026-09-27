import { BookOpen, Boxes, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { GithubLink } from './github-link'

/**
 * 关于面板：品牌、来源说明与仓库 / 协议入口。
 * 文案与链接全部由宿主传入（组件库不绑定任何具体产品），设置页与设置弹窗共用同一份内容。
 */
export function AboutPanel({
  title,
  description,
  brandName,
  brandUrl,
  docsUrl,
  repositoryUrl,
}: {
  /** 面板标题，通常是"<产品名> 控制台"。 */
  title: string
  description: string
  brandName: string
  brandUrl: string
  docsUrl: string
  /** 本系统自己的仓库地址；不传时不显示仓库与协议入口。 */
  repositoryUrl?: string
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3 text-sm text-muted-foreground">
      <a
        className="flex items-center gap-2 text-base font-medium text-foreground hover:text-primary"
        href={brandUrl}
        rel="noreferrer"
        target="_blank"
      >
        <Boxes className="size-4 text-muted-foreground" aria-hidden="true" />
        {title}
      </a>
      <p>{description}</p>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
        <li>
          <a
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            href={docsUrl}
            rel="noreferrer"
            target="_blank"
          >
            <BookOpen aria-hidden="true" className="size-4" />
            {t('docsSite')}
          </a>
        </li>
        {repositoryUrl && (
          <li>
            <GithubLink
              className="text-sm font-medium text-primary hover:underline"
              href={repositoryUrl}
              label={t('githubRepo')}
              showLabel
            />
          </li>
        )}
        {repositoryUrl && (
          <li>
            <a
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              href={`${repositoryUrl}/blob/main/LICENSE`}
              rel="noreferrer"
              target="_blank"
            >
              <Scale aria-hidden="true" className="size-4" />
              {t('license')}
            </a>
          </li>
        )}
      </ul>
      <p className="pt-1 text-xs text-muted-foreground">
        {t('console')} · {brandName}
      </p>
    </div>
  )
}

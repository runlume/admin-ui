import { useTranslation } from 'react-i18next'
import { BookOpen, Boxes, Scale } from 'lucide-react'
import { GithubLink } from './github-link'
import { brandInfo } from '@/lib/brand-info'

/** 模板自身的开源仓库与协议，业务系统换成自己的。 */
const repositoryUrl = 'https://github.com/runlume/admin-design'

/**
 * 关于：品牌、来源说明与仓库 / 协议入口。
 * 设置页与设置弹窗共用同一份内容，避免两处文案漂移。
 */
export function AboutPanel() {
  const { t } = useTranslation()
  return (
    <div className="space-y-3 text-sm text-muted-foreground">
      <a
        className="flex items-center gap-2 text-base font-medium text-foreground hover:text-primary"
        href={brandInfo.site}
        rel="noreferrer"
        target="_blank"
      >
        <Boxes className="size-4 text-muted-foreground" aria-hidden="true" />
        Runlume 标准后台设计
      </a>
      <p>
        提取自{' '}
        <a
          className="text-primary hover:underline"
          href={brandInfo.site}
          rel="noreferrer"
          target="_blank"
        >
          Runlume
        </a>{' '}
        平台前端：语义 Token、六个主题预设、控制台外壳与标准页型。
        业务系统复制本工程后替换品牌资源与菜单，即可获得一致的视觉与交互基线。
      </p>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
        <li>
          <a
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            href={brandInfo.sites.docs}
            rel="noreferrer"
            target="_blank"
          >
            <BookOpen aria-hidden="true" className="size-4" />
            {t('docsSite')}
          </a>
        </li>
        <li>
          <GithubLink
            className="text-sm font-medium text-primary hover:underline"
            href={repositoryUrl}
            label={t('githubRepo')}
            showLabel
          />
        </li>
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
      </ul>
    </div>
  )
}

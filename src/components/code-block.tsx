import { useState } from 'react'
import { useUiTranslation } from '../lib/use-ui-translation'
import { toast } from 'sonner'
import { Check, Copy } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

/** 代码/配置展示（不做语法高亮，保持零依赖）。 */
export function CodeBlock({
  code,
  title,
  className,
}: {
  code: string
  title?: string
  className?: string
}) {
  const { t } = useUiTranslation()
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success(t('copied'))
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(t('copyFailed'))
    }
  }
  return (
    <div
      data-slot="code-block"
      className={cn('relative overflow-hidden rounded-lg border bg-muted/40', className)}
    >
      <div className="flex items-center justify-between gap-3 border-b px-3 py-1.5">
        <span className="truncate font-mono text-xs text-muted-foreground">{title ?? 'code'}</span>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={t('copy')} onClick={copy}>
          {copied ? (
            <Check aria-hidden="true" className="size-3.5" />
          ) : (
            <Copy aria-hidden="true" className="size-3.5" />
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto px-3 py-2.5 text-xs leading-6">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}

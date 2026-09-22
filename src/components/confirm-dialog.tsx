import { useState, type ReactNode } from 'react'
import { useUiTranslation } from '../lib/use-ui-translation'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

/**
 * 二次确认弹窗：内置确认/取消页脚与异步 loading 状态。
 * 删除、停用、批量操作等风险动作统一用它。
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone = 'default',
  onConfirm,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  tone?: 'default' | 'danger' | 'warning'
  /** 支持异步：等待期间确认按钮显示 loading 且不可重复提交。 */
  onConfirm: () => void | Promise<void>
  children?: ReactNode
}) {
  const { t } = useUiTranslation()
  const [pending, setPending] = useState(false)
  const variants = { default: 'default', danger: 'destructive', warning: 'warning' } as const
  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? undefined : onOpenChange(next))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            variant={variants[tone]}
            loading={pending}
            onClick={async () => {
              setPending(true)
              try {
                await onConfirm()
                onOpenChange(false)
              } finally {
                setPending(false)
              }
            }}
          >
            {confirmLabel ?? t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

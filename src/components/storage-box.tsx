import { useState } from 'react'
import { Bookmark, PencilLine, Save, Trash2 } from 'lucide-react'
import { useUiTranslation } from '../lib/use-ui-translation'
import { toast } from 'sonner'
import {
  presetNameTaken,
  readPresets,
  renamePreset,
  upsertPreset,
  writePresets,
  type Preset,
} from '@/lib/presets'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Popover } from 'radix-ui'
import { cn } from '@/lib/utils'

/**
 * 储物箱：把当前页面状态（筛选条件、表格列配置等）命名保存到浏览器，
 * 之后一键恢复；支持覆盖、重命名、删除与自定义标题。
 */
export function StorageBox<T>({
  storageId,
  snapshot,
  onRestore,
  title,
  placeholder,
  summary,
  emptyHint,
  className,
}: {
  /** 存储键后缀，通常用页面名，例如 `customers`。 */
  storageId: string
  /** 当前要暂存的状态快照。 */
  snapshot: T
  onRestore: (value: T) => void
  /** 弹出层标题，默认「储物箱」。 */
  title?: string
  placeholder?: string
  /** 列表里展示的快照摘要，帮助区分不同条目。 */
  summary?: (value: T) => string
  emptyHint?: string
  className?: string
}) {
  const { t } = useUiTranslation()
  const key = `storage-box.${storageId}`
  const [entries, setEntries] = useState<Preset<T>[]>(() => readPresets<T>(key))
  const [name, setName] = useState('')
  const [renaming, setRenaming] = useState<string>()
  const [renameValue, setRenameValue] = useState('')
  const [open, setOpen] = useState(false)

  function commit(next: Preset<T>[]) {
    setEntries(next)
    writePresets(key, next)
  }
  function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    const existing = presetNameTaken(entries, trimmed)
    commit(
      upsertPreset(entries, { name: trimmed, value: snapshot, savedAt: new Date().toISOString() }),
    )
    setName('')
    toast.success(
      existing
        ? t('storageBox.overwritten', { name: trimmed })
        : t('storageBox.saved', { name: trimmed }),
    )
  }
  const trimmedName = name.trim()
  /** 重名不直接覆盖：按钮变成「覆盖」，改名或点它都行（避免手滑覆盖掉别人的预设）。 */
  const nameTaken = presetNameTaken(entries, trimmedName)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="outline" className={className}>
          <Bookmark aria-hidden="true" />
          {title ?? t('storageBox.title')}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-50 w-80 rounded-xl border bg-popover p-3 text-sm shadow-lg outline-none"
        >
          <p className="font-medium">{title ?? t('storageBox.title')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('storageBox.hint')}</p>

          <div className="mt-3 flex items-end gap-2">
            <div className="grid flex-1 gap-1.5">
              <Label htmlFor={`storage-box-name-${storageId}`} className="text-xs">
                {t('storageBox.name')}
              </Label>
              <Input
                id={`storage-box-name-${storageId}`}
                className="h-8"
                value={name}
                placeholder={placeholder ?? t('storageBox.namePlaceholder')}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <Button
              size="sm"
              variant={nameTaken ? 'outline' : 'default'}
              disabled={!trimmedName}
              onClick={save}
            >
              <Save aria-hidden="true" />
              {nameTaken ? t('storageBox.overwrite') : t('storageBox.save')}
            </Button>
          </div>
          {nameTaken && (
            <p role="alert" className="mt-2 text-xs text-warning">
              {t('storageBox.nameTaken', { name: trimmedName })}
            </p>
          )}

          <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
            {entries.map((entry) => (
              <li key={entry.name} className="rounded-lg border p-2">
                {renaming === entry.name ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Input
                        className="h-8"
                        aria-label={t('storageBox.rename')}
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                      />
                      <Button
                        size="sm"
                        disabled={
                          !renameValue.trim() || presetNameTaken(entries, renameValue, entry.name)
                        }
                        onClick={() => {
                          commit(renamePreset(entries, entry.name, renameValue.trim()))
                          setRenaming(undefined)
                        }}
                      >
                        {t('confirm')}
                      </Button>
                    </div>
                    {presetNameTaken(entries, renameValue, entry.name) && (
                      <p role="alert" className="text-xs text-warning">
                        {t('storageBox.nameTaken', { name: renameValue.trim() })}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        onRestore(entry.value)
                        toast.success(t('storageBox.applied', { name: entry.name }))
                      }}
                    >
                      <span className="block truncate font-medium">{entry.name}</span>
                      <span className={cn('mt-0.5 block truncate text-xs text-muted-foreground')}>
                        {summary?.(entry.value) ?? entry.savedAt?.slice(0, 16) ?? ''}
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`${t('storageBox.rename')} ${entry.name}`}
                      onClick={() => {
                        setRenaming(entry.name)
                        setRenameValue(entry.name)
                      }}
                    >
                      <PencilLine aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`${t('storageBox.remove')} ${entry.name}`}
                      onClick={() => {
                        commit(entries.filter((item) => item.name !== entry.name))
                        toast.success(t('storageBox.removed', { name: entry.name }))
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
            {!entries.length && (
              <li className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                {emptyHint ?? t('storageBox.empty')}
              </li>
            )}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

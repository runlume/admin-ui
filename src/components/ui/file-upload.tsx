import { useRef, useState } from 'react'
import { FileUp, Trash2, UploadCloud } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Progress } from './progress'
import { Button } from './button'
import { cn } from '@/lib/utils'

export type UploadFile = {
  id: string
  name: string
  size: number
  /** 0–100，模拟或真实上传进度。 */
  progress: number
  error?: string
  /** 上传中：可取消；失败：可重试。 */
  status?: 'pending' | 'uploading' | 'done' | 'failed'
  /** 上传任务的取消句柄，由业务在 onFiles 里提供。 */
  abort?: () => void
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * 文件上传：拖拽或选择文件，客户端先做类型与体积校验，
 * 上传进度由业务层通过 `onFiles` 回填（示例里用定时器模拟）。
 */
export function FileUpload({
  files,
  onFilesChange,
  accept,
  maxSize = 10 * 1024 * 1024,
  multiple = true,
  concurrency = 3,
  uploader,
  label,
  className,
}: {
  files: UploadFile[]
  onFilesChange: (files: UploadFile[]) => void
  /** 例如 `.pdf,.png`，留空表示不限类型。 */
  accept?: string
  maxSize?: number
  multiple?: boolean
  /** 同时上传的文件数上限，超出的排队等待。 */
  concurrency?: number
  /** 业务上传实现：拿到文件与 AbortSignal，返回进度回调。 */
  uploader?: (file: File, signal: AbortSignal, onProgress: (value: number) => void) => Promise<void>
  label: string
  className?: string
}) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const controllers = useRef(new Map<string, AbortController>())

  function accept_(list: FileList | null) {
    if (!list?.length) return
    const additions = Array.from(list)
      .slice(0, multiple ? undefined : 1)
      .map((file) => {
        const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
        const typeOk =
          !accept || accept.split(',').some((item) => item.trim().toLowerCase() === ext)
        const error = !typeOk
          ? t('fileUpload.typeError', { accept })
          : file.size > maxSize
            ? t('fileUpload.sizeError', { size: formatSize(maxSize) })
            : undefined
        const controller = new AbortController()
        const entry: UploadFile = {
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          size: file.size,
          progress: error ? 0 : 100,
          error,
          status: error ? 'failed' : 'pending',
        }
        if (uploader && !error) {
          const id = entry.id
          controllers.current.set(id, controller)
          entry.status = 'uploading'
          void uploader(file, controller.signal, (value) => {
            onFilesChange(
              files.map((item) => (item.id === id ? { ...item, progress: value } : item)),
            )
          })
            .then(() =>
              onFilesChange(
                files.map((item) => (item.id === id ? { ...item, status: 'done' } : item)),
              ),
            )
            .catch((failure: unknown) => {
              const aborted = (failure as Error)?.name === 'AbortError'
              onFilesChange(
                files.map((item) =>
                  item.id === id
                    ? aborted
                      ? { ...item, status: 'pending', progress: 0 }
                      : { ...item, status: 'failed', error: '上传失败，请重试' }
                    : item,
                ),
              )
            })
            .finally(() => controllers.current.delete(id))
        }
        return entry
      })
    onFilesChange(multiple ? [...files, ...additions] : additions)
  }

  return (
    <div data-slot="file-upload" className={cn('space-y-3', className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => input.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            input.current?.click()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          accept_(event.dataTransfer.files)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm',
          'hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
          dragging && 'border-primary bg-accent/50',
        )}
      >
        <UploadCloud aria-hidden="true" className="size-6 text-muted-foreground" />
        <span>{t('fileUpload.hint')}</span>
        <span className="text-xs text-muted-foreground">
          {accept ? `${accept} · ` : ''}
          {t('fileUpload.limit', { size: formatSize(maxSize) })}
        </span>
        <input
          ref={input}
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          onChange={(event) => {
            accept_(event.target.files)
            event.target.value = ''
          }}
        />
      </div>
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file.id} className="rounded-lg border p-2.5">
              <div className="flex items-center gap-2">
                <FileUp aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatSize(file.size)}
                </span>
                {file.status === 'uploading' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      controllers.current.get(file.id)?.abort()
                      onFilesChange(files.filter((item) => item.id !== file.id))
                    }}
                  >
                    {t('cancel')}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`${t('sample.remove')} ${file.name}`}
                  onClick={() => onFilesChange(files.filter((item) => item.id !== file.id))}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
              {file.error ? (
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-xs text-destructive">{file.error}</p>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() =>
                      onFilesChange(
                        files.map((item) =>
                          item.id === file.id
                            ? { ...item, error: undefined, status: 'pending', progress: 0 }
                            : item,
                        ),
                      )
                    }
                  >
                    {t('retry')}
                  </button>
                </div>
              ) : (
                <div className="mt-2 space-y-1">
                  <Progress value={file.progress} label={file.name} />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {file.status === 'uploading'
                        ? t('fileUpload.uploading')
                        : file.status === 'done'
                          ? t('fileUpload.done')
                          : t('fileUpload.pending')}
                    </span>
                    <span>{t('fileUpload.concurrent', { count: concurrency })}</span>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

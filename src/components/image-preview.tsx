import { useRef, useState, type ReactNode } from 'react'
import { Maximize2, Minus, Plus, RotateCcw } from 'lucide-react'
import { useUiTranslation } from '../lib/use-ui-translation'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog'
import { cn } from '@/lib/utils'

/** 图片预览：点击缩略图放大，Esc 关闭。 */
export function ImagePreview({
  src,
  alt,
  images,
  children,
}: {
  src: string
  alt: string
  /** 传入多张图时可在预览里左右切换；不传则只看 src。 */
  images?: { src: string; alt: string }[]
  /** 缩略图内容，默认直接渲染图片。 */
  children?: ReactNode
}) {
  const { t } = useUiTranslation()
  const [open, setOpen] = useState(false)
  const list = images?.length ? images : [{ src, alt }]
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; origin: { x: number; y: number } } | null>(null)
  const current = list[Math.min(index, list.length - 1)] ?? { src, alt }
  return (
    <>
      <button
        type="button"
        aria-label={`${t('imagePreview.open')} ${alt}`}
        className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        onClick={() => setOpen(true)}
      >
        {children ?? <img src={src} alt={alt} className="max-h-32 rounded-lg border" />}
      </button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }
        }}
      >
        <DialogContent className="h-[min(88dvh,56rem)] grid-rows-[1fr] overflow-hidden p-0 sm:max-w-[min(92vw,80rem)] [&_[data-slot=dialog-close]]:top-5 [&_[data-slot=dialog-close]]:right-5 [&_[data-slot=dialog-close]]:rounded-md [&_[data-slot=dialog-close]]:p-2">
          <DialogTitle className="sr-only">{current.alt}</DialogTitle>
          <DialogDescription className="sr-only">{t('imagePreview.hint')}</DialogDescription>
          <div className="absolute top-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border bg-background/90 p-1.5 shadow-sm backdrop-blur">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={t('imagePreview.zoomOut')}
              disabled={zoom <= 0.5}
              onClick={() => {
                setZoom((value) => Math.max(0.5, value - 0.25))
                setPan({ x: 0, y: 0 })
              }}
            >
              <Minus aria-hidden="true" />
            </Button>
            <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={t('imagePreview.zoomIn')}
              disabled={zoom >= 3}
              onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
            >
              <Plus aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={t('imagePreview.resetZoom')}
              onClick={() => {
                setZoom(1)
                setPan({ x: 0, y: 0 })
              }}
            >
              <RotateCcw aria-hidden="true" />
            </Button>
          </div>
          <div className="flex min-h-0 items-center justify-center overflow-hidden px-6 pt-20 pb-6">
            <img
              src={current.src}
              alt={current.alt}
              style={{ scale: String(zoom), translate: `${pan.x}px ${pan.y}px` }}
              draggable={false}
              onPointerDown={(event) => {
                if (zoom <= 1) return
                event.currentTarget.setPointerCapture(event.pointerId)
                drag.current = { x: event.clientX, y: event.clientY, origin: pan }
              }}
              onPointerMove={(event) => {
                if (!drag.current) return
                setPan({
                  x: drag.current.origin.x + (event.clientX - drag.current.x),
                  y: drag.current.origin.y + (event.clientY - drag.current.y),
                })
              }}
              onPointerUp={() => {
                drag.current = null
              }}
              onDoubleClick={() => {
                setZoom((value) => (value === 1 ? 2 : 1))
                setPan({ x: 0, y: 0 })
              }}
              className={cn(
                'h-full w-full select-none rounded-lg object-contain transition-transform',
                zoom > 1 && 'cursor-grab active:cursor-grabbing',
              )}
            />
          </div>
          {list.length > 1 && (
            <div className="absolute inset-x-6 bottom-4 flex items-center justify-between gap-3 rounded-xl border bg-background/90 p-2 shadow-sm backdrop-blur">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={index === 0}
                onClick={() => setIndex((value) => Math.max(0, value - 1))}
              >
                {t('previous')}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t('imagePreview.position', { current: index + 1, total: list.length })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={index >= list.length - 1}
                onClick={() => setIndex((value) => Math.min(list.length - 1, value + 1))}
              >
                {t('next')}
              </Button>
            </div>
          )}
          <p className="sr-only">
            <Maximize2 aria-hidden="true" />
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}

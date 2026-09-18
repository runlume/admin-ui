import { useRef, useState, type ReactNode } from 'react'
import { Maximize2, Minus, Plus, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogTitle className="sr-only">{current.alt}</DialogTitle>
          <DialogDescription className="sr-only">{t('imagePreview.hint')}</DialogDescription>
          <div className="flex items-center justify-end gap-1">
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
          <div className="flex max-h-[70dvh] items-center justify-center overflow-auto">
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
              className={cn(
                'max-w-full rounded-lg object-contain transition-transform',
                zoom > 1 && 'cursor-grab active:cursor-grabbing',
              )}
            />
          </div>
          {list.length > 1 && (
            <div className="flex items-center justify-between gap-3">
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

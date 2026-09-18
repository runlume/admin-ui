import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export function TableCellOverflow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [fullText, setFullText] = useState('')
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const measure = () => {
      const clipped = [node, ...node.querySelectorAll<HTMLElement>('*')].some(
        (item) => item.clientWidth > 0 && item.scrollWidth > item.clientWidth + 1,
      )
      setFullText(clipped ? node.innerText : '')
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [children])
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div ref={ref} tabIndex={fullText ? 0 : undefined} className="table-cell-overflow">
          {children}
        </div>
      </TooltipTrigger>
      {fullText && (
        <TooltipContent className="max-w-[min(32rem,calc(100vw-2rem))] whitespace-pre-wrap break-words">
          {fullText}
        </TooltipContent>
      )}
    </Tooltip>
  )
}

import type { ComponentProps } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PageButton({
  direction,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, 'size' | 'variant' | 'asChild'> & {
  direction: 'previous' | 'next'
}) {
  return (
    <Button {...props} variant="outline" size="sm">
      {direction === 'previous' && <ArrowLeft aria-hidden="true" className="size-3.5" />}
      {children}
      {direction === 'next' && <ArrowRight aria-hidden="true" className="size-3.5" />}
    </Button>
  )
}

import { cva } from 'class-variance-authority'

/** 标签配色，和语义 Token 一一对应。 */
export const tagVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        default: 'border-transparent bg-muted text-muted-foreground',
        primary: 'border-transparent bg-primary/12 text-primary',
        success: 'border-transparent bg-success-soft text-success',
        warning: 'border-transparent bg-warning-soft text-warning',
        danger: 'border-transparent bg-danger-soft text-danger',
        outline: 'border-border bg-transparent text-foreground',
      },
    },
    defaultVariants: { tone: 'default' },
  },
)

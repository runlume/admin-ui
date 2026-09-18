import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from '@/components/status-badge'
import '@/lib/i18n'

describe('StatusBadge', () => {
  it('已知状态使用对应文案', () => {
    render(<StatusBadge status="ACTIVE" />)
    expect(screen.getByText('正常')).toBeInTheDocument()
  })

  it('未知状态回落到未知文案而不是显示原始编码', () => {
    const { container } = render(<StatusBadge status="WEIRD" />)
    expect(screen.getByText('未知')).toBeInTheDocument()
    expect(container.firstElementChild?.className).toContain('bg-unknown-soft text-unknown')
  })

  it('暂停、停用、未启用、未知各自使用互不相同的语义色', () => {
    const expected = {
      SUSPENDED: 'bg-suspended-soft text-suspended',
      DISABLED: 'bg-disabled-soft text-disabled',
      INACTIVE: 'bg-inactive-soft text-inactive',
      UNKNOWN: 'bg-unknown-soft text-unknown',
    } as const
    const rendered = Object.entries(expected).map(([status, tone]) => {
      const { container, unmount } = render(<StatusBadge status={status} />)
      const className = container.firstElementChild?.className ?? ''
      unmount()
      expect(className).toContain(tone)
      return className
    })
    expect(new Set(rendered).size).toBe(rendered.length)
  })
})

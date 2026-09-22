import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Calendar } from '@/components/calendar'
import { Rate } from '@/components/rate'
import { ResizablePanel } from '@/components/resizable-panel'
import { SortableList } from '@/components/sortable-list'
import { Transfer } from '@/components/transfer'
import '@/lib/i18n'

describe('新增高级组件', () => {
  it('穿梭框把选中项移到目标列表', () => {
    const change = vi.fn()
    render(
      <Transfer items={[{ value: 'viewer', label: '查看者' }]} value={[]} onValueChange={change} />,
    )
    fireEvent.click(screen.getByRole('checkbox', { name: '查看者' }))
    fireEvent.click(screen.getByRole('button', { name: '移动到已选项' }))
    expect(change).toHaveBeenCalledWith(['viewer'])
  })

  it('评分支持半星与键盘调整', () => {
    const change = vi.fn()
    render(<Rate value={3.5} precision={0.5} onValueChange={change} label="服务评分" />)
    fireEvent.keyDown(screen.getByRole('slider', { name: '服务评分' }), { key: 'ArrowRight' })
    expect(change).toHaveBeenCalledWith(4)
  })

  it('日历选择日期', () => {
    const change = vi.fn()
    render(<Calendar value="2026-09-22" onValueChange={change} />)
    fireEvent.click(screen.getByRole('button', { name: /2026年9月23日/ }))
    expect(change).toHaveBeenCalledWith('2026-09-23')
  })

  it('分割面板支持键盘调整', () => {
    const change = vi.fn()
    render(<ResizablePanel first="左" second="右" defaultSize={50} onSizeChange={change} />)
    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowRight' })
    expect(change).toHaveBeenCalledWith(55)
  })

  it('排序列表支持键盘下移', () => {
    const change = vi.fn()
    render(
      <SortableList
        items={[{ id: 'a' }, { id: 'b' }]}
        onReorder={change}
        renderItem={(item) => item.id}
      />,
    )
    fireEvent.keyDown(screen.getByRole('button', { name: /拖动第 1 项/ }), { key: 'ArrowDown' })
    expect(change.mock.calls[0]?.[0].map((item: { id: string }) => item.id)).toEqual(['b', 'a'])
  })
})

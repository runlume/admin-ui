import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EditableTable } from '@/components/editable-table'
import '@/lib/i18n'

const columns = [
  { key: 'name', label: '客户名称' },
  { key: 'owner', label: '负责人' },
]
const defaultRows = [{ id: 'row-1', values: { name: '清源环保科技', owner: '张伟' } }]

describe('EditableTable', () => {
  it('只读行显示文本与图标操作，不含输入框', () => {
    render(<EditableTable columns={columns} defaultRows={defaultRows} />)
    expect(screen.getByText('清源环保科技')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('清源环保科技')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '编辑第 1 行' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '删除第 1 行' })).toBeInTheDocument()
  })

  it('编辑后改内容并保存，会把新值回调出去', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EditableTable columns={columns} defaultRows={defaultRows} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: '编辑第 1 行' }))
    const name = screen.getByLabelText('客户名称（第 1 行）')
    await user.clear(name)
    await user.type(name, '云和智能制造')
    await user.click(screen.getByRole('button', { name: '保存第 1 行' }))

    expect(screen.getByText('云和智能制造')).toBeInTheDocument()
    expect(onChange).toHaveBeenLastCalledWith([
      { id: 'row-1', values: { name: '云和智能制造', owner: '张伟' } },
    ])
  })

  it('取消编辑不写回原值', async () => {
    const user = userEvent.setup()
    render(<EditableTable columns={columns} defaultRows={defaultRows} />)

    await user.click(screen.getByRole('button', { name: '编辑第 1 行' }))
    const name = screen.getByLabelText('客户名称（第 1 行）')
    await user.clear(name)
    await user.type(name, '临时改动')
    await user.click(screen.getByRole('button', { name: '取消第 1 行' }))

    expect(screen.getByText('清源环保科技')).toBeInTheDocument()
    expect(screen.queryByText('临时改动')).not.toBeInTheDocument()
  })

  it('新增行默认处于编辑态，取消即丢弃', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EditableTable columns={columns} defaultRows={defaultRows} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: '新增一行' }))
    expect(screen.getByLabelText('客户名称（第 2 行）')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '取消第 2 行' }))
    expect(screen.queryByLabelText('客户名称（第 2 行）')).not.toBeInTheDocument()
    expect(onChange).toHaveBeenLastCalledWith(defaultRows)
  })

  it('删除行后只剩新增入口', async () => {
    const user = userEvent.setup()
    render(<EditableTable columns={columns} defaultRows={defaultRows} />)

    await user.click(screen.getByRole('button', { name: '删除第 1 行' }))
    expect(screen.queryByText('清源环保科技')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新增一行' })).toBeInTheDocument()
  })
})

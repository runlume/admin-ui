import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table'
import '@/lib/i18n'

type Row = { id: string; name: string }

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'id', header: 'ID', size: 120 },
  { accessorKey: 'name', header: '名称' },
]

describe('DataTable', () => {
  it('渲染数据行', () => {
    render(<DataTable data={[{ id: 'A-1', name: '示例' }]} columns={columns} caption="示例表格" />)
    expect(screen.getByText('A-1')).toBeInTheDocument()
    expect(screen.getByText('示例')).toBeInTheDocument()
  })

  it('空数据展示空态而不是伪造行数', () => {
    render(<DataTable data={[]} columns={columns} caption="示例表格" />)
    expect(screen.getByText('暂无数据')).toBeInTheDocument()
  })
})

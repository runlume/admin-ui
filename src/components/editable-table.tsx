import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Check, Plus, SquarePen, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type EditableTableColumn = {
  key: string
  label: string
  /** 行内编辑控件：文本（默认）、数字、日期、下拉、开关。 */
  type?: 'text' | 'number' | 'date' | 'select' | 'switch'
  placeholder?: string
  /** type=select 时的选项 */
  options?: { value: string; label: string }[]
}

export type EditableTableValue = { id: string; values: Record<string, string> }

type Row = EditableTableValue & { editing: boolean; draft: Record<string, string>; isNew: boolean }

/**
 * 可编辑表格：行内编辑 + 逐行新增/删除。
 *
 * 只读行显示文本与「编辑 / 删除」，进入编辑态后变成输入框与「保存 / 取消」；
 * 底部整行是「新增一行」，新行默认就在编辑态（取消则直接丢弃）。
 * 表格本身只管结构与交互，提交给业务由 `onChange` 接收已保存的行。
 */
/** 行内编辑控件：按列的类型切换，宽度都由单元格控制。 */
function Field({
  id,
  column,
  index,
  value,
  onChange,
}: {
  id: string
  column: EditableTableColumn
  index: number
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const label = t('editableTable.cellLabel', { column: column.label, index: index + 1 })
  switch (column.type) {
    case 'select':
      return (
        <NativeSelect
          id={id}
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{t('editableTable.emptyCell')}</option>
          {column.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      )
    case 'switch':
      return (
        <Switch
          id={id}
          aria-label={label}
          checked={value === 'true'}
          onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
        />
      )
    case 'date':
    case 'number':
      return (
        <Input
          id={id}
          type={column.type}
          className="h-9"
          aria-label={label}
          placeholder={column.placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )
    default:
      return (
        <Input
          id={id}
          className="h-9"
          aria-label={label}
          placeholder={column.placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )
  }
}

/** 只读态：下拉显示选项文案，开关显示启用/停用，其余直接显示原值。 */
function CellValue({ column, value }: { column: EditableTableColumn; value: string }) {
  const { t } = useTranslation()
  if (column.type === 'switch') {
    return (
      <span className={cn('text-sm', value !== 'true' && 'text-muted-foreground')}>
        {value === 'true' ? t('editableTable.on') : t('editableTable.off')}
      </span>
    )
  }
  const text =
    column.type === 'select' ? column.options?.find((o) => o.value === value)?.label : value
  return (
    <span className={cn(!text && 'text-muted-foreground')}>
      {text || t('editableTable.emptyCell')}
    </span>
  )
}

export function EditableTable({
  columns,
  defaultRows = [],
  onChange,
  maxRows,
  stickyActions = true,
  className,
}: {
  columns: EditableTableColumn[]
  defaultRows?: EditableTableValue[]
  onChange?: (rows: EditableTableValue[]) => void
  /** 行数超过这个值时表格内部纵向滚动（表头吸顶）。不传就不限高，不出现纵向滚动条。 */
  maxRows?: number
  /** 操作列固定在右侧：列多时左侧横向滚动，操作按钮始终可见。默认开启。 */
  stickyActions?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const [rows, setRows] = useState<Row[]>(() =>
    defaultRows.map((row) => ({
      ...row,
      editing: false,
      draft: row.values,
      isNew: false,
    })),
  )
  const seq = useRef(0)
  const pendingFocus = useRef<string | null>(null)

  // 新增行后把焦点送进第一个输入框，键盘用户不用再 Tab 过去
  useEffect(() => {
    if (!pendingFocus.current) return
    const first = columns[0]
    const node = first ? document.getElementById(`${pendingFocus.current}-${first.key}`) : null
    pendingFocus.current = null
    if (node instanceof HTMLInputElement) node.focus()
  })

  function commit(next: Row[]) {
    setRows(next)
    onChange?.(next.map(({ id, values }) => ({ id, values })))
  }

  function addRow() {
    seq.current += 1
    const id = `new-${seq.current}`
    pendingFocus.current = id
    commit([...rows, { id, values: {}, draft: {}, editing: true, isNew: true }])
  }

  function startEdit(id: string) {
    commit(rows.map((row) => (row.id === id ? { ...row, editing: true, draft: row.values } : row)))
  }

  function saveRow(id: string) {
    commit(
      rows.map((row) =>
        row.id === id ? { ...row, editing: false, values: row.draft, isNew: false } : row,
      ),
    )
  }

  function cancelRow(id: string) {
    // 新行没保存过内容，取消就直接丢弃
    const target = rows.find((row) => row.id === id)
    if (target?.isNew) {
      commit(rows.filter((row) => row.id !== id))
      return
    }
    commit(rows.map((row) => (row.id === id ? { ...row, editing: false, draft: row.values } : row)))
  }

  function removeRow(id: string) {
    commit(rows.filter((row) => row.id !== id))
  }

  function editValue(id: string, key: string, value: string) {
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, draft: { ...row.draft, [key]: value } } : row,
      ),
    )
  }

  return (
    // 与标准表格同一套外壳：边框、圆角、表头底色都来自 Table 原语。
    // 滚动只发生在内层容器上：横向总是可滚；纵向仅在传了 maxRows 时才出现，表头吸顶。
    <div
      className={cn(
        'data-table flex flex-col overflow-hidden rounded-lg border border-table-border bg-card',
        '[&>[data-slot=table-container]]:overflow-x-auto',
        '[&_[data-slot=table-header]]:sticky [&_[data-slot=table-header]]:top-0 [&_[data-slot=table-header]]:z-10',
        maxRows && '[&>[data-slot=table-container]]:max-h-(--editable-table-max-height)',
        className,
      )}
      style={
        maxRows
          ? ({ '--editable-table-max-height': `${maxRows * 45 + 45}px` } as CSSProperties)
          : undefined
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
            <TableHead
              className={cn(
                'w-px whitespace-nowrap text-left',
                stickyActions && 'sticky right-0 z-10 border-l border-table-border bg-table-header',
              )}
            >
              {t('sample.columnActions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.id} className="group/row" data-editing={row.editing || undefined}>
              {columns.map((column) => (
                <TableCell key={column.key} className="align-middle">
                  {row.editing ? (
                    <Field
                      id={`${row.id}-${column.key}`}
                      column={column}
                      index={index}
                      value={row.draft[column.key] ?? ''}
                      onChange={(value) => editValue(row.id, column.key, value)}
                    />
                  ) : (
                    <CellValue column={column} value={row.values[column.key] ?? ''} />
                  )}
                </TableCell>
              ))}
              <TableCell
                className={cn(
                  stickyActions &&
                    'sticky right-0 z-10 border-l border-table-border bg-card group-hover/row:bg-table-hover',
                )}
              >
                <div className="flex justify-start gap-2">
                  {row.editing ? (
                    <>
                      <Button
                        type="button"
                        size="icon-sm"
                        onClick={() => saveRow(row.id)}
                        aria-label={t('editableTable.saveRow', { index: index + 1 })}
                        title={t('save')}
                      >
                        <Check aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        onClick={() => cancelRow(row.id)}
                        aria-label={t('editableTable.cancelRow', { index: index + 1 })}
                        title={t('cancel')}
                      >
                        <X aria-hidden="true" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        onClick={() => startEdit(row.id)}
                        aria-label={t('editableTable.editRow', { index: index + 1 })}
                        title={t('editableTable.edit')}
                      >
                        <SquarePen aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        // 删除用淡底 + 语义红，和相邻的编辑按钮区分开，但不到实心红那么重
                        className="border-danger/25 bg-danger-soft text-danger hover:border-danger/40 hover:bg-danger/12 hover:text-danger"
                        onClick={() => removeRow(row.id)}
                        aria-label={t('editableTable.removeRow', { index: index + 1 })}
                        title={t('editableTable.remove')}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={columns.length + 1} className="p-0">
              <button
                type="button"
                onClick={addRow}
                className="flex h-11 w-full items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Plus aria-hidden="true" className="size-4" />
                {t('editableTable.addRow')}
              </button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

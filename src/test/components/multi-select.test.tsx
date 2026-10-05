import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MultiSelect } from '@/components/multi-select'

afterEach(cleanup)
const options = [{ value: 'en', label: 'English · en' }]
it('creates a custom option with Enter and keeps it selected alongside presets', () => {
  function Host() {
    const [values, setValues] = useState(['en'])
    const [items, setItems] = useState(options)
    return (
      <MultiSelect
        label="Languages"
        options={items}
        values={values}
        onValuesChange={setValues}
        onCreate={(value) => {
          setItems([...items, { value, label: value }])
          setValues([...values, value])
        }}
        canCreate={(value) => value === 'eo'}
      />
    )
  }
  render(<Host />)
  fireEvent.click(screen.getByRole('combobox', { name: 'Languages' }))
  const search = screen.getByRole('textbox', { name: 'Languages' })
  fireEvent.change(search, { target: { value: 'eo' } })
  fireEvent.keyDown(search, { key: 'Enter' })
  expect(search).toHaveValue('')
  expect(screen.getByRole('checkbox', { name: 'eo' })).toBeChecked()
  expect(screen.getByRole('combobox')).toHaveTextContent('English · en')
  expect(screen.getByRole('combobox')).toHaveTextContent('eo')
})
it('rejects invalid or duplicate values and closes when disabled during an open selection', () => {
  const create = vi.fn()
  const props = {
    label: 'Languages',
    options,
    values: ['en'],
    onValuesChange: vi.fn(),
    onCreate: create,
    canCreate: (value: string) => value === 'eo',
  }
  const { rerender } = render(<MultiSelect {...props} />)
  fireEvent.click(screen.getByRole('combobox'))
  const search = screen.getByRole('textbox')
  for (const value of ['EN', 'invalid']) {
    fireEvent.change(search, { target: { value } })
    fireEvent.keyDown(search, { key: 'Enter' })
  }
  expect(create).not.toHaveBeenCalled()
  rerender(<MultiSelect {...props} disabled />)
  expect(screen.getByRole('combobox')).toBeDisabled()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false')
  rerender(<MultiSelect {...props} />)
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('combobox'))
  expect(screen.getByRole('textbox')).toHaveValue('')
})

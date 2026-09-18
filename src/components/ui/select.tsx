import { useTranslation } from 'react-i18next'
import { NativeSelect } from './native-select'

export function Select({
  id,
  name,
  value,
  onValueChange,
  options,
  disabled,
  clearable = false,
}: {
  id: string
  name?: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
  /** 提供"清空"选项，选中后回传空字符串。 */
  clearable?: boolean
}) {
  const { t } = useTranslation()
  return (
    <NativeSelect
      id={id}
      name={name}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      disabled={disabled}
    >
      {clearable && <option value="">{t('clear')}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </NativeSelect>
  )
}

import { useUiTranslation } from '../lib/use-ui-translation'
import { describePresetValue } from '@/lib/presets'
import { StorageBox } from './storage-box'

/**
 * 筛选预设：储物箱在"筛选条件"场景的语义化封装，保持既有调用方 API 不变。
 */
export function FilterPresets<T>({
  storageId,
  value,
  onApply,
  summary,
}: {
  storageId: string
  value: T
  onApply: (value: T) => void
  /** 列表里的摘要文案；不传时用通用格式化（键: 值 · 键: 值） */
  summary?: (value: T) => string
}) {
  const { t } = useUiTranslation()
  return (
    <StorageBox
      title={t('presets')}
      storageId={`filter.${storageId}`}
      snapshot={value}
      onRestore={onApply}
      summary={summary ?? ((snapshot) => describePresetValue(snapshot))}
    />
  )
}

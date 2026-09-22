// oxlint-disable react/only-export-components -- package module intentionally exports its provider and hook together
import { createContext, useCallback, useContext, type ReactNode } from 'react'

export type UiTranslate = (key: string, options?: Record<string, unknown>) => unknown

const TranslationContext = createContext<{ language: string; translate?: UiTranslate }>({
  language: 'zh-CN',
})

const fallbackMessages: Record<string, string> = {
  ACTIVE: '正常',
  DISABLED: '已停用',
  FAILED: '失败',
  INACTIVE: '未启用',
  PENDING: '待处理',
  PROCESSING: '处理中',
  SUSPENDED: '已暂停',
  UNKNOWN: '未知',
  backHome: '返回工作台',
  cancel: '取消',
  clear: '清空',
  close: '关闭',
  columns: '列',
  confirm: '确定',
  copy: '复制',
  empty: '暂无数据',
  emptyDescription: '当前条件下没有可展示的记录。',
  'editableTable.addRow': '新增一行',
  'editableTable.cancelRow': '取消第 {{index}} 行',
  'editableTable.cellLabel': '{{column}}（第 {{index}} 行）',
  'editableTable.edit': '编辑',
  'editableTable.editRow': '编辑第 {{index}} 行',
  'editableTable.remove': '删除',
  'editableTable.removeRow': '删除第 {{index}} 行',
  'editableTable.saveRow': '保存第 {{index}} 行',
  forbidden: '没有访问权限',
  forbiddenDescription: '当前账号没有这个页面的权限，需要开通请联系系统管理员。',
  loading: '加载中',
  next: '下一页',
  previous: '上一页',
  retry: '重试',
  'sample.columnActions': '操作',
  search: '搜索',
}

function fallbackFor(key: string) {
  const value = fallbackMessages[key] ?? key.split('.').at(-1) ?? key
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (character) => character.toUpperCase())
}

function interpolate(value: string, options?: Record<string, unknown>) {
  return value.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(options?.[key] ?? ''))
}

export function AdminUiProvider({
  children,
  language = 'zh-CN',
  translate,
}: {
  children: ReactNode
  language?: string
  translate?: UiTranslate
}) {
  return (
    <TranslationContext.Provider value={{ language, translate }}>
      {children}
    </TranslationContext.Provider>
  )
}

/** Keeps controls readable without requiring an i18n provider from the host app. */
export function useUiTranslation() {
  const { language, translate } = useContext(TranslationContext)
  const t = useCallback(
    (key: string, options?: Record<string, unknown>) => {
      const translated = translate?.(key, options)
      return translated === undefined || translated === key
        ? interpolate(fallbackFor(key), options)
        : String(translated)
    },
    [translate],
  )

  return { i18n: { language }, t }
}

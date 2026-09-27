import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { shellEn, shellZh } from '@/lib/shell-messages'

/**
 * 测试用的 i18n 实例：只用组件库自带的文案资源，
 * 保证组件在宿主还没接入自己的语言包时也能渲染出可读文案。
 */
void i18n.use(initReactI18next).init({
  resources: { 'zh-CN': { translation: shellZh }, en: { translation: shellEn } },
  lng: 'zh-CN',
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false },
})

export default i18n

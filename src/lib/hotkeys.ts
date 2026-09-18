import { useEffect } from 'react'

/**
 * 应用级快捷键注册：
 * 支持连续按键（如 `g d`）与组合键（`mod+k`），在输入框内自动让行。
 */
export type Hotkey = {
  /** 形如 `g d`、`mod+k`、`esc`。mod = ⌘ / Ctrl。 */
  combo: string
  handler: () => void
  /** 是否在输入框聚焦时也触发，默认不触发。 */
  allowInInput?: boolean
}

const sequenceTimeout = 1200

function isTyping(target: EventTarget | null) {
  const element = target as HTMLElement | null
  if (!element) return false
  const tag = element.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable
}

function matches(event: KeyboardEvent, combo: string) {
  const parts = combo.toLowerCase().split('+')
  const key = parts[parts.length - 1] ?? ''
  const needsMod = parts.includes('mod')
  const needsShift = parts.includes('shift')
  if (needsMod !== (event.metaKey || event.ctrlKey)) return false
  if (needsShift !== event.shiftKey) return false
  if (parts.length > 1 || key.length > 1) return event.key.toLowerCase() === key
  return event.key.toLowerCase() === key
}

export function useHotkeys(hotkeys: Hotkey[]) {
  useEffect(() => {
    let pending = ''
    let timer = 0
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.repeat) return
      const typing = isTyping(event.target)
      for (const hotkey of hotkeys) {
        if (!hotkey.allowInInput && typing) continue
        if (!matches(event, hotkey.combo)) continue
        event.preventDefault()
        hotkey.handler()
        pending = ''
        return
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1) {
        pending = ''
        return
      }
      pending = `${pending}${event.key.toLowerCase()}`.slice(-4)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        pending = ''
      }, sequenceTimeout)
      for (const hotkey of hotkeys) {
        const combo = hotkey.combo.toLowerCase().replaceAll(' ', '')
        if (combo === pending) {
          event.preventDefault()
          hotkey.handler()
          pending = ''
          return
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(timer)
    }
  }, [hotkeys])
}

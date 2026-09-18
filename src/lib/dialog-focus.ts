export function avoidInitialCloseFocus(event: Event) {
  const content = event.target
  if (!(content instanceof HTMLElement)) return
  // Let Radix pick the form's initial focus, then replace only its close-button fallback.
  queueMicrotask(() => {
    const focused = content.ownerDocument.activeElement
    if (
      content.isConnected &&
      focused instanceof HTMLElement &&
      content.contains(focused) &&
      focused.matches('[data-slot="dialog-close"], [data-slot="sheet-close"]')
    ) {
      content.focus({ preventScroll: true })
    }
  })
}

import { useEffect, useRef } from 'react'

/** Keep keyboard interaction inside an open modal and return it to its opener. */
export function useDialogFocus(open: boolean, close: () => void) {
  const dialog = useRef<HTMLElement>(null)
  const closeRef = useRef(close)
  closeRef.current = close

  useEffect(() => {
    const panel = dialog.current
    if (!open || panel === null) return
    const document = panel.ownerDocument
    const window = document.defaultView
    if (window === null) return
    const opener = document.activeElement as HTMLElement | null
    panel.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return
      if (event.key === 'Escape' && !event.shiftKey) {
        event.preventDefault()
        event.stopPropagation()
        if (!event.repeat) closeRef.current()
      } else if (event.key === 'Tab') {
        const controls = [...panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
        )].filter(control => control.getClientRects().length > 0 && control.tabIndex >= 0)
        const first = controls[0]
        const last = controls.at(-1)
        const active = document.activeElement
        if (first === undefined) {
          event.preventDefault()
          panel.focus()
        } else if (event.shiftKey && (active === first || active === panel || !panel.contains(active))) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && (active === last || active === panel || !panel.contains(active))) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    // Consume inside the owned panel before native parent-modal document listeners.
    panel.addEventListener('keydown', onKeyDown)
    return () => {
      panel.removeEventListener('keydown', onKeyDown)
      if (opener?.isConnected && typeof opener.focus === 'function') opener.focus()
    }
  }, [open])

  return dialog
}

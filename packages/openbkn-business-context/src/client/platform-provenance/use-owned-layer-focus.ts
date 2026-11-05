import { useEffect, useRef } from 'react'

/** Keep an embedded modal's keyboard boundary inside the native DSH viewer. */
export function useOwnedLayerFocus(
  element: HTMLElement | null,
  open: boolean,
  onClose: () => void,
  { focus = true, trigger, trapFocus = true }: { focus?: boolean; trigger?: HTMLElement | null; trapFocus?: boolean } = {},
): void {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open || !element?.isConnected) return
    const document = element.ownerDocument
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return
      if (event.key === 'Escape' && !event.shiftKey) {
        event.preventDefault()
        event.stopPropagation()
        if (!event.repeat) close.current()
      } else if (event.key === 'Tab' && trapFocus) {
        const controls = [...element.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
        )].filter(control => control.getClientRects().length > 0 && control.tabIndex >= 0 && !control.closest('[hidden], [inert], [aria-hidden="true"]'))
        const active = document.activeElement
        const first = controls[0]
        const last = controls.at(-1)
        if (!first || active === element || !element.contains(active) || (event.shiftKey ? active === first : active === last)) {
          event.preventDefault()
          event.stopPropagation()
          const next = event.shiftKey ? last : first
          ;(next ?? element).focus({preventScroll:true})
        }
      }
    }
    // React's root listener can run after the outer native modal listener.
    // The preview trigger also owns Escape when a hover preview is open.
    const targets = new Set([element, ...(trigger ? [trigger] : [])])
    for (const target of targets) target.addEventListener('keydown', onKeyDown)
    if (focus) element.focus({preventScroll:true})
    return () => {
      for (const target of targets) target.removeEventListener('keydown', onKeyDown)
      const active = document.activeElement
      if ((element.contains(active) || active === document.body) && previous?.isConnected) previous.focus({preventScroll:true})
    }
  }, [element, open, focus, trigger, trapFocus])
}

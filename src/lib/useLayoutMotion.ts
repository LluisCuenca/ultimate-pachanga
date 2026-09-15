import { useLayoutEffect, useRef } from 'react'
import { allowsMotion } from './useAppMotion'

/** Animate real placement updates, including rollback, independently of saving. */
export function useLayoutMotion(revision: string) {
  const root = useRef<HTMLDivElement>(null)
  const previous = useRef(new Map<string, { x: number; y: number }>())
  useLayoutEffect(() => {
    const container = root.current
    if (!container) return
    const bounds = container.getBoundingClientRect()
    const next = new Map<string, { x: number; y: number }>()
    const animations: Animation[] = []
    container
      .querySelectorAll<HTMLElement>('[data-motion-key]')
      .forEach((element) => {
        const rect = element.getBoundingClientRect()
        const position = {
          x: rect.left - bounds.left,
          y: rect.top - bounds.top,
        }
        const key = element.dataset.motionKey!
        const before = previous.current.get(key)
        next.set(key, position)
        if (!element.animate || !allowsMotion() || previous.current.size === 0)
          return
        const dx = before ? before.x - position.x : 0
        const dy = before ? before.y - position.y : 0
        if (before && Math.abs(dx) + Math.abs(dy) < 1) return
        animations.push(
          element.animate(
            before && Math.hypot(dx, dy) < window.innerHeight * 0.75
              ? [{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }]
              : [{ opacity: 0.3 }, { opacity: 1 }],
            { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' },
          ),
        )
      })
    previous.current = next
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const cancel = () => animations.forEach((animation) => animation.cancel())
    media?.addEventListener('change', cancel)
    return () => {
      cancel()
      media?.removeEventListener('change', cancel)
    }
  }, [revision])
  return root
}

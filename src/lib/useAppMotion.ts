import { useEffect, useRef } from 'react'
import { useNavigationType } from 'react-router'

export function allowsMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Feedback is cancelled on scrolling; navigation never waits for an animation. */
export function useAppMotion(pathname: string) {
  const visited = useRef(new Set<string>())
  const navigationType = useNavigationType()
  useEffect(() => {
    let pressed: HTMLElement | null = null
    let origin = { x: 0, y: 0 }
    const release = () => {
      pressed?.removeAttribute('data-pressed')
      pressed = null
    }
    const down = (event: PointerEvent) => {
      release()
      if (event.button !== 0 || !(event.target instanceof Element)) return
      pressed = event.target.closest<HTMLElement>(
        'button:not(:disabled), a[href]',
      )
      if (pressed?.closest('.pitch-surface')) {
        pressed = null
        return
      }
      origin = { x: event.clientX, y: event.clientY }
      pressed?.setAttribute('data-pressed', 'true')
    }
    const move = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8)
        release()
    }
    document.addEventListener('pointerdown', down, { passive: true })
    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerup', release)
    document.addEventListener('pointercancel', release)
    window.addEventListener('blur', release)
    return () => {
      release()
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', release)
      document.removeEventListener('pointercancel', release)
      window.removeEventListener('blur', release)
    }
  }, [])

  useEffect(() => {
    const returning = visited.current.has(pathname)
    visited.current.add(pathname)
    if (
      returning ||
      (navigationType === 'POP' && visited.current.size > 1) ||
      !allowsMotion() ||
      !window.IntersectionObserver
    )
      return
    const root = document.getElementById('main-content')
    if (!root) return
    const observed = new WeakSet<Element>()
    const animations = new Set<Animation>()
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const cancel = () => {
      animations.forEach((animation) => animation.cancel())
      animations.clear()
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          observer.unobserve(entry.target)
          if (!allowsMotion()) continue
          const element = entry.target as HTMLElement
          const delay = Number(element.dataset.motionDelay ?? 0)
          if (element.animate) {
            const animation = element.animate(
              [
                { opacity: 0.35, translate: '0 8px' },
                { opacity: 1, translate: '0 0' },
              ],
              { duration: 360, delay, easing: 'cubic-bezier(.2,.8,.2,1)' },
            )
            animations.add(animation)
            animation.onfinish = () => animations.delete(animation)
          }
          if (element.matches('.player-detail-card, .ideal-promo'))
            element.classList.add('light-reveal')
        }
      },
      { threshold: 0.15 },
    )
    const scan = () =>
      root
        .querySelectorAll(
          '.league-fixtures > section, .ideal-promo, .player-detail-card, [data-ideal-reveal]',
        )
        .forEach((element) => {
          if (!observed.has(element)) {
            observed.add(element)
            observer.observe(element)
          }
        })
    scan()
    const mutations = new MutationObserver(scan)
    mutations.observe(root, { childList: true, subtree: true })
    media.addEventListener('change', cancel)
    return () => {
      observer.disconnect()
      mutations.disconnect()
      cancel()
      media.removeEventListener('change', cancel)
    }
  }, [pathname, navigationType])
}

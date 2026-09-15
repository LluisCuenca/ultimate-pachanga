import { useLayoutEffect } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router'

const positions = new Map<string, number>()
export function PageScroll() {
  const location = useLocation()
  const navigation = useNavigationType()
  useLayoutEffect(() => {
    const previous = history.scrollRestoration
    history.scrollRestoration = 'manual'
    const target = navigation === 'POP' ? (positions.get(location.key) ?? 0) : 0
    let stopped = false
    const restore = () => {
      if (!stopped) window.scrollTo({ top: target, behavior: 'instant' })
      if (Math.abs(window.scrollY - target) < 2) stop()
    }
    const observer = new ResizeObserver(restore)
    function stop() {
      stopped = true
      observer.disconnect()
    }
    observer.observe(document.body)
    restore()
    const timer = window.setTimeout(stop, 5000)
    window.addEventListener('pointerdown', stop, { once: true })
    window.addEventListener('wheel', stop, { once: true })
    window.addEventListener('keydown', stop, { once: true })
    return () => {
      positions.set(location.key, window.scrollY)
      if (positions.size > 100) positions.delete(positions.keys().next().value!)
      stop()
      clearTimeout(timer)
      window.removeEventListener('pointerdown', stop)
      window.removeEventListener('wheel', stop)
      window.removeEventListener('keydown', stop)
      history.scrollRestoration = previous
    }
  }, [location.key, navigation])
  return <Outlet />
}

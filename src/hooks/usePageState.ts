import { useState, type Dispatch, type SetStateAction } from 'react'

const PREFIX = 'up:view:'
export function clearPageState() {
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => sessionStorage.removeItem(key))
  } catch {
    /* Private browsing can disable storage. */
  }
}

/** Keep view preferences for this tab; never persist form drafts or credentials. */
export function usePageState<T>(
  key: string,
  initial: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const fallback =
      typeof initial === 'function' ? (initial as () => T)() : initial
    try {
      const saved = sessionStorage.getItem(PREFIX + key)
      if (saved !== null) {
        const parsed = JSON.parse(saved)
        if (
          typeof parsed === typeof fallback &&
          Array.isArray(parsed) === Array.isArray(fallback)
        )
          return parsed
      }
    } catch {
      /* Fall back without interrupting navigation. */
    }
    return fallback
  })
  const update: Dispatch<SetStateAction<T>> = (next) => {
    const resolved =
      typeof next === 'function' ? (next as (previous: T) => T)(value) : next
    try {
      sessionStorage.setItem(PREFIX + key, JSON.stringify(resolved))
    } catch {
      /* Storage is optional. */
    }
    setValue(resolved)
  }
  return [value, update]
}

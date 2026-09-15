import { useSyncExternalStore } from 'react'
const revisions = new Map<string, string>()
const listeners = new Set<() => void>()
const visit = String(Date.now())
let sequence = 0
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export function refreshAvatar(path: string) {
  revisions.set(path, `${Date.now()}-${++sequence}`)
  listeners.forEach((listener) => listener())
}
export function useAvatarRevision(path: string | null | undefined) {
  return useSyncExternalStore(
    subscribe,
    () => (path ? (revisions.get(path) ?? visit) : ''),
    () => '',
  )
}
export function versionedAvatar(url: string | null, revision: string) {
  return url
    ? `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(revision)}`
    : null
}

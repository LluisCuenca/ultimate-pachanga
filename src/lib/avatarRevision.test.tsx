import { act, renderHook } from '@testing-library/react'
import { expect, it } from 'vitest'
import {
  refreshAvatar,
  useAvatarRevision,
  versionedAvatar,
} from './avatarRevision'
it('updates every visible instance of a replaced avatar without changing other players', () => {
  const a = renderHook(() => useAvatarRevision('league/a.jpg'))
  const b = renderHook(() => useAvatarRevision('league/b.jpg'))
  const previous = b.result.current
  act(() => refreshAvatar('league/a.jpg'))
  expect(
    versionedAvatar('https://example.test/a.jpg', a.result.current),
  ).toContain('?v=')
  expect(b.result.current).toBe(previous)
  expect(a.result.current).not.toBe(previous)
})

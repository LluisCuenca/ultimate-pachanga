import { act, renderHook } from '@testing-library/react'
import { expect, it } from 'vitest'
import { clearPageState, usePageState } from './usePageState'

it('restores a view after unmount and clears it on logout', () => {
  const first = renderHook(() => usePageState('search', ''))
  act(() => first.result.current[1]('Luis'))
  first.unmount()
  const second = renderHook(() => usePageState('search', ''))
  expect(second.result.current[0]).toBe('Luis')
  second.unmount()
  clearPageState()
  const third = renderHook(() => usePageState('search', ''))
  expect(third.result.current[0]).toBe('')
})
it('ignores damaged persisted preferences', () => {
  sessionStorage.setItem('up:view:search', '{invalid')
  const hook = renderHook(() => usePageState('search', ''))
  expect(hook.result.current[0]).toBe('')
})

import { fireEvent, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Link, Route, Routes, useNavigate } from 'react-router'
import { renderWithProviders } from '@/test/render'
import { PageScroll } from './PageScroll'

it('opens details at the top and restores the list position on back navigation', () => {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'scrollY')!
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    writable: true,
    value: 0,
  })
  const scroll = vi
    .spyOn(window, 'scrollTo')
    .mockImplementation((options: number | ScrollToOptions) => {
      if (typeof options === 'object')
        Object.defineProperty(window, 'scrollY', {
          configurable: true,
          writable: true,
          value: options.top ?? 0,
        })
    })
  function Detail() {
    const navigate = useNavigate()
    return <button onClick={() => navigate(-1)}>Volver a la lista</button>
  }
  const view = renderWithProviders(
    <Routes>
      <Route element={<PageScroll />}>
        <Route
          path="/players"
          element={<Link to="/players/p1">Abrir ficha</Link>}
        />
        <Route path="/players/p1" element={<Detail />} />
      </Route>
    </Routes>,
    { route: '/players' },
  )
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    writable: true,
    value: 480,
  })
  fireEvent.click(screen.getByRole('link', { name: 'Abrir ficha' }))
  expect(window.scrollY).toBe(0)
  fireEvent.click(screen.getByRole('button', { name: 'Volver a la lista' }))
  expect(window.scrollY).toBe(480)
  view.unmount()
  scroll.mockRestore()
  Object.defineProperty(window, 'scrollY', descriptor)
})

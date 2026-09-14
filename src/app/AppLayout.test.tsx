import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppLayout } from '@/app/AppLayout'
import { renderWithProviders } from '@/test/render'

vi.mock('@/features/league/useLeague', () => ({
  useLeague: () => ({ data: { title: 'Liga de prueba' } }),
  useIsAdmin: () => false,
}))
vi.mock('@/features/auth/api', () => ({ signOut: vi.fn() }))
vi.mock('@/lib/env', () => ({ APP_NAME: 'Ultimate Pachangas' }))

describe('AppLayout navigation', () => {
  it('marks only the ideal seven destination active on its nested route', () => {
    renderWithProviders(<AppLayout />, { route: '/league/ideal-seven' })
    const nav = within(
      screen.getByRole('navigation', { name: 'Navegación principal móvil' }),
    )
    expect(nav.getByRole('link', { name: '7 ideal' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(nav.getByRole('link', { name: /^Liga$/ })).not.toHaveAttribute(
      'aria-current',
    )
    expect(nav.getAllByRole('link')).toHaveLength(5)
  })

  it('keeps profile accessible from the mobile menu without exposing administration to members', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AppLayout />)
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    const menu = within(
      screen.getByRole('navigation', { name: 'Menú de cuenta' }),
    )
    expect(menu.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute(
      'href',
      '/profile',
    )
    expect(
      menu.queryByRole('link', { name: 'Gestionar jugadores' }),
    ).not.toBeInTheDocument()
  })
})

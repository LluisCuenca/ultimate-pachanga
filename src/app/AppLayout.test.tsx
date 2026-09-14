import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { AppLayout } from '@/app/AppLayout'
import { renderWithProviders } from '@/test/render'

vi.mock('@/features/league/useLeague', () => ({
  useLeague: () => ({ data: { title: 'Liga de prueba' } }),
  useIsAdmin: () => false,
}))
vi.mock('@/features/auth/api', () => ({ signOut: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ getAvatarUrl: () => null }))
vi.mock('@/features/players/useMyPlayer', () => ({
  useMyPlayerId: () => ({ data: null }),
}))
vi.mock('@/features/players/api', () => ({
  fetchPlayerCard: vi.fn(),
  playerKeys: { card: (id: string) => ['player', id] },
}))

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

  it('links the header logo to Liga and the avatar to profile without a mobile drawer', () => {
    renderWithProviders(<AppLayout />)
    expect(screen.getByRole('link', { name: 'Ir a Liga' })).toHaveAttribute(
      'href',
      '/league',
    )
    const header = within(screen.getByRole('banner'))
    expect(header.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute(
      'href',
      '/profile',
    )
    expect(header.getByText('ULTIMATE PACHANGAS')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Abrir menú' }),
    ).not.toBeInTheDocument()
    expect(
      header.queryByRole('button', { name: 'Salir' }),
    ).not.toBeInTheDocument()
  })
})

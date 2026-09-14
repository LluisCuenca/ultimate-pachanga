import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { AppLayout } from '@/app/AppLayout'
import { renderWithProviders } from '@/test/render'

vi.mock('@/features/league/useLeague', () => ({
  useLeague: () => ({ data: { title: 'Liga de prueba' } }),
  useIsAdmin: () => false,
}))
vi.mock('@/features/matches/api', () => ({
  fetchMatch: vi.fn().mockResolvedValue({ title: 'Jornada 8' }),
  matchKeys: { detail: (id: string) => ['match', id] },
}))
vi.mock('@/features/auth/api', () => ({ signOut: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ getAvatarUrl: () => null }))
vi.mock('@/features/players/useMyPlayer', () => ({
  useMyPlayerId: () => ({ data: null }),
}))
vi.mock('@/features/players/api', () => ({
  fetchPlayerCard: vi.fn().mockResolvedValue({ displayName: 'Luis Iniesta' }),
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
    expect(header.getByRole('heading', { name: 'La Liga' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Abrir menú' }),
    ).not.toBeInTheDocument()
    expect(
      header.queryByRole('button', { name: 'Salir' }),
    ).not.toBeInTheDocument()
  })
  it.each([
    ['/league', 'La Liga'],
    ['/players', 'Jugadores'],
    ['/matches', 'Partidos'],
    ['/stats', 'Estadísticas'],
    ['/league/ideal-seven', '7 ideal'],
    ['/profile', 'Mi perfil'],
    ['/matches/new', 'Nuevo partido'],
  ])('uses the contextual heading on %s', (route, title) => {
    renderWithProviders(<AppLayout />, { route })
    expect(
      within(screen.getByRole('banner')).getByRole('heading', { name: title }),
    ).toBeInTheDocument()
  })
  it('uses the actual player and match names on detail routes', async () => {
    const view = renderWithProviders(<AppLayout />, { route: '/players/p1' })
    expect(
      await within(screen.getByRole('banner')).findByRole('heading', {
        name: 'Luis Iniesta',
      }),
    ).toBeInTheDocument()
    view.unmount()
    renderWithProviders(<AppLayout />, { route: '/matches/m8' })
    expect(
      await within(screen.getByRole('banner')).findByRole('heading', {
        name: 'Jornada 8',
      }),
    ).toBeInTheDocument()
  })
})

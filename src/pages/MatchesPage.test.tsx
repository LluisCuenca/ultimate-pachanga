import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MatchesPage } from './MatchesPage'
import { renderWithProviders } from '@/test/render'
import { buildMatch, TEST_LEAGUE_ID } from '@/test/factories'

const { fetchMatches } = vi.hoisted(() => ({ fetchMatches: vi.fn() }))
vi.mock('@/features/league/useLeague', () => ({
  useMembership: () => ({ data: { leagueId: TEST_LEAGUE_ID } }),
  useIsAdmin: () => false,
  useLeague: () => ({ data: { id: TEST_LEAGUE_ID, title: 'Liga de verano' } }),
}))
vi.mock('@/features/matches/api', () => ({
  fetchMatches,
  matchKeys: { list: (id: string) => ['matches', id] },
}))
vi.mock('@/lib/supabase', () => ({ getMatchPhotoUrl: () => null }))

beforeEach(() => {
  vi.clearAllMocks()
})
describe('MatchesPage archive', () => {
  it('puts the nearest scheduled game first and filters the archive by round number and text', async () => {
    const user = userEvent.setup()
    fetchMatches.mockResolvedValue([
      buildMatch({
        id: 'future-2',
        title: 'Jornada 20',
        played_at: '2027-02-01',
      }),
      buildMatch({
        id: 'future-1',
        title: 'Jornada 19',
        played_at: '2027-01-01',
      }),
      buildMatch({
        id: 'past-2',
        title: 'Jornada 18',
        status: 'scored',
        played_at: '2026-07-01',
      }),
      buildMatch({
        id: 'past-1',
        title: 'Jornada 1',
        status: 'scored',
        played_at: '2025-07-01',
      }),
    ])
    renderWithProviders(<MatchesPage />)
    await screen.findByText('Jornada 19')
    expect(screen.getAllByRole('link')[0]).toHaveAttribute(
      'href',
      '/matches/future-1',
    )
    expect(fetchMatches).toHaveBeenCalledWith(TEST_LEAGUE_ID)
    await user.type(screen.getByLabelText('Buscar jornada'), '1')
    await user.click(screen.getByRole('button', { name: 'Buscar jornadas' }))
    expect(
      screen.getByRole('link', { name: 'Ver Jornada 1' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Ver Jornada 18' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Jornada 19')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver Jornada 1' })).toHaveAttribute(
      'href',
      '/matches/past-1',
    )
    await user.clear(screen.getByLabelText('Buscar jornada'))
    expect(
      screen.queryByRole('link', { name: 'Ver Jornada 1' }),
    ).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Buscar jornada'), 'Jornada 18')
    await user.click(screen.getByRole('button', { name: 'Buscar jornadas' }))
    expect(
      screen.getByRole('link', { name: 'Ver Jornada 18' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Ver Jornada 1' }),
    ).not.toBeInTheDocument()
  })
  it('keeps all played matches below the archive, paginates and explains no search results', async () => {
    const user = userEvent.setup()
    fetchMatches.mockResolvedValue(
      Array.from({ length: 15 }, (_, index) =>
        buildMatch({
          id: `past-${index}`,
          title: `Jornada ${15 - index}`,
          status: 'scored',
        }),
      ),
    )
    renderWithProviders(<MatchesPage />)
    await screen.findByText('Jornada 15')
    expect(screen.getAllByRole('link')).toHaveLength(12)
    await user.click(screen.getByRole('button', { name: /Ver más partidos/ }))
    expect(screen.getAllByRole('link')).toHaveLength(15)
    await user.type(screen.getByLabelText('Buscar jornada'), 'inexistente')
    await user.click(screen.getByRole('button', { name: 'Buscar jornadas' }))
    expect(
      screen.getByText('No hay partidos que coincidan'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(15)
  })
})

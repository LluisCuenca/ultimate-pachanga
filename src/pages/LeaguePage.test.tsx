import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { LeaguePage } from '@/pages/LeaguePage'
import { renderWithProviders } from '@/test/render'
import { buildMatch, buildPlayerCard, TEST_LEAGUE_ID } from '@/test/factories'
import type { LeagueAttributeRow } from '@/types/domain'

const useMembership = vi.hoisted(() => vi.fn())
const useLeague = vi.hoisted(() => vi.fn())
const useLeagueAttributes = vi.hoisted(() => vi.fn())
const fetchPlayerCards = vi.hoisted(() => vi.fn())
const fetchMatches = vi.hoisted(() => vi.fn())

vi.mock('@/features/league/useLeague', () => ({
  useMembership,
  useLeague,
  useLeagueAttributes,
}))

vi.mock('@/features/players/api', () => ({
  fetchPlayerCards,
  playerKeys: { cards: (leagueId: string) => ['players', 'cards', leagueId] },
}))

vi.mock('@/features/matches/api', () => ({
  fetchMatches,
  matchKeys: { list: (leagueId: string) => ['matches', 'list', leagueId] },
}))

vi.mock('@/lib/supabase', () => ({
  getMatchPhotoUrl: (path: string | null) =>
    path ? `https://example.test/${path}` : null,
  getAvatarUrl: (path: string | null) =>
    path ? `https://example.test/${path}` : null,
  supabase: {},
}))

const ATTRIBUTES: LeagueAttributeRow[] = [
  {
    id: 'attribute-mvp',
    league_id: TEST_LEAGUE_ID,
    code: 'mvp',
    label: 'MVP',
    points: 2,
    is_active: true,
  },
]

function renderPage() {
  useMembership.mockReturnValue({
    data: { leagueId: TEST_LEAGUE_ID, role: 'member' },
  })
  useLeague.mockReturnValue({
    data: { id: TEST_LEAGUE_ID, title: 'Liga Roco', status: 'active' },
  })
  useLeagueAttributes.mockReturnValue({ data: ATTRIBUTES })
  fetchPlayerCards.mockResolvedValue([
    buildPlayerCard({
      id: 'player-1',
      displayName: 'David Castelló',
      attributeCounts: { mvp: 1 },
    }),
  ])
  fetchMatches.mockResolvedValue([buildMatch({ status: 'scored' })])

  return renderWithProviders(<LeaguePage />)
}

describe('LeaguePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the general dashboard and links to the 7 ideal page', async () => {
    renderPage()

    expect(await screen.findByText('Jugadores activos')).toBeInTheDocument()
    expect(
      await screen.findByText('Mayor valor de mercado'),
    ).toBeInTheDocument()

    const link = screen.getByRole('link', { name: 'Ver 7 ideal' })
    expect(link).toHaveAttribute('href', '/league/ideal-seven')
    expect(
      screen.getByText(/El mejor equipo 2-3-1 de la liga/),
    ).toBeInTheDocument()
  })
})

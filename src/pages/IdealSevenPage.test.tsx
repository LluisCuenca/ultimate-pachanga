import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { IdealSevenPage } from '@/pages/IdealSevenPage'
import { renderWithProviders } from '@/test/render'
import { buildPlayerCard, TEST_LEAGUE_ID, TEST_METRICS } from '@/test/factories'
import type { BestPlayerScore } from '@/features/league/idealSeven'
import type * as IdealSevenModule from '@/features/league/idealSeven'
import type { PlayerCardData, PlayerPosition } from '@/types/domain'

const useMembership = vi.hoisted(() => vi.fn())
const useLeagueMetrics = vi.hoisted(() => vi.fn())
const fetchPlayerCards = vi.hoisted(() => vi.fn())
const fetchBestPlayerScores = vi.hoisted(() => vi.fn())

vi.mock('@/features/league/useLeague', () => ({
  useMembership,
  useLeagueMetrics,
}))

vi.mock('@/features/players/api', () => ({
  fetchPlayerCards,
  playerKeys: { cards: (leagueId: string) => ['players', 'cards', leagueId] },
}))

vi.mock('@/features/league/idealSeven', async (importOriginal) => {
  const actual = await importOriginal<typeof IdealSevenModule>()

  return {
    ...actual,
    fetchBestPlayerScores,
  }
})

vi.mock('@/lib/supabase', () => ({
  getAvatarUrl: (path: string | null) =>
    path ? `https://example.test/${path}` : null,
  supabase: {},
  PLAYER_AVATARS_BUCKET: 'player-avatars',
}))

function player({
  id,
  position,
  best,
  confidence = 100,
  defence = best,
  mvp = 0,
}: {
  id: string
  position: PlayerPosition
  best: number
  confidence?: number
  defence?: number
  mvp?: number
}): PlayerCardData {
  return buildPlayerCard({
    id,
    playerCode: id,
    firstName: id,
    lastName: 'Player',
    displayName: id,
    preferredPosition: position,
    matchesPlayed: 6,
    weightedPerformanceScore: best / 4,
    marketValueGbp: best * 1_000_000,
    confidencePct: confidence,
    metricCardStats: { attack: best, defence, tactics: best, physical: best },
    attributeCounts: { mvp },
  })
}

const PLAYERS = [
  player({ id: '20', position: 'GK', best: 20, defence: 99 }),
  player({ id: '19', position: 'CB', best: 19 }),
  player({ id: '18', position: 'LB', best: 18 }),
  player({ id: '17', position: 'CM', best: 17, mvp: 3 }),
  player({ id: '16', position: 'CDM', best: 16, mvp: 5 }),
  player({ id: '15', position: 'RW', best: 15 }),
  player({ id: '30', position: 'ST', best: 30 }),
  player({ id: '99', position: 'ST', best: 99, confidence: 50 }),
]

const BEST_SCORES: BestPlayerScore[] = PLAYERS.map((entry) => ({
  playerId: entry.id,
  bestFinalScore: Number(entry.id),
  metricScores: { attack: 9, defence: 8, tactics: 7, physical: 6 },
}))

function renderPage(
  players = PLAYERS,
  metricsState: Record<string, unknown> = {},
) {
  useMembership.mockReturnValue({
    data: { leagueId: TEST_LEAGUE_ID, role: 'member' },
  })
  useLeagueMetrics.mockReturnValue({
    data: TEST_METRICS,
    refetch: vi.fn(),
    ...metricsState,
  })
  fetchPlayerCards.mockResolvedValue(players)
  fetchBestPlayerScores.mockResolvedValue(BEST_SCORES)

  return renderWithProviders(<IdealSevenPage />)
}

describe('IdealSevenPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the ideal pitch, best-match stats and simple explanation', async () => {
    renderPage()

    expect(
      await screen.findByRole('heading', { name: '7 ideal' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Liga' })).not.toBeInTheDocument()
    expect(await screen.findAllByTestId('ideal-seven-slot')).toHaveLength(7)
    expect(screen.getAllByTestId('player-card')).toHaveLength(7)
    expect(
      screen.getByRole('heading', { name: 'Los elegidos' }),
    ).toBeInTheDocument()
    await userEvent.click(
      screen.getAllByRole('button', { name: /Distinción de/ })[0],
    )
    expect(screen.getAllByText('90').length).toBeGreaterThan(0)
    expect(screen.getAllByText('80').length).toBeGreaterThan(0)
    expect(screen.getAllByText('70').length).toBeGreaterThan(0)
    expect(screen.getAllByText('60').length).toBeGreaterThan(0)
    expect(screen.getByText(/más valor de mercado/)).toBeInTheDocument()
    expect(screen.getByText('Quién opta')).toBeInTheDocument()
    expect(screen.getByText('Portería')).toBeInTheDocument()
    expect(screen.getByText('Defensa')).toBeInTheDocument()
    expect(screen.getByText('Medio')).toBeInTheDocument()
    expect(screen.getByText('Ataque')).toBeInTheDocument()
    expect(screen.getAllByText('CDM').length).toBeGreaterThan(0)
    expect(screen.getAllByText('CAM').length).toBeGreaterThan(0)
    expect(screen.getByText(/Mayor valoración del 7 ideal/)).toBeInTheDocument()
    expect(
      screen.getByText(/Más premios MVP entre los restantes/),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/Mejor defensa entre los restantes/).length,
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole('link', { name: 'Ver ficha de 99' }),
    ).not.toBeInTheDocument()
  })

  it('shows an empty state when confidence removes the valid side', async () => {
    renderPage([
      player({ id: '20', position: 'GK', best: 20, confidence: 50 }),
      player({ id: '19', position: 'CB', best: 19, confidence: 50 }),
      player({ id: '18', position: 'LB', best: 18, confidence: 50 }),
      player({ id: '17', position: 'CM', best: 17, confidence: 50 }),
      player({ id: '16', position: 'CDM', best: 16, confidence: 50 }),
      player({ id: '15', position: 'RW', best: 15, confidence: 50 }),
      player({ id: '30', position: 'ST', best: 30, confidence: 50 }),
    ])

    expect(
      await screen.findByText('No hay 7 ideal todavía'),
    ).toBeInTheDocument()
  })
  it('shows metric failures as errors and retries instead of reporting an empty team', async () => {
    const refetch = vi.fn()
    renderPage(PLAYERS, {
      data: undefined,
      isPending: false,
      error: new Error('Métricas no disponibles'),
      refetch,
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Métricas no disponibles',
    )
    expect(screen.queryByText('No hay 7 ideal todavía')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('waits for metrics rather than presenting an empty team', () => {
    renderPage(PLAYERS, { data: undefined, isPending: true })
    expect(screen.queryByText('No hay 7 ideal todavía')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

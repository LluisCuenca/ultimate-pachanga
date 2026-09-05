import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlayersPage } from '@/pages/PlayersPage'
import { renderWithProviders } from '@/test/render'
import { buildPlayerCard, TEST_METRICS } from '@/test/factories'

vi.mock('@/lib/supabase', () => ({
  getAvatarUrl: () => null,
  supabase: {},
}))

vi.mock('@/features/league/useLeague', () => ({
  useLeague: () => ({ data: { id: 'test-league' } }),
  useLeagueMetrics: () => ({ data: TEST_METRICS }),
  useIsAdmin: () => false,
}))

vi.mock('@/features/players/api', () => ({
  playerKeys: { cards: (id: string) => ['cards', id] },
  fetchPlayerCards: async () => [
    buildPlayerCard({ id: 'one', displayName: 'Marc', cardRating: 70 }),
    buildPlayerCard({ id: 'two', displayName: 'Pau', cardRating: 90 }),
    buildPlayerCard({ id: 'three', displayName: 'Inactive', isActive: false }),
  ],
}))

describe('PlayersPage comparison view', () => {
  it('retains rating order and the search when switching between cards and table', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PlayersPage />)
    await screen.findByText('2 jugadores')
    await user.click(screen.getByRole('button', { name: 'Comparar en tabla' }))

    const rows = within(screen.getByRole('table')).getAllByRole('row')
    expect(within(rows[1]).getByRole('link')).toHaveTextContent('Pau')
    expect(within(rows[2]).getByRole('link')).toHaveTextContent('Marc')
    expect(screen.queryByText('Inactive')).not.toBeInTheDocument()

    await user.type(
      screen.getByRole('textbox', { name: 'Buscar jugador' }),
      'Pau',
    )
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(
      2,
    )
    await user.click(screen.getByRole('button', { name: 'Ver cromos' }))
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('Pau')).toBeInTheDocument()
    expect(screen.queryByText('Marc')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver cromos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})

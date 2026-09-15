import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { PlayerHistory } from './PlayerHistory'
import { renderWithProviders } from '@/test/render'
import { TEST_METRICS } from '@/test/factories'
import type { PlayerMatchHistoryEntry } from '@/features/players/api'

const entry: PlayerMatchHistoryEntry = {
  matchId: 'actual-match-id',
  matchTitle: 'Jornada 12',
  playedAt: '2026-08-01',
  goals: 2,
  victory: 0.5,
  baseScore: 7.25,
  attributePoints: 2,
  finalScore: 9.25,
  metricScores: { attack: 6, defence: 7, tactics: 8, physical: 8 },
  attributes: [{ code: 'mvp', label: 'MVP', points: 2 }],
}

describe('PlayerHistory', () => {
  it('links the actual match, abbreviates its title and keeps every score visible', async () => {
    renderWithProviders(
      <PlayerHistory history={[entry]} metrics={TEST_METRICS} />,
    )
    const row = screen.getByRole('link', { name: /Ver Jornada 12/ })
    expect(row).toHaveAttribute('href', '/matches/actual-match-id')
    expect(within(row).getByText('J12')).toBeInTheDocument()
    expect(within(row).getByText('9,25')).toBeInTheDocument()
    expect(within(row).getByText('6')).toBeInTheDocument()
    expect(within(row).getByText('7')).toBeInTheDocument()
    expect(within(row).getAllByText('8')).toHaveLength(2)
    expect(within(row).getByText('2')).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Ver atributos: MVP' }),
    )
    expect(screen.getByText('MVP')).toBeInTheDocument()
    expect(screen.queryByText('2026-08-01')).not.toBeInTheDocument()
    for (const label of ['A', 'D', 'T', 'F', 'G'])
      expect(screen.getByText(label)).toBeInTheDocument()
  })
  it('does not invent a round number for a named match or invent missing scores', () => {
    renderWithProviders(
      <PlayerHistory
        history={[
          { ...entry, matchTitle: 'Final de verano', metricScores: {} },
        ]}
        metrics={TEST_METRICS}
      />,
    )
    expect(screen.getByText('Final de verano')).toBeInTheDocument()
    expect(screen.queryByText('J1')).not.toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(4)
  })
})

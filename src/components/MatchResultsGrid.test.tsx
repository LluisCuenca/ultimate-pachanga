import { describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MatchResultsGrid, type MatchResultGridRow } from './MatchResultsGrid'
import { renderWithProviders } from '@/test/render'
import { TEST_METRICS } from '@/test/factories'
vi.mock('@/lib/supabase', () => ({ getAvatarUrl: () => null }))
const row: MatchResultGridRow = {
  playerId: 'p1',
  displayName: 'Luis Iniesta',
  teamName: 'Local',
  score: {
    playerId: 'p1',
    playerCode: 'p1',
    displayName: 'Luis Iniesta',
    metricScores: { attack: 6, defence: 7, tactics: 8, physical: 9 },
    goals: 2,
    victory: 1,
    baseScore: 7.5,
    attributePoints: 2,
    finalScore: 9.5,
    attributes: [{ code: 'mvp', label: 'MVP', points: 2 }],
  },
}
describe('MatchResultsGrid', () => {
  it('aligns every metric under its column, retains the final score and links the real player', async () => {
    renderWithProviders(
      <MatchResultsGrid rows={[row]} metrics={TEST_METRICS} />,
    )
    const table = within(screen.getByRole('table'))
    expect(
      table.getAllByRole('columnheader').map((cell) => cell.textContent),
    ).toEqual(['Jugador', 'A', 'D', 'T', 'F', 'G', 'Final'])
    expect(table.getAllByRole('row')[1].textContent).toContain('678929,5')
    expect(table.getByRole('link', { name: /Luis Iniesta/ })).toHaveAttribute(
      'href',
      '/players/p1',
    )
    expect(table.getByText('Base 7,5')).toBeInTheDocument()
    await userEvent.click(
      table.getByRole('button', { name: 'Ver atributos: MVP' }),
    )
    expect(screen.getByText('MVP')).toBeInTheDocument()
  })
  it('keeps score editing available and shows dashes for unscored players', async () => {
    const onEdit = vi.fn()
    renderWithProviders(
      <MatchResultsGrid
        rows={[
          {
            ...row,
            score: undefined,
            action: <button onClick={onEdit}>Puntuar</button>,
          },
        ]}
        metrics={TEST_METRICS}
      />,
    )
    expect(screen.getAllByText('—')).toHaveLength(6)
    await userEvent.click(screen.getByRole('button', { name: 'Puntuar' }))
    expect(onEdit).toHaveBeenCalledOnce()
  })
})

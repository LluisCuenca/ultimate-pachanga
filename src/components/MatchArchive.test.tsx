import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MatchArchive } from './MatchArchive'
import { renderWithProviders } from '@/test/render'
import { buildMatch, TEST_LEAGUE_ID } from '@/test/factories'
describe('MatchArchive league scope', () => {
  it('only offers years and matches belonging to the available league', async () => {
    renderWithProviders(
      <MatchArchive
        league={{ id: TEST_LEAGUE_ID, title: 'Verano' }}
        matches={[
          buildMatch({ status: 'scored', title: 'Jornada propia' }),
          buildMatch({
            id: 'foreign',
            league_id: 'other-league',
            title: 'Otra liga',
            played_at: '1999-01-01',
          }),
        ]}
      />,
    )
    expect(
      screen.queryByRole('option', { name: '1999' }),
    ).not.toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Buscar jornadas' }),
    )
    expect(
      screen.getByRole('option', { name: /Jornada propia/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: /Otra liga/ }),
    ).not.toBeInTheDocument()
  })
})

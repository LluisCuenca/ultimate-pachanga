import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MatchArchive } from './MatchArchive'
import { renderWithProviders } from '@/test/render'
import { buildMatch, TEST_LEAGUE_ID } from '@/test/factories'
describe('MatchArchive league scope', () => {
  it('only offers matches belonging to the available league', async () => {
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
      screen.getByRole('link', { name: /Jornada propia/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Otra liga/ }),
    ).not.toBeInTheDocument()
  })
})

it('finds an exact round number across years without year or league selectors', async () => {
  sessionStorage.setItem('up:view:archive-year', JSON.stringify('1999'))
  renderWithProviders(
    <MatchArchive
      league={{ id: TEST_LEAGUE_ID, title: 'Verano' }}
      matches={[
        buildMatch({ id: 'five', title: 'Jornada 5', played_at: '2026-08-01' }),
        buildMatch({
          id: 'fifteen',
          title: 'Jornada 15',
          played_at: '2025-08-01',
        }),
      ]}
    />,
  )
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  await userEvent.type(
    screen.getByRole('searchbox', { name: 'Buscar jornada' }),
    '5',
  )
  await userEvent.click(screen.getByRole('button', { name: 'Buscar jornadas' }))
  expect(screen.getByRole('status')).toHaveTextContent('1 jornada encontrada')
  expect(screen.getByRole('link', { name: 'Ver Jornada 5' })).toHaveAttribute(
    'href',
    '/matches/five',
  )
  expect(
    screen.queryByRole('link', { name: 'Ver Jornada 15' }),
  ).not.toBeInTheDocument()
})

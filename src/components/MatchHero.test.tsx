import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MatchHero } from './MatchHero'
import { renderWithProviders } from '@/test/render'
import { buildMatch } from '@/test/factories'
vi.mock('@/lib/supabase', () => ({
  getMatchPhotoUrl: (path: string | null) =>
    path ? `https://example.test/${path}` : null,
}))
describe('MatchHero image expansion', () => {
  it('opens the current match image, closes with Escape and restores focus', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MatchHero match={buildMatch({ photo_path: 'game.webp' })} />,
    )
    const trigger = screen.getByRole('button', {
      name: 'Ampliar imagen del partido',
    })
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Campo de Jornada 3' }),
    ).toHaveAttribute(
      'src',
      `https://example.test/game.webp?v=${Date.parse('2026-07-01T00:00:00.000Z')}`,
    )
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
  it('expands the venue image when the match has no uploaded photo', async () => {
    renderWithProviders(<MatchHero match={buildMatch({ location: 'UIB' })} />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Ampliar imagen del partido' }),
    )
    expect(
      screen.getByRole('img', { name: 'Campo de Jornada 3' }),
    ).toHaveAttribute('src', '/venues/uib.webp')
  })
})

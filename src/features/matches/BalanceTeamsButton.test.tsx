import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BalanceTeamsButton } from '@/features/matches/BalanceTeamsButton'
import { renderWithProviders } from '@/test/render'

function renderButton(
  overrides: Partial<Parameters<typeof BalanceTeamsButton>[0]> = {},
) {
  const onBalance = vi.fn()

  renderWithProviders(
    <BalanceTeamsButton
      isAdmin
      hasEnoughPlayers
      isPending={false}
      onBalance={onBalance}
      {...overrides}
    />,
  )

  return { onBalance, button: screen.getByTestId('balance-teams') }
}

describe('BalanceTeamsButton', () => {
  it('balances the teams for an administrator', async () => {
    const user = userEvent.setup()
    const { onBalance, button } = renderButton()

    expect(button).toBeEnabled()
    await user.click(button)

    expect(onBalance).toHaveBeenCalledTimes(1)
  })

  it('is visible but blocked for a player who is not an administrator', async () => {
    const user = userEvent.setup()
    const { onBalance, button } = renderButton({ isAdmin: false })

    expect(button).toBeVisible()
    expect(button).toBeEnabled()

    await user.click(button)
    expect(onBalance).not.toHaveBeenCalled()
  })

  it('says whose call it is', async () => {
    const user = userEvent.setup()
    renderButton({ isAdmin: false })

    await user.click(screen.getByTestId('balance-teams'))

    expect(
      await screen.findByText(
        /Solo un administrador puede equilibrar los equipos/,
      ),
    ).toBeInTheDocument()
  })

  it('explains an insufficient squad without starting a balance', async () => {
    const { button, onBalance } = renderButton({ hasEnoughPlayers: false })
    await userEvent.click(button)
    expect(
      screen.getByText(/Convoca al menos dos jugadores/),
    ).toBeInTheDocument()
    expect(onBalance).not.toHaveBeenCalled()
  })

  it('is inert while the split is being written', () => {
    const { button } = renderButton({ isPending: true })

    expect(button).toBeDisabled()
  })
})

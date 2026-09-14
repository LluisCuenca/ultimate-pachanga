import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router'
import { ProfileActions } from './ProfileActions'
import { renderWithProviders } from '@/test/render'
const { signOut, useIsAdmin, errorToast } = vi.hoisted(() => ({
  signOut: vi.fn(),
  useIsAdmin: vi.fn(),
  errorToast: vi.fn(),
}))
vi.mock('@/features/auth/api', () => ({ signOut }))
vi.mock('@/features/league/useLeague', () => ({ useIsAdmin }))
vi.mock('sonner', () => ({ toast: { error: errorToast } }))
function CurrentRoute() {
  return <output aria-label="Ruta">{useLocation().pathname}</output>
}
beforeEach(() => {
  vi.clearAllMocks()
  useIsAdmin.mockReturnValue(false)
  signOut.mockResolvedValue(undefined)
})
describe('ProfileActions', () => {
  it('signs out through the existing auth API and navigates to login', async () => {
    renderWithProviders(
      <>
        <ProfileActions />
        <CurrentRoute />
      </>,
      { route: '/profile' },
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(signOut).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('Ruta')).toHaveTextContent('/login')
    expect(
      screen.queryByRole('navigation', { name: 'Administración' }),
    ).not.toBeInTheDocument()
  })
  it('keeps the profile available if sign-out fails and explains the error', async () => {
    signOut.mockRejectedValue(new Error('No hay conexión'))
    renderWithProviders(
      <>
        <ProfileActions />
        <CurrentRoute />
      </>,
      { route: '/profile' },
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(screen.getByLabelText('Ruta')).toHaveTextContent('/profile')
    expect(errorToast).toHaveBeenCalledWith('No hay conexión')
  })
  it('keeps administration routes accessible for administrators', () => {
    useIsAdmin.mockReturnValue(true)
    renderWithProviders(<ProfileActions />)
    expect(
      screen.getByRole('link', { name: 'Gestionar jugadores' }),
    ).toHaveAttribute('href', '/admin/players')
    expect(screen.getByRole('link', { name: 'Miembros' })).toHaveAttribute(
      'href',
      '/admin/members',
    )
    expect(
      screen.getByRole('link', { name: 'Ajustes de la liga' }),
    ).toHaveAttribute('href', '/admin/settings')
  })
})

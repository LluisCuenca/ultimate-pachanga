import { Link, useNavigate } from 'react-router'
import { LogOut, Settings, UserCog, Users } from 'lucide-react'
import { toast } from 'sonner'
import { AdminOnly } from '@/components/AdminOnly'
import { Button } from '@/components/ui/button'
import { signOut } from '@/features/auth/api'

export function ProfileActions() {
  const navigate = useNavigate()
  async function handleSignOut() {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo cerrar sesión',
      )
    }
  }
  return (
    <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5">
      <AdminOnly>
        <nav aria-label="Administración" className="grid gap-2 sm:grid-cols-3">
          <Button asChild variant="outline">
            <Link to="/admin/players">
              <Users aria-hidden="true" />
              Gestionar jugadores
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/members">
              <UserCog aria-hidden="true" />
              Miembros
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/settings">
              <Settings aria-hidden="true" />
              Ajustes de la liga
            </Link>
          </Button>
        </nav>
      </AdminOnly>
      <Button
        onClick={handleSignOut}
        variant="outline"
        className="w-full text-destructive sm:w-fit"
      >
        <LogOut aria-hidden="true" />
        Cerrar sesión
      </Button>
    </div>
  )
}

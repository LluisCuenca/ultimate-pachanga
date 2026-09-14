import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import {
  BarChart3,
  CalendarDays,
  LogOut,
  Menu,
  Settings,
  Shield,
  ShieldCheck,
  Trophy,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { AdminOnly } from '@/components/AdminOnly'
import { signOut } from '@/features/auth/api'
import { useLeague } from '@/features/league/useLeague'
import { Brand } from '@/components/Brand'
import { APP_NAME } from '@/lib/env'
import { cn } from '@/lib/utils'

interface NavigationItem {
  to: string
  label: string
  icon: typeof Users
  adminOnly?: boolean
}

const NAVIGATION: NavigationItem[] = [
  { to: '/league', label: 'Liga', icon: Shield },
  { to: '/players', label: 'Jugadores', icon: Users },
  { to: '/matches', label: 'Partidos', icon: CalendarDays },
  { to: '/stats', label: 'Estadísticas', icon: BarChart3 },
  { to: '/league/ideal-seven', label: '7 ideal', icon: Trophy },
]

const ADMIN_NAVIGATION: NavigationItem[] = [
  { to: '/admin/players', label: 'Gestionar jugadores', icon: Users },
  { to: '/admin/members', label: 'Miembros', icon: UserCog },
  { to: '/admin/settings', label: 'Ajustes de la liga', icon: Settings },
]

function navigationLinkClasses({ isActive }: { isActive: boolean }): string {
  return cn(
    'nav-link flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-accent text-accent-foreground'
      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
  )
}

function NavigationLinks({
  items,
  onNavigate,
}: {
  items: readonly NavigationItem[]
  onNavigate?: () => void
}) {
  return (
    <>
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/league'}
          onClick={onNavigate}
          className={navigationLinkClasses}
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </>
  )
}

/**
 * Admin destinations, collapsed into a menu on desktop so the main bar stays
 * short. The mobile sheet lists them inline instead — a dropdown inside a
 * slide-over is awkward on a phone.
 */
function AdminMenu() {
  return (
    <AdminOnly>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Administración
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Administración</DropdownMenuLabel>
          {ADMIN_NAVIGATION.map(({ to, label, icon: Icon }) => (
            <DropdownMenuItem key={to} asChild>
              <Link to={to}>
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </AdminOnly>
  )
}

/**
 * Shell for every signed-in page: sidebar on desktop, persistent bottom
 * navigation and account sheet on mobile.
 */
export function AppLayout() {
  const { data: league } = useLeague()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
    <div className="min-h-svh">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      <aside className="app-sidebar">
        <Link to="/league" className="flex items-center gap-3">
          <Brand />
          <div className="brand-wordmark">
            <span>Ultimate</span>Pachangas
          </div>
        </Link>
        <div>
          <p className="section-kicker mb-4 px-3">Tu competición</p>
          <nav
            aria-label="Navegación principal"
            className="flex flex-col gap-2"
          >
            <NavigationLinks items={NAVIGATION} />
          </nav>
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <NavigationLinks
            items={[{ to: '/profile', label: 'Mi perfil', icon: UserRound }]}
          />
          <AdminMenu />
          <p className="px-3 text-xs text-muted-foreground">
            El fútbol es mejor con los tuyos.
          </p>
        </div>
      </aside>
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 overflow-y-auto p-4">
              <SheetTitle className="mb-4 text-base">{APP_NAME}</SheetTitle>
              <nav aria-label="Menú de cuenta" className="flex flex-col gap-1">
                <NavigationLinks
                  items={[
                    ...NAVIGATION,
                    { to: '/profile', label: 'Mi perfil', icon: UserRound },
                  ]}
                  onNavigate={() => setIsMenuOpen(false)}
                />
                <AdminOnly>
                  <p className="mt-4 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Administración
                  </p>
                  <NavigationLinks
                    items={ADMIN_NAVIGATION}
                    onNavigate={() => setIsMenuOpen(false)}
                  />
                </AdminOnly>
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/league" className="flex min-w-0 items-center gap-2">
            <Brand className="size-9 lg:hidden" />
            <span className="truncate font-bold">
              {league?.title ?? APP_NAME}
            </span>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="ml-auto"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Salir</span>
          </Button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="app-main">
        <Outlet />
      </main>
      <nav className="app-bottom-nav" aria-label="Navegación principal móvil">
        {NAVIGATION.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/league'}
            className="bottom-link"
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

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
  { to: '/profile', label: 'Mi perfil', icon: UserRound },
]

const ADMIN_NAVIGATION: NavigationItem[] = [
  { to: '/admin/players', label: 'Gestionar jugadores', icon: Users },
  { to: '/admin/members', label: 'Miembros', icon: UserCog },
  { to: '/admin/settings', label: 'Ajustes de la liga', icon: Settings },
]

const LOGO_URL = `${import.meta.env.BASE_URL}ultimate-pachangas-logo.png`

function navigationLinkClasses({ isActive }: { isActive: boolean }): string {
  return cn(
    'flex items-center gap-2 border-l-2 border-transparent px-3 py-2 text-sm font-semibold transition-colors',
    isActive
      ? 'border-primary bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:border-primary/50 hover:bg-accent/70 hover:text-foreground',
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
 * Shell for every signed-in page: a horizontal nav on desktop, a slide-over
 * sheet on mobile.
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
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 overflow-y-auto p-4">
              <SheetTitle className="mb-4 text-base">{APP_NAME}</SheetTitle>
              <nav className="flex flex-col gap-1">
                <NavigationLinks
                  items={NAVIGATION}
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

          <Link to="/league" className="flex min-w-0 items-center gap-2.5">
            <img
              src={LOGO_URL}
              alt=""
              className="size-10 shrink-0 object-contain"
            />
            <span className="truncate font-heading text-lg font-bold uppercase">
              {league?.title ?? APP_NAME}
            </span>
          </Link>

          <nav className="ml-5 hidden items-center gap-1 md:flex">
            <NavigationLinks items={NAVIGATION} />
            <AdminMenu />
          </nav>

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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

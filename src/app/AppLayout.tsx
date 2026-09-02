import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  CalendarDays,
  LogOut,
  Menu,
  Settings,
  Shield,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { AdminOnly } from '@/components/AdminOnly'
import { signOut } from '@/features/auth/api'
import { fetchPlayerCard, playerKeys } from '@/features/players/api'
import { useMyPlayerId } from '@/features/players/useMyPlayer'
import { useLeague } from '@/features/league/useLeague'
import { getAvatarUrl } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface NavigationItem {
  to: string
  label: string
  icon: typeof Users
}

const BRAND_NAME = 'Ultimate Pachangas'
const LOGO_URL = `${import.meta.env.BASE_URL}ultimate-pachangas-logo.png`

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

function navigationLinkClasses({ isActive }: { isActive: boolean }): string {
  return cn(
    'group flex min-h-13 items-center gap-3 border border-transparent px-3.5 py-2 font-heading text-xl leading-none font-semibold uppercase transition-all',
    isActive
      ? 'border-primary/70 bg-primary text-primary-foreground shadow-[0_12px_26px_rgb(234_175_53/0.18)]'
      : 'text-muted-foreground hover:border-primary/35 hover:bg-accent/70 hover:text-foreground',
  )
}

function ProfileNavigationAvatar() {
  const { data: myPlayerId } = useMyPlayerId()
  const { data: player } = useQuery({
    queryKey: playerKeys.card(myPlayerId ?? ''),
    enabled: Boolean(myPlayerId),
    queryFn: () => fetchPlayerCard(myPlayerId!),
  })
  const avatarUrl = getAvatarUrl(player?.avatarPath)

  return (
    <Avatar className="size-7 border border-primary/60 shadow-[0_0_16px_rgb(234_175_53/0.24)]">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
      <AvatarFallback className="bg-primary/15 text-primary">
        <UserRound className="size-4" aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
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
          {to === '/profile' ? (
            <ProfileNavigationAvatar />
          ) : (
            <Icon className="size-5 shrink-0" aria-hidden="true" />
          )}
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  )
}

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/league"
      className={cn(
        'flex min-w-0 items-center',
        compact ? 'gap-2.5' : 'w-full justify-center',
      )}
    >
      <img
        src={LOGO_URL}
        alt={BRAND_NAME}
        className={cn(
          'object-contain',
          compact ? 'size-10 shrink-0' : 'h-auto w-full max-w-60',
        )}
      />
      {compact ? (
        <span className="truncate font-heading text-xl leading-none font-bold uppercase">
          {BRAND_NAME}
        </span>
      ) : null}
    </Link>
  )
}

function DesktopSidebar({ onSignOut }: { onSignOut: () => void }) {
  const { data: league } = useLeague()

  return (
    <aside className="sticky top-0 hidden h-svh w-72 shrink-0 flex-col border-r border-border bg-[#090909] px-4 py-5 lg:flex">
      <BrandLockup />

      <div className="mt-7 border-t border-primary/35 pt-6">
        <p className="technical mb-3 px-3 text-[0.625rem] font-semibold text-muted-foreground uppercase">
          Competición
        </p>
        <nav className="flex flex-col gap-1.5">
          <NavigationLinks items={NAVIGATION} />
        </nav>
      </div>

      <AdminOnly>
        <div className="mt-8">
          <p className="technical mb-3 px-3 text-[0.625rem] font-semibold text-muted-foreground uppercase">
            Administración
          </p>
          <nav className="flex flex-col gap-1.5">
            <NavigationLinks items={ADMIN_NAVIGATION} />
          </nav>
        </div>
      </AdminOnly>

      <div className="mt-auto border-t border-border pt-5">
        <p className="technical px-3 text-[0.625rem] font-semibold text-muted-foreground uppercase">
          Liga activa
        </p>
        <p className="mt-1 truncate px-3 font-heading text-2xl leading-none font-bold uppercase">
          {league?.title ?? BRAND_NAME}
        </p>
        <Button
          variant="ghost"
          onClick={onSignOut}
          className="mt-5 w-full justify-start text-muted-foreground"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Salir
        </Button>
      </div>
    </aside>
  )
}

/** Shell for every signed-in page. */
export function AppLayout() {
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
    <div className="flex min-h-svh bg-background">
      <DesktopSidebar onSignOut={() => void handleSignOut()} />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-16 items-center border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menú">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto p-4">
              <SheetTitle className="sr-only">Navegación</SheetTitle>
              <BrandLockup compact />
              <nav className="mt-8 flex flex-col gap-1.5">
                <NavigationLinks
                  items={NAVIGATION}
                  onNavigate={() => setIsMenuOpen(false)}
                />
                <AdminOnly>
                  <p className="technical mt-7 mb-2 px-3 text-[0.625rem] font-semibold text-muted-foreground uppercase">
                    Administración
                  </p>
                  <NavigationLinks
                    items={ADMIN_NAVIGATION}
                    onNavigate={() => setIsMenuOpen(false)}
                  />
                </AdminOnly>
              </nav>
              <Button
                variant="ghost"
                onClick={() => void handleSignOut()}
                className="mt-8 w-full justify-start text-muted-foreground"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Salir
              </Button>
            </SheetContent>
          </Sheet>

          <div className="mx-auto">
            <BrandLockup compact />
          </div>
          <div className="size-8" aria-hidden="true" />
        </header>

        <main className="mx-auto w-full max-w-[1680px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10 xl:px-14">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

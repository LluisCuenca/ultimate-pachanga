import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { fetchMatch, matchKeys } from '@/features/matches/api'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  CalendarDays,
  Shield,
  Trophy,
  UserRound,
  Users,
  Menu,
} from 'lucide-react'
import { Brand } from '@/components/Brand'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { useMyPlayerId } from '@/features/players/useMyPlayer'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useAppMotion } from '@/lib/useAppMotion'
import { fetchPlayerCard, playerKeys } from '@/features/players/api'
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

const PAGE_TITLES: Record<string, string> = {
  '/': 'La Liga',
  '/league': 'La Liga',
  '/players': 'Jugadores',
  '/matches': 'Partidos',
  '/stats': 'Estadísticas',
  '/rankings': 'Estadísticas',
  '/league/ideal-seven': '7 ideal',
  '/profile': 'Mi perfil',
  '/matches/new': 'Nuevo partido',
  '/admin/players': 'Gestión de jugadores',
  '/admin/settings': 'Ajustes de la liga',
  '/admin/members': 'Miembros',
}

export function AppLayout() {
  const { data: myPlayerId } = useMyPlayerId()
  const { data: myPlayer } = useQuery({
    queryKey: playerKeys.card(myPlayerId ?? ''),
    enabled: Boolean(myPlayerId),
    queryFn: () => fetchPlayerCard(myPlayerId!),
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  useAppMotion(pathname)
  const path = pathname.replace(/\/$/, '') || '/'
  const detailPlayerId = path.match(/^\/players\/([^/]+)$/)?.[1]
  const detailMatchId =
    path !== '/matches/new'
      ? path.match(/^\/matches\/([^/]+)$/)?.[1]
      : undefined
  const { data: detailPlayer } = useQuery({
    queryKey: playerKeys.card(detailPlayerId ?? ''),
    enabled: Boolean(detailPlayerId),
    queryFn: () => fetchPlayerCard(detailPlayerId!),
  })
  const { data: detailMatch } = useQuery({
    queryKey: matchKeys.detail(detailMatchId ?? ''),
    enabled: Boolean(detailMatchId),
    queryFn: () => fetchMatch(detailMatchId!),
  })
  const pageTitle =
    PAGE_TITLES[path] ??
    (detailPlayerId
      ? (detailPlayer?.displayName ?? 'Jugador')
      : detailMatchId
        ? (detailMatch?.title ?? 'Partido')
        : 'Ultimate Pachangas')

  return (
    <div className="min-h-svh">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      <aside className="app-sidebar">
        <Link
          to="/league"
          className="sidebar-brand"
          aria-label="Ultimate Pachangas — Liga"
        >
          <Brand />
        </Link>
        <nav aria-label="Navegación principal" className="flex flex-col gap-2">
          <NavigationLinks items={NAVIGATION} />
        </nav>
        <div className="mt-auto">
          <NavLink to="/profile" className={navigationLinkClasses}>
            <PlayerAvatar
              name={myPlayer?.displayName ?? 'Mi perfil'}
              path={myPlayer?.avatarPath}
            />
            Mi perfil
          </NavLink>
        </div>
      </aside>
      <header className="app-topbar">
        <div className="app-topbar-inner mobile-brand-header">
          <Link to="/league" aria-label="Ir a Liga" className="header-icon">
            <Brand />
          </Link>
          <h1
            key={path}
            className="header-title mobile-page-title"
            title={pageTitle}
          >
            {pageTitle}
          </h1>
          <span className="header-title desktop-brand-title">
            ULTIMATE PACHANGAS
          </span>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menú"
                className="header-icon"
              >
                <Menu aria-hidden="true" className="size-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="top" className="mobile-navigation-sheet">
              <SheetHeader>
                <SheetTitle>Ultimate Pachangas</SheetTitle>
                <SheetDescription>Tu liga, a un toque.</SheetDescription>
              </SheetHeader>
              <nav
                aria-label="Navegación principal móvil"
                className="grid gap-2 px-4 pb-4"
              >
                <NavigationLinks
                  items={[
                    ...NAVIGATION,
                    { to: '/profile', label: 'Mi perfil', icon: UserRound },
                  ]}
                  onNavigate={() => setMenuOpen(false)}
                />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

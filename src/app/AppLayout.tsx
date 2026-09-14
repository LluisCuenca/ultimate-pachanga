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
} from 'lucide-react'
import { Brand } from '@/components/Brand'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { useMyPlayerId } from '@/features/players/useMyPlayer'
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
  const { pathname } = useLocation()
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

  const { data: myPlayerId } = useMyPlayerId()
  const { data: player } = useQuery({
    queryKey: playerKeys.card(myPlayerId ?? ''),
    enabled: Boolean(myPlayerId),
    queryFn: () => fetchPlayerCard(myPlayerId!),
  })
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
        <nav aria-label="Navegación principal" className="flex flex-col gap-2">
          <NavigationLinks items={NAVIGATION} />
        </nav>
        <div className="mt-auto">
          <NavigationLinks
            items={[{ to: '/profile', label: 'Mi perfil', icon: UserRound }]}
          />
        </div>
      </aside>
      <header className="app-topbar">
        <div className="app-topbar-inner mobile-brand-header">
          <Link to="/league" aria-label="Ir a Liga" className="header-icon">
            <Brand />
          </Link>
          <h1 className="header-title mobile-page-title" title={pageTitle}>
            {pageTitle}
          </h1>
          <span className="header-title desktop-brand-title">
            ULTIMATE PACHANGAS
          </span>
          <Link to="/profile" aria-label="Mi perfil" className="header-icon">
            <PlayerAvatar
              name={player?.displayName ?? 'Mi perfil'}
              path={player?.avatarPath}
              className="size-10"
            />
          </Link>
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

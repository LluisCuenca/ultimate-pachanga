import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Award,
  CalendarDays,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { PlayerRow } from '@/components/PlayerRow'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Brand } from '@/components/Brand'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { MarketValue } from '@/components/MarketValue'
import { MatchCard } from '@/components/MatchCard'
import { fetchPlayerCards, playerKeys } from '@/features/players/api'
import { fetchMatches, matchKeys } from '@/features/matches/api'
import {
  useLeague,
  useLeagueAttributes,
  useMembership,
} from '@/features/league/useLeague'
import { formatVictories, formatWinRate } from '@/lib/formatting'
import { isUpcomingMatch } from '@/lib/matchLifecycle'
import type { MatchRow, PlayerCardData } from '@/types/domain'

const LEADERBOARD_SIZE = 5

function LeaderboardCard({
  title,
  icon: Icon,
  players,
  renderValue,
  headingAs: Heading = 'h2',
}: {
  title: string
  headingAs?: 'h2' | 'h3'
  icon: typeof Trophy
  players: readonly PlayerCardData[]
  renderValue: (player: PlayerCardData) => React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" aria-hidden="true" />
          <Heading>{title}</Heading>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {players.map((player, index) => (
          <PlayerRow
            key={player.id}
            player={player}
            rank={index + 1}
            value={renderValue(player)}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function IdealSevenCallout() {
  return (
    <Card className="ideal-callout ideal-promo">
      <Link
        to="/league/ideal-seven"
        className="block focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset"
        aria-label="Abrir el siete ideal de la liga"
      >
        <CardContent className="ideal-promo-content">
          <div>
            <p className="section-kicker">El equipo de la liga</p>
            <h2>
              <Sparkles aria-hidden="true" />7 ideal
            </h2>
            <p>
              El mejor equipo 2-3-1 de la liga. Siete jugadores, una alineación
              para recordar.
            </p>
          </div>
          <div className="ideal-promo-art" aria-hidden="true">
            <span>7</span>
            <Brand />
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

export function LeaguePage() {
  const { data: membership } = useMembership()
  const { data: league } = useLeague()
  const { data: attributes = [] } = useLeagueAttributes()

  const {
    data: players,
    isPending: arePlayersPending,
    error: playersError,
    refetch: refetchPlayers,
  } = useQuery({
    queryKey: playerKeys.cards(membership?.leagueId ?? ''),
    enabled: Boolean(membership),
    queryFn: () => fetchPlayerCards(membership!.leagueId),
  })

  const {
    data: matches,
    isPending: areMatchesPending,
    error: matchesError,
    refetch: refetchMatches,
  } = useQuery({
    queryKey: matchKeys.list(membership?.leagueId ?? ''),
    enabled: Boolean(membership),
    queryFn: () => fetchMatches(membership!.leagueId),
  })

  // Guests play the matches but are not in the league, so nothing on this page
  // counts them: not the tiles, not the leaderboards, not the palmarés. One
  // filter covers all three because everything below hangs off it.
  const activePlayers = (players ?? []).filter(
    (player) => player.isActive && !player.isGuest,
  )
  const rankedPlayers = activePlayers.filter(
    (player) => player.matchesPlayed > 0,
  )

  const topByValue = [...rankedPlayers]
    .sort((left, right) => right.marketValueGbp - left.marketValueGbp)
    .slice(0, LEADERBOARD_SIZE)

  // Ranked by the rate that is on show, not by the raw total — a board that
  // sorts by one number and prints another is a bug waiting to be reported.
  // Matches played breaks ties, so a perfect record over more games wins.
  const topByVictories = [...rankedPlayers]
    .sort(
      (left, right) =>
        right.totalVictories / right.matchesPlayed -
          left.totalVictories / left.matchesPlayed ||
        right.matchesPlayed - left.matchesPlayed,
    )
    .slice(0, LEADERBOARD_SIZE)

  // `matches` arrives newest-first, so the latest scored match is the first
  // scored entry and the next fixture is the last upcoming one.
  const latestMatch: MatchRow | undefined = (matches ?? []).find(
    (match) => match.status === 'scored',
  )

  const nextMatch: MatchRow | undefined = (matches ?? [])
    .filter((match) => isUpcomingMatch(match.status))
    .at(-1)

  // Award holders, most-decorated first, so the dashboard shows who is actually
  // collecting them rather than an arbitrary slice of the roster.
  const awardHolders = attributes
    .filter((attribute) => attribute.points > 0)
    .map((attribute) => ({
      attribute,
      holders: rankedPlayers
        .filter((player) => (player.attributeCounts[attribute.code] ?? 0) > 0)
        .sort(
          (left, right) =>
            (right.attributeCounts[attribute.code] ?? 0) -
            (left.attributeCounts[attribute.code] ?? 0),
        )
        .slice(0, 3),
    }))
    .filter((entry) => entry.holders.length > 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="league-heading desktop-page-heading flex flex-wrap items-center gap-3">
        <h1 className="page-heading text-2xl font-bold">
          {league?.title ?? 'Liga'}
        </h1>
        {league ? (
          <Badge variant={league.status === 'active' ? 'default' : 'secondary'}>
            {league.status === 'active' ? 'Activa' : 'Inactiva'}
          </Badge>
        ) : null}
      </div>

      {matchesError && !matches ? (
        <ErrorState
          error={matchesError}
          onRetry={() => void refetchMatches()}
        />
      ) : areMatchesPending ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : latestMatch || nextMatch ? (
        <div className="league-fixtures grid gap-4 sm:grid-cols-2">
          {latestMatch ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Último partido
              </h2>
              <MatchCard match={latestMatch} />
            </section>
          ) : null}
          {nextMatch ? (
            <section className="league-next-match order-first flex flex-col gap-2">
              <h2 className="text-sm font-semibold tracking-wide text-primary uppercase">
                Próximo partido
              </h2>
              <MatchCard match={nextMatch} />
            </section>
          ) : null}
        </div>
      ) : null}

      <div className="league-secondary">
        <IdealSevenCallout />
      </div>

      {arePlayersPending ? (
        <div className="league-secondary grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      ) : playersError && !players ? (
        <ErrorState
          error={playersError}
          onRetry={() => void refetchPlayers()}
        />
      ) : activePlayers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Todavía no hay jugadores"
          description="Añade la plantilla desde la sección de gestión para empezar."
        />
      ) : rankedPlayers.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Ningún partido puntuado todavía"
          description="Las estadísticas y los valores de mercado aparecerán tras el primer partido."
        />
      ) : (
        <div className="league-secondary grid gap-4 md:grid-cols-2">
          <LeaderboardCard
            title="Mayor valor de mercado"
            icon={TrendingUp}
            players={topByValue}
            renderValue={(player) => (
              <MarketValue value={player.marketValueGbp} className="text-sm" />
            )}
          />
          <LeaderboardCard
            title="Más victoriosos"
            icon={Trophy}
            players={topByVictories}
            renderValue={(player) => (
              <span className="numeric text-sm font-semibold">
                {formatWinRate(player.totalVictories, player.matchesPlayed)}
                {/* The rate alone would rank one lucky afternoon above a
                    season of them. */}
                <span className="ml-2 font-normal text-muted-foreground">
                  {formatVictories(player.totalVictories)}/
                  {player.matchesPlayed}
                </span>
              </span>
            )}
          />
        </div>
      )}

      {awardHolders.length > 0 ? (
        <section className="league-secondary awards-group flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Award aria-hidden="true" className="size-5 text-tier-gold" />
            Palmarés
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {awardHolders.map(({ attribute, holders }) => (
              <LeaderboardCard
                key={attribute.code}
                headingAs="h3"
                title={attribute.label}
                icon={Award}
                players={holders}
                renderValue={(player) => (
                  <span className="numeric font-bold text-tier-gold">
                    ×{player.attributeCounts[attribute.code]}
                  </span>
                )}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Award, CalendarDays, TrendingUp, Trophy, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { MarketValue } from '@/components/MarketValue'
import { MatchCard } from '@/components/MatchCard'
import { BrandLogoDialog } from '@/components/BrandLogoDialog'
import {
  fetchLatestAwardWinners,
  fetchPlayerCards,
  playerKeys,
} from '@/features/players/api'
import { fetchMatches, fetchSquad, matchKeys } from '@/features/matches/api'
import { useLeague, useLeagueAttributes } from '@/features/league/useLeague'
import { formatVictories, toInitials } from '@/lib/formatting'
import { isUpcomingMatch } from '@/lib/matchLifecycle'
import { getAvatarUrl } from '@/lib/supabase'
import { BRAND_NAME } from '@/lib/brand'
import type {
  LeagueAttributeRow,
  MatchRow,
  PlayerCardData,
} from '@/types/domain'

const LEADERBOARD_SIZE = 5

interface AwardEntry {
  attribute: LeagueAttributeRow
  holders: PlayerCardData[]
}

function LeaderboardCard({
  title,
  icon: Icon,
  players,
  renderValue,
}: {
  title: string
  icon: typeof Trophy
  players: readonly PlayerCardData[]
  renderValue: (player: PlayerCardData) => React.ReactNode
}) {
  return (
    <Card className="motion-card overflow-hidden border-border/90 bg-[linear-gradient(145deg,#171717_0%,#0d0d0d_100%)]">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="flex items-center gap-3 text-3xl leading-none uppercase">
          <span className="flex size-10 items-center justify-center border border-primary/40 bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <h2>{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 pt-4">
        {players.map((player, index) => {
          const avatarUrl = getAvatarUrl(player.avatarPath)
          const initials = toInitials(
            player.firstName,
            player.lastName,
            player.displayName,
          )

          return (
            <Link
              key={player.id}
              to={`/players/${player.id}`}
              className="group flex min-h-15 items-center gap-4 border-l-2 border-transparent px-3 py-2 text-base transition-all hover:border-primary hover:bg-primary/10"
            >
              <span className="numeric w-5 text-2xl leading-none text-primary">
                {index + 1}
              </span>
              <Avatar className="size-10 shrink-0 border border-primary/55 shadow-[0_0_18px_rgb(234_175_53/0.2)] transition-transform group-hover:scale-105">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                <AvatarFallback className="bg-primary/15 font-heading text-base text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-lg font-medium">
                {player.displayName}
              </span>
              {renderValue(player)}
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

function AwardSpotlight({ entry }: { entry: AwardEntry }) {
  const player = entry.holders[0]
  const avatarUrl = getAvatarUrl(player.avatarPath)
  const initials = toInitials(
    player.firstName,
    player.lastName,
    player.displayName,
  )

  return (
    <Link
      to={`/players/${player.id}`}
      className="motion-card group relative min-h-72 overflow-hidden border border-border bg-[linear-gradient(145deg,#191919_0%,#0a0a0a_78%)] p-6 transition-all hover:-translate-y-1 hover:border-primary/70 hover:shadow-[0_22px_44px_rgb(0_0_0/0.42),0_0_32px_rgb(234_175_53/0.12)]"
    >
      <span className="absolute top-0 right-0 h-20 w-20 border-t border-r border-primary/55" />
      <span className="technical text-[0.6875rem] font-semibold text-primary uppercase">
        Último reconocimiento
      </span>
      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-heading text-3xl leading-none font-bold uppercase">
            {entry.attribute.label}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Ganador más reciente
          </p>
        </div>
        <Award className="size-8 shrink-0 text-primary" aria-hidden="true" />
      </div>
      <div className="absolute right-7 bottom-7 left-7 flex items-end gap-5 border-t border-primary/25 pt-5">
        <Avatar className="size-24 border-2 border-primary/75 shadow-[0_0_28px_rgb(234_175_53/0.28)] transition-transform duration-200 group-hover:scale-105">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-primary/15 font-heading text-3xl text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 pb-1">
          <p className="truncate font-heading text-3xl leading-none font-bold uppercase">
            {player.displayName}
          </p>
          <p className="technical mt-2 text-xs text-muted-foreground uppercase">
            {player.attributeCounts[entry.attribute.code]} en total
          </p>
        </div>
      </div>
    </Link>
  )
}

export function LeaguePage() {
  const { data: league } = useLeague()
  const { data: attributes = [] } = useLeagueAttributes()

  const {
    data: players,
    isPending: arePlayersPending,
    error: playersError,
    refetch: refetchPlayers,
  } = useQuery({
    queryKey: playerKeys.cards(league?.id ?? ''),
    enabled: Boolean(league),
    queryFn: () => fetchPlayerCards(league!.id),
  })

  const { data: matches, isPending: areMatchesPending } = useQuery({
    queryKey: matchKeys.list(league?.id ?? ''),
    enabled: Boolean(league),
    queryFn: () => fetchMatches(league!.id),
  })

  const activePlayers = (players ?? []).filter(
    (player) => player.isActive && !player.isGuest,
  )
  const rankedPlayers = activePlayers.filter(
    (player) => player.matchesPlayed > 0,
  )
  const topByValue = [...rankedPlayers]
    .sort((left, right) => right.marketValueGbp - left.marketValueGbp)
    .slice(0, LEADERBOARD_SIZE)
  const topByVictories = [...rankedPlayers]
    .sort(
      (left, right) =>
        right.totalVictories - left.totalVictories ||
        right.matchesPlayed - left.matchesPlayed,
    )
    .slice(0, LEADERBOARD_SIZE)
  const honoursCount = (player: PlayerCardData) =>
    attributes
      .filter((attribute) => attribute.points > 0)
      .reduce(
        (total, attribute) =>
          total + (player.attributeCounts[attribute.code] ?? 0),
        0,
      )
  const topByHonours = [...rankedPlayers]
    .sort(
      (left, right) =>
        honoursCount(right) - honoursCount(left) ||
        right.cardRating - left.cardRating,
    )
    .slice(0, LEADERBOARD_SIZE)
  const nextMatch: MatchRow | undefined = (matches ?? [])
    .filter((match) => isUpcomingMatch(match.status))
    .at(-1)
  const { data: nextSquad = [] } = useQuery({
    queryKey: matchKeys.squad(nextMatch?.id ?? ''),
    enabled: Boolean(nextMatch),
    queryFn: () => fetchSquad(nextMatch!.id),
  })
  const { data: latestAwardWinners = [] } = useQuery({
    queryKey: playerKeys.latestAwards(league?.id ?? ''),
    enabled: Boolean(league),
    queryFn: () => fetchLatestAwardWinners(league!.id),
  })
  const nextSquadPlayers = nextSquad
    .map((member) =>
      (players ?? []).find((player) => player.id === member.playerId),
    )
    .filter((player): player is PlayerCardData => Boolean(player))
  const recentMatches = (matches ?? [])
    .filter((match) => match.status === 'scored')
    .slice(0, 3)
  const latestAwardEntries: AwardEntry[] = attributes
    .filter((attribute) => attribute.points > 0)
    .map((attribute) => {
      const winner = latestAwardWinners.find(
        (entry) => entry.attributeCode === attribute.code,
      )
      const player = winner
        ? rankedPlayers.find((entry) => entry.id === winner.playerId)
        : undefined

      return { attribute, holders: player ? [player] : [] }
    })
    .filter((entry) => entry.holders.length > 0)

  return (
    <div className="motion-page flex flex-col gap-12">
      <h1 className="sr-only">{BRAND_NAME}</h1>
      <section className="motion-enter -mt-2 flex flex-col items-center pb-2 text-center lg:hidden">
        <BrandLogoDialog
          className="w-full max-w-64"
          imageClassName="mx-auto h-auto w-full drop-shadow-[0_0_34px_rgb(234_175_53/0.24)]"
        />
        <p
          aria-hidden="true"
          className="mt-3 font-heading text-6xl leading-[0.82] font-bold uppercase"
        >
          {BRAND_NAME}
        </p>
      </section>

      {areMatchesPending ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : nextMatch ? (
        <section className="motion-enter flex flex-col gap-4">
          <p className="section-kicker">Próxima jornada</p>
          <div className="w-full max-w-[1280px]">
            <MatchCard
              match={nextMatch}
              featured
              participants={nextSquadPlayers}
            />
          </div>
        </section>
      ) : null}

      {recentMatches.length > 0 ? (
        <section className="motion-enter flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <p className="section-kicker">Últimas jornadas</p>
            <Link
              to="/matches"
              className="technical text-xs font-semibold text-primary uppercase hover:underline"
            >
              Ver calendario
            </Link>
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            {recentMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ) : null}

      {arePlayersPending ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : playersError ? (
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
        <section className="motion-enter flex flex-col gap-5">
          <div>
            <p className="section-kicker">La élite</p>
            <h2 className="section-title mt-3">Clasificación individual</h2>
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            <LeaderboardCard
              title="Valor de mercado"
              icon={TrendingUp}
              players={topByValue}
              renderValue={(player) => (
                <MarketValue
                  value={player.marketValueGbp}
                  className="text-lg"
                />
              )}
            />
            <LeaderboardCard
              title="Más victoriosos"
              icon={Trophy}
              players={topByVictories}
              renderValue={(player) => (
                <span className="numeric text-lg font-semibold">
                  {formatVictories(player.totalVictories)} victorias
                </span>
              )}
            />
            <LeaderboardCard
              title="Palmarés"
              icon={Award}
              players={topByHonours}
              renderValue={(player) => (
                <span className="numeric text-lg font-semibold">
                  {honoursCount(player)}{' '}
                  <span className="font-normal text-muted-foreground">
                    {honoursCount(player) === 1 ? 'distinción' : 'distinciones'}
                  </span>
                </span>
              )}
            />
          </div>
        </section>
      )}

      {latestAwardEntries.length > 0 ? (
        <section className="motion-enter flex flex-col gap-5">
          <div>
            <p className="section-kicker">La vitrina</p>
            <h2 className="section-title mt-3">Reconocimientos</h2>
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            {latestAwardEntries.slice(0, 3).map((entry) => (
              <AwardSpotlight key={entry.attribute.code} entry={entry} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

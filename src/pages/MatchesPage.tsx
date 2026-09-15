import { usePageState } from '@/hooks/usePageState'
import { MatchArchive } from '@/components/MatchArchive'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminOnly } from '@/components/AdminOnly'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { MatchCard } from '@/components/MatchCard'
import { fetchMatches, matchKeys } from '@/features/matches/api'
import { useMembership, useLeague } from '@/features/league/useLeague'
import { isUpcomingMatch } from '@/lib/matchLifecycle'
import type { MatchRow } from '@/types/domain'

function MatchSection({
  title,
  matches,
}: {
  title: string
  matches: readonly MatchRow[]
}) {
  if (matches.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {/* Two columns at most: the cards are wide so the venue photograph reads
          as a place rather than a texture. */}
      <div className="grid gap-3 lg:grid-cols-2">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  )
}

export function MatchesPage() {
  const { data: membership } = useMembership()
  const {
    data: league,
    error: leagueError,
    refetch: refetchLeague,
  } = useLeague()
  const [shown, setShown] = usePageState('matches-shown', 12)

  const {
    data: matches,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: matchKeys.list(membership?.leagueId ?? ''),
    enabled: Boolean(membership),
    queryFn: () => fetchMatches(membership!.leagueId),
  })

  // Fixtures ahead read best soonest-first; results read best newest-first.
  const upcoming = (matches ?? [])
    .filter((match) => isUpcomingMatch(match.status))
    .sort(
      (left, right) =>
        new Date(left.played_at).getTime() -
        new Date(right.played_at).getTime(),
    )

  const past = (matches ?? []).filter((match) => !isUpcomingMatch(match.status))

  return (
    <div className="flex flex-col gap-6">
      <div className="page-heading-actions flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-heading text-2xl font-bold">Partidos</h1>
        <AdminOnly>
          <Button asChild>
            <Link to="/matches/new">
              <Plus className="size-4" aria-hidden="true" />
              Nuevo partido
            </Link>
          </Button>
        </AdminOnly>
      </div>

      {isPending ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : error && !matches ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (matches ?? []).length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Todavía no hay partidos"
          description="Crea el primero para empezar a convocar jugadores."
        />
      ) : (
        <>
          <MatchSection
            title="Próximo partido"
            matches={upcoming.slice(0, 1)}
          />
          {leagueError ? (
            <ErrorState
              error={leagueError}
              onRetry={() => void refetchLeague()}
            />
          ) : (
            <MatchArchive matches={past} league={league} />
          )}
          <MatchSection
            title="Más próximos partidos"
            matches={upcoming.slice(1)}
          />
          {past.length ? (
            <MatchSection title="Jugados" matches={past.slice(0, shown)} />
          ) : (
            <EmptyState
              title="Todavía no hay partidos jugados"
              description="Los encuentros terminados aparecerán aquí."
            />
          )}
          {shown < past.length ? (
            <Button
              variant="outline"
              onClick={() => setShown((value) => value + 12)}
            >
              Ver más partidos ({past.length - shown})
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}

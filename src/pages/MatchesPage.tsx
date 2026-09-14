import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useMembership } from '@/features/league/useLeague'
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
  const [search, setSearch] = useState('')
  const [year, setYear] = useState('all')
  const [shown, setShown] = useState(12)

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

  const years = [
    ...new Set(
      (matches ?? []).map((match) => new Date(match.played_at).getFullYear()),
    ),
  ].sort((a, b) => b - a)
  const filtered = past.filter(
    (match) =>
      (year === 'all' ||
        String(new Date(match.played_at).getFullYear()) === year) &&
      `${match.title} ${match.home_team_name} ${match.away_team_name} ${match.location}`
        .toLocaleLowerCase('es')
        .includes(search.trim().toLocaleLowerCase('es')),
  )
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Partidos</h1>
          <p className="text-sm text-muted-foreground">
            {isPending
              ? 'Cargando partidos…'
              : `${upcoming.length} próximos · ${past.length} jugados`}
          </p>
        </div>
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
      ) : error ? (
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
          <section
            className="ranking-panel flex flex-col gap-3"
            aria-label="Buscar partidos de esta liga"
          >
            <h2 className="flex items-center gap-2 font-bold">
              <CalendarDays
                className="size-4 text-tier-gold"
                aria-hidden="true"
              />
              Archivo de partidos
            </h2>
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <Label htmlFor="match-search">Buscar</Label>
                <Input
                  id="match-search"
                  type="search"
                  placeholder="Jornada, equipo o campo"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setShown(12)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="match-year">Año</Label>
                <select
                  id="match-year"
                  className="match-year"
                  value={year}
                  onChange={(event) => {
                    setYear(event.target.value)
                    setShown(12)
                  }}
                >
                  <option value="all">Todos</option>
                  {years.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {filtered.length} partidos en esta liga
            </p>
          </section>
          <MatchSection
            title="Más próximos partidos"
            matches={upcoming.slice(1)}
          />
          {filtered.length ? (
            <MatchSection title="Jugados" matches={filtered.slice(0, shown)} />
          ) : (
            <EmptyState
              title="No hay partidos que coincidan"
              description="Prueba otro año o cambia la búsqueda."
            />
          )}
          {shown < filtered.length ? (
            <Button
              variant="outline"
              onClick={() => setShown((value) => value + 12)}
            >
              Ver más partidos ({filtered.length - shown})
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}

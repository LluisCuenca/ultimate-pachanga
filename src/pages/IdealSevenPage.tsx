import { useMemo } from 'react'
import { Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { fetchPlayerCards, playerKeys } from '@/features/players/api'
import {
  buildIdealSevenLineup,
  fetchBestPlayerScores,
} from '@/features/league/idealSeven'
import { IdealSevenPitch } from '@/features/league/IdealSevenPitch'
import { useLeagueMetrics, useMembership } from '@/features/league/useLeague'
import { IDEAL_DISTINCTIONS } from '@/features/league/idealSevenPresentation'

const LINE_ELIGIBILITY: {
  label: string
  count: string
  positions: string[]
  extra?: string
}[] = [
  {
    label: 'Portería',
    count: '1',
    positions: ['GK', 'CB', 'LB', 'RB'],
  },
  {
    label: 'Defensa',
    count: '2',
    positions: ['CB', 'RB', 'LB', 'CDM'],
  },
  {
    label: 'Medio',
    count: '3',
    positions: ['RB', 'LB', 'CM', 'CDM', 'CAM', 'LW', 'RW'],
  },
  {
    label: 'Ataque',
    count: '1',
    positions: ['LW', 'RW', 'ST', 'CAM'],
  },
]

export function IdealSevenPage() {
  const { data: membership } = useMembership()
  const {
    data: metrics = [],
    isPending: areMetricsPending,
    error: metricsError,
    refetch: refetchMetrics,
  } = useLeagueMetrics()

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

  const eligiblePlayers = useMemo(
    () =>
      (players ?? []).filter(
        (player) =>
          player.isActive &&
          !player.isGuest &&
          player.matchesPlayed > 0 &&
          player.confidencePct === 100,
      ),
    [players],
  )
  const eligiblePlayerIds = useMemo(
    () => eligiblePlayers.map((player) => player.id),
    [eligiblePlayers],
  )

  const {
    data: bestScores = [],
    isPending: areBestScoresPending,
    error: bestScoresError,
    refetch: refetchBestScores,
  } = useQuery({
    queryKey: [
      'league',
      'ideal-seven',
      'best-scores',
      membership?.leagueId,
      eligiblePlayerIds.join('|'),
    ],
    enabled: eligiblePlayerIds.length > 0,
    queryFn: () => fetchBestPlayerScores(eligiblePlayerIds),
  })

  const lineup = useMemo(
    () =>
      buildIdealSevenLineup({
        players: players ?? [],
        metrics,
        bestScores,
      }),
    [players, metrics, bestScores],
  )

  const isPending =
    arePlayersPending ||
    areMetricsPending ||
    (eligiblePlayerIds.length > 0 && areBestScoresPending)
  const error = metricsError ?? playersError ?? bestScoresError

  return (
    <div className="flex flex-col gap-5">
      <h1 className="page-heading text-2xl font-bold">7 ideal</h1>
      {error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            void refetchPlayers()
            void refetchBestScores()
            void refetchMetrics()
          }}
        />
      ) : isPending ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Skeleton className="h-[32rem] rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      ) : !lineup ? (
        <EmptyState
          icon={Users}
          title="No hay 7 ideal todavía"
          description="Hacen falta jugadores puntuados suficientes para portería, defensa, medio y ataque, todos con 100% de confianza."
        />
      ) : (
        <div className="ideal-seven-theme flex flex-col gap-5">
          <IdealSevenPitch lineup={lineup} metrics={metrics} />
          <Card className="ideal-explanation">
            <details>
              <summary>
                Cómo se elige el 7 ideal
                <span className="text-tier-gold">Ver criterios</span>
              </summary>
              <CardHeader>
                <CardTitle>
                  <h2>Cálculo</h2>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
                <p>
                  Solo entran jugadores activos de la liga, sin invitados, con
                  al menos un partido puntuado y 100% de confianza.
                </p>
                <p>
                  El equipo usa una formación 2-3-1 con portero. Cada puesto
                  acepta solo las posiciones permitidas para esa línea.
                </p>
                <p>
                  Probamos las combinaciones posibles y nos quedamos con la de
                  más valor de mercado. Si hay empate, gana el equipo con más
                  valoración total.
                </p>
                <p>
                  La nota y los stats de ataque, defensa, táctica y físico salen
                  del mejor partido de cada jugador. Es solo para este 7 ideal.
                </p>
                <p>
                  Nada de esto cambia sus puntuaciones oficiales ni su valor
                  real en la clasificación.
                </p>

                <div className="border-t pt-3">
                  <h3 className="mb-2 text-sm font-semibold text-foreground">
                    Quién opta
                  </h3>
                  <ul className="flex flex-col gap-3">
                    {LINE_ELIGIBILITY.map((line) => (
                      <li key={line.label} className="rounded-md border p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground">
                            {line.label}
                          </span>
                          <span className="numeric rounded bg-muted px-1.5 py-0.5 text-xs font-bold text-foreground">
                            {line.count}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {line.positions.map((position) => (
                            <span
                              key={position}
                              className="rounded border bg-background px-1.5 py-0.5 text-xs font-bold text-foreground"
                            >
                              {position}
                            </span>
                          ))}
                        </div>
                        {line.extra ? (
                          <p className="mt-1 text-xs">{line.extra}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs">
                    Todos deben estar activos, no ser invitados, tener al menos
                    un partido puntuado y 100% de confianza.
                  </p>
                </div>

                <div className="border-t pt-3">
                  <h3 className="mb-2 text-sm font-semibold text-foreground">
                    Distinciones
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {Object.values(IDEAL_DISTINCTIONS).map((item) => (
                      <li key={item.label} className="flex items-start gap-2">
                        <item.icon
                          className="mt-0.5 size-4 shrink-0"
                          style={{ color: item.color }}
                          aria-hidden="true"
                        />
                        <span>
                          <span className="font-medium text-foreground">
                            {item.label}
                          </span>
                          : {item.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </details>
          </Card>
        </div>
      )}
    </div>
  )
}

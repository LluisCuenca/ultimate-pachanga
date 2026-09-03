import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CircleGauge,
  Flame,
  History,
  Radar,
  Snowflake,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AttributeBadge } from '@/components/AttributeBadge'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { MarketValue } from '@/components/MarketValue'
import { MetricRadarChart } from '@/components/MetricRadarChart'
import { PlayerCard } from '@/components/PlayerCard'
import {
  fetchPlayerCard,
  fetchPlayerHistory,
  playerKeys,
} from '@/features/players/api'
import {
  useLeagueAttributes,
  useLeagueMetrics,
} from '@/features/league/useLeague'
import {
  formatMatchDate,
  formatPosition,
  formatScore,
  formatVictories,
  formatWinRate,
} from '@/lib/formatting'
import type { PlayerCardData } from '@/types/domain'

function PlayerStatusSummary({ player }: { player: PlayerCardData }) {
  const state = player.formState
  const stateDetails =
    state === 'fire'
      ? { label: 'En racha', Icon: Flame, className: 'text-red-400' }
      : state === 'ice'
        ? { label: 'Enfriándose', Icon: Snowflake, className: 'text-cyan-200' }
        : state === 'down'
          ? {
              label: 'Por debajo de su media',
              Icon: ArrowDown,
              className: 'text-rose-300',
            }
          : state === 'up'
            ? {
                label: 'Por encima de su media',
                Icon: ArrowUp,
                className: 'text-emerald-300',
              }
            : {
                label: 'Sin tendencia',
                Icon: CircleGauge,
                className: 'text-muted-foreground',
              }
  const boundedConfidence = Math.min(100, Math.max(0, player.confidencePct))

  return (
    <div className="mt-5 grid grid-cols-2 gap-4">
      <div className="border border-primary/25 bg-black/20 p-4">
        <p className="technical text-[0.6875rem] text-muted-foreground uppercase">
          Confianza
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="size-12 rounded-full border border-primary/60 p-1"
            style={{
              background: `conic-gradient(var(--primary) ${boundedConfidence}%, rgb(0 0 0 / 0.75) 0)`,
            }}
          >
            <span className="block size-full rounded-full bg-card" />
          </span>
          <span className="numeric text-4xl leading-none text-primary">
            {Math.round(boundedConfidence)}%
          </span>
        </div>
      </div>
      <div className="border border-primary/25 bg-black/20 p-4">
        <p className="technical text-[0.6875rem] text-muted-foreground uppercase">
          Estado actual
        </p>
        <div className="mt-4 flex items-center gap-3">
          <stateDetails.Icon
            className={`size-8 ${stateDetails.className}`}
            aria-hidden="true"
          />
          <span className="font-heading text-2xl leading-none font-bold uppercase">
            {stateDetails.label}
          </span>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  children,
  featured = false,
}: {
  label: string
  children: React.ReactNode
  featured?: boolean
}) {
  return (
    <div
      className={
        featured
          ? 'flex min-h-28 flex-col justify-between border-b border-primary/30 py-4'
          : 'flex min-h-14 items-baseline justify-between gap-4 border-b border-border/70 py-3 last:border-b-0'
      }
    >
      <dt className="technical text-[0.6875rem] font-medium text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={
          featured ? 'text-left' : 'text-right text-base font-semibold'
        }
      >
        {children}
      </dd>
    </div>
  )
}

export function PlayerDetailPage() {
  const { playerId = '' } = useParams()
  const { data: metrics = [] } = useLeagueMetrics()
  const { data: attributes = [] } = useLeagueAttributes()

  const {
    data: player,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: playerKeys.card(playerId),
    enabled: Boolean(playerId),
    queryFn: () => fetchPlayerCard(playerId),
  })

  const {
    data: history = [],
    isPending: isHistoryPending,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: playerKeys.history(playerId),
    enabled: Boolean(playerId),
    queryFn: () => fetchPlayerHistory(playerId),
  })

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-40" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[28rem] rounded-xl lg:h-[34rem]" />
          <Skeleton className="h-[28rem] rounded-xl lg:h-[34rem]" />
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => void refetch()} />
  }

  if (!player) {
    return (
      <EmptyState
        title="No se encontró el jugador"
        description="Puede que se haya eliminado o que el enlace sea incorrecto."
        action={
          <Button asChild variant="outline">
            <Link to="/players">Volver a jugadores</Link>
          </Button>
        }
      />
    )
  }

  const earnedAttributes = attributes.filter(
    (attribute) => (player.attributeCounts[attribute.code] ?? 0) > 0,
  )

  return (
    <div className="flex flex-col gap-8">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/players">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Jugadores
        </Link>
      </Button>

      <section className="grid items-stretch gap-6 lg:grid-cols-2">
        <PlayerCard
          player={player}
          metrics={metrics}
          showcase
          className="h-full lg:min-h-[34rem]"
        />

        <Card className="h-full border-primary/25 bg-[linear-gradient(145deg,#181818_0%,#0e0e0e_100%)]">
          <CardHeader className="border-b border-primary/20">
            <p className="section-kicker text-primary">Ficha de jugador</p>
            <CardTitle className="mt-3 text-5xl leading-none uppercase">
              <h1>{player.displayName}</h1>
            </CardTitle>
            <p className="technical text-xs text-muted-foreground uppercase">
              {player.preferredPosition} ·{' '}
              {formatPosition(player.preferredPosition)}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <dl className="grid gap-x-8 md:grid-cols-2">
              <SummaryRow label="Valor de mercado" featured>
                <MarketValue
                  value={player.marketValueGbp}
                  exact
                  className="text-5xl leading-none text-primary"
                />
              </SummaryRow>
              <SummaryRow label="Valoración" featured>
                <span className="numeric text-5xl leading-none text-primary">
                  {player.cardRating}
                </span>
              </SummaryRow>
              <SummaryRow label="Partidos jugados">
                <span className="numeric text-xl">{player.matchesPlayed}</span>
              </SummaryRow>
              <SummaryRow label="Victorias">
                <span className="numeric text-xl">
                  {formatWinRate(player.totalVictories, player.matchesPlayed)}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {formatVictories(player.totalVictories)}/
                    {player.matchesPlayed}
                  </span>
                </span>
              </SummaryRow>
              <SummaryRow label="Goles">
                <span className="numeric text-xl">{player.totalGoals}</span>
              </SummaryRow>
              <SummaryRow label="Media histórica">
                <span className="numeric text-xl">
                  {formatScore(player.careerAverage)}
                </span>
              </SummaryRow>
              <SummaryRow label="Última puntuación">
                <span className="numeric text-xl">
                  {formatScore(player.latestScore)}
                </span>
              </SummaryRow>
            </dl>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-3 text-4xl leading-none uppercase">
            <History className="size-7 text-primary" aria-hidden="true" />
            <h2>Historial de partidos</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isHistoryPending ? (
            <Skeleton className="h-24" />
          ) : historyError ? (
            <ErrorState
              error={historyError}
              onRetry={() => void refetchHistory()}
              className="border-0 py-6"
            />
          ) : history.length === 0 ? (
            <EmptyState
              icon={History}
              title="Sin partidos puntuados"
              description="Las puntuaciones aparecerán aquí cuando se importe un partido."
              className="border-0 py-6"
            />
          ) : (
            <>
              <div className="overflow-x-auto md:hidden">
                <Table className="min-w-[20rem] table-fixed text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28 px-2 text-left">
                        Jornada
                      </TableHead>
                      {metrics.map((metric) => (
                        <TableHead
                          key={metric.code}
                          className="w-9 px-1 text-center"
                          title={metric.label}
                        >
                          {metric.label.slice(0, 3)}
                        </TableHead>
                      ))}
                      <TableHead className="w-11 px-1 text-right">
                        Final
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry) => (
                      <TableRow key={entry.matchId}>
                        <TableCell className="px-2 py-2">
                          <Link
                            to={`/matches/${entry.matchId}`}
                            className="block truncate font-semibold hover:text-primary"
                            title={`${entry.matchTitle} · ${formatMatchDate(entry.playedAt)}`}
                          >
                            {entry.matchTitle}
                          </Link>
                        </TableCell>
                        {metrics.map((metric) => (
                          <TableCell
                            key={metric.code}
                            className="numeric px-1 py-2 text-center text-muted-foreground"
                          >
                            {formatScore(
                              entry.metricScores[metric.code] ?? null,
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="numeric px-1 py-2 text-right text-base font-bold text-primary">
                          {formatScore(entry.finalScore)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partido</TableHead>
                      <TableHead>Fecha</TableHead>
                      {metrics.map((metric) => (
                        <TableHead key={metric.code} className="text-right">
                          {metric.label}
                        </TableHead>
                      ))}
                      <TableHead className="text-right">Goles</TableHead>
                      <TableHead className="text-right">Victoria</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead>Atributos</TableHead>
                      <TableHead className="text-right">Final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry) => (
                      <TableRow key={entry.matchId}>
                        <TableCell className="font-medium">
                          {entry.matchTitle}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatMatchDate(entry.playedAt)}
                        </TableCell>
                        {metrics.map((metric) => (
                          <TableCell
                            key={metric.code}
                            className="numeric text-right"
                          >
                            {formatScore(
                              entry.metricScores[metric.code] ?? null,
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="numeric text-right">
                          {entry.goals}
                        </TableCell>
                        <TableCell className="numeric text-right">
                          {formatVictories(entry.victory)}
                        </TableCell>
                        <TableCell className="numeric text-right">
                          {formatScore(entry.baseScore)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {entry.attributes.map((attribute) => (
                              <AttributeBadge
                                key={attribute.code}
                                label={attribute.label}
                                points={attribute.points}
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="numeric text-right text-lg font-bold text-primary">
                          {formatScore(entry.finalScore)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-[linear-gradient(135deg,#131313_0%,#0c0c0c_100%)]">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-3 text-4xl leading-none uppercase">
            <Radar className="size-7 text-primary" aria-hidden="true" />
            <h2>Rendimiento</h2>
          </CardTitle>
          <p className="body-copy mt-2 text-muted-foreground">
            Medias por métrica y reconocimientos obtenidos en la competición.
          </p>
        </CardHeader>
        <CardContent className="grid gap-8 pt-7 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col justify-center border-r-0 border-primary/20 xl:border-r xl:pr-8">
            <p className="section-kicker text-primary">Estado de forma</p>
            <PlayerStatusSummary player={player} />
            <p className="section-kicker mt-8 text-primary">Distinciones</p>
            {earnedAttributes.length > 0 ? (
              <ol className="mt-6 flex flex-col divide-y divide-primary/20 border-y border-primary/20">
                {earnedAttributes.map((attribute) => (
                  <li
                    key={attribute.code}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <span className="font-heading text-3xl leading-none font-bold uppercase">
                      {attribute.label}
                    </span>
                    <span className="numeric text-4xl leading-none text-primary">
                      ×{player.attributeCounts[attribute.code]}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="body-copy mt-4 text-muted-foreground">
                Todavía no hay reconocimientos registrados.
              </p>
            )}
          </div>
          <MetricRadarChart
            player={player}
            metrics={metrics}
            className="h-[28rem] lg:h-[34rem]"
          />
        </CardContent>
      </Card>
    </div>
  )
}

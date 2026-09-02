import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, History, Radar } from 'lucide-react'
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

function SummaryRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-14 items-baseline justify-between gap-4 border-b border-border/70 py-3 last:border-b-0">
      <dt className="technical text-[0.6875rem] font-medium text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-right text-lg font-semibold">{children}</dd>
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
          <Skeleton className="h-[34rem] rounded-xl" />
          <Skeleton className="h-[34rem] rounded-xl" />
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
          className="h-full min-h-[34rem]"
        />

        <Card className="h-full border-primary/25 bg-[linear-gradient(145deg,#181818_0%,#0e0e0e_100%)]">
          <CardHeader className="border-b border-primary/20">
            <p className="section-kicker text-primary">Ficha de jugador</p>
            <CardTitle className="mt-3 text-5xl leading-none uppercase">
              <h2>Datos de competición</h2>
            </CardTitle>
            <p className="technical text-xs text-muted-foreground uppercase">
              {player.playerCode} · {player.preferredPosition} ·{' '}
              {formatPosition(player.preferredPosition)}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <dl className="grid gap-x-8 md:grid-cols-2">
              <SummaryRow label="Valor de mercado">
                <MarketValue value={player.marketValueGbp} exact />
              </SummaryRow>
              <SummaryRow label="Valoración">
                <span className="numeric text-3xl text-primary">
                  {player.cardRating}
                </span>
              </SummaryRow>
              <SummaryRow label="Partidos jugados">
                <span className="numeric">{player.matchesPlayed}</span>
              </SummaryRow>
              <SummaryRow label="Victorias">
                <span className="numeric">
                  {formatWinRate(player.totalVictories, player.matchesPlayed)}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {formatVictories(player.totalVictories)}/
                    {player.matchesPlayed}
                  </span>
                </span>
              </SummaryRow>
              <SummaryRow label="Goles">
                <span className="numeric">{player.totalGoals}</span>
              </SummaryRow>
              <SummaryRow label="Media histórica">
                <span className="numeric">
                  {formatScore(player.careerAverage)}
                </span>
              </SummaryRow>
              <SummaryRow label="Última puntuación">
                <span className="numeric">
                  {formatScore(player.latestScore)}
                </span>
              </SummaryRow>
              <SummaryRow label="Confianza">
                <span className="numeric">
                  {Math.round(player.confidencePct)}%
                </span>
              </SummaryRow>
            </dl>
          </CardContent>
        </Card>
      </section>

      <Card className="border-primary/20 bg-[linear-gradient(135deg,#131313_0%,#0c0c0c_100%)]">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-3 text-4xl leading-none uppercase">
            <Radar className="size-7 text-primary" aria-hidden="true" />
            <h2>Rendimiento</h2>
          </CardTitle>
          <p className="mt-2 text-base text-muted-foreground">
            Medias por métrica, lectura de juego y atributos obtenidos.
          </p>
        </CardHeader>
        <CardContent className="grid gap-8 pt-7 xl:grid-cols-[1.25fr_0.75fr]">
          <MetricRadarChart
            player={player}
            metrics={metrics}
            className="h-[30rem]"
          />
          <div className="flex flex-col justify-center border-l-0 border-primary/20 xl:border-l xl:pl-8">
            <p className="section-kicker text-primary">Distinciones</p>
            <h3 className="mt-3 font-heading text-4xl leading-none font-bold uppercase">
              Atributos
            </h3>
            {earnedAttributes.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {earnedAttributes.map((attribute) => (
                  <AttributeBadge
                    key={attribute.code}
                    label={attribute.label}
                    points={attribute.points}
                    count={player.attributeCounts[attribute.code]}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-base text-muted-foreground">
                Todavía no tiene atributos registrados.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
            <div className="overflow-x-auto">
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
                          {formatScore(entry.metricScores[metric.code] ?? null)}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

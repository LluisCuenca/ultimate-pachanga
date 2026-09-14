import { Link } from 'react-router'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { ScoreExtras } from '@/components/ScoreStrip'
import { compactScore, metricInitial } from '@/lib/scorePresentation'
import { formatScore } from '@/lib/formatting'
import type { LeagueMetricRow } from '@/types/domain'
import type { MatchScoreEntry } from '@/features/matches/api'

export interface MatchResultGridRow {
  playerId: string
  displayName: string
  teamName: string
  avatarPath?: string | null
  score: MatchScoreEntry | undefined
  action?: React.ReactNode
}

export function MatchResultsGrid({
  rows,
  metrics,
}: {
  rows: readonly MatchResultGridRow[]
  metrics: readonly LeagueMetricRow[]
}) {
  return (
    <div className="match-score-grid">
      <table aria-label="Puntuaciones de los jugadores">
        <colgroup>
          <col style={{ width: '34%' }} />
          {metrics.map((metric) => (
            <col key={metric.code} />
          ))}
          <col />
          <col style={{ width: '16%' }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Jugador</th>
            {metrics.map((metric) => (
              <th scope="col" key={metric.code}>
                <abbr title={metric.label}>{metricInitial(metric)}</abbr>
              </th>
            ))}
            <th scope="col">
              <abbr title="Goles">G</abbr>
            </th>
            <th scope="col">Final</th>
          </tr>
        </thead>
        {rows.map((row) => (
          <tbody key={row.playerId}>
            <tr className="match-score-main">
              <th scope="row">
                <Link
                  to={`/players/${row.playerId}`}
                  title={`${row.displayName} · ${row.teamName}`}
                  className="score-player-link"
                >
                  <PlayerAvatar
                    name={row.displayName}
                    path={row.avatarPath}
                    className="size-7"
                  />
                  <span>{row.displayName}</span>
                </Link>
              </th>
              {metrics.map((metric) => (
                <td key={metric.code}>
                  {compactScore(row.score?.metricScores[metric.code])}
                </td>
              ))}
              <td>{row.score?.goals ?? '—'}</td>
              <td>
                <strong className="final-score">
                  {formatScore(row.score?.finalScore ?? null)}
                </strong>
              </td>
            </tr>
            <tr>
              <td colSpan={metrics.length + 3} className="match-score-extras">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <ScoreExtras
                    base={row.score?.baseScore ?? null}
                    victory={row.score?.victory ?? null}
                    attributes={row.score?.attributes ?? []}
                  />
                  {row.action}
                </div>
              </td>
            </tr>
          </tbody>
        ))}
      </table>
      <p className="mt-3 text-xs text-muted-foreground">
        {metrics
          .map((metric) => `${metricInitial(metric)}: ${metric.label}`)
          .join(' · ')}{' '}
        · G: goles.
      </p>
    </div>
  )
}

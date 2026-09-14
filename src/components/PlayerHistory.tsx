import { Link } from 'react-router'
import { formatScore } from '@/lib/formatting'
import {
  metricInitial,
  shortMatchTitle,
  compactScore,
} from '@/lib/scorePresentation'
import { ScoreExtras } from '@/components/ScoreStrip'
import type { LeagueMetricRow } from '@/types/domain'
import type { PlayerMatchHistoryEntry } from '@/features/players/api'

export function PlayerHistory({
  history,
  metrics,
}: {
  history: readonly PlayerMatchHistoryEntry[]
  metrics: readonly LeagueMetricRow[]
}) {
  const columns = {
    gridTemplateColumns: `minmax(2.25rem,1.2fr) repeat(${metrics.length + 1}, minmax(0,1fr)) minmax(3.25rem,1.4fr)`,
  }
  return (
    <div className="player-history">
      <div className="history-grid history-labels" style={columns}>
        <span>J</span>
        {metrics.map((metric) => (
          <abbr key={metric.code} title={metric.label}>
            {metricInitial(metric)}
          </abbr>
        ))}
        <abbr title="Goles">G</abbr>
        <span>Final</span>
      </div>
      <ol>
        {history.map((entry) => (
          <li key={entry.matchId}>
            <Link
              to={`/matches/${entry.matchId}`}
              className="history-link"
              aria-label={`Ver ${entry.matchTitle}, puntuación final ${formatScore(entry.finalScore)}`}
            >
              <div className="history-grid" style={columns}>
                <span className="history-round" title={entry.matchTitle}>
                  {shortMatchTitle(entry.matchTitle)}
                </span>
                {metrics.map((metric) => (
                  <span key={metric.code} title={metric.label}>
                    {compactScore(entry.metricScores[metric.code] ?? null)}
                  </span>
                ))}
                <span>{entry.goals}</span>
                <strong className="final-score">
                  {formatScore(entry.finalScore)}
                </strong>
              </div>
              <ScoreExtras
                base={entry.baseScore}
                victory={entry.victory}
                attributes={entry.attributes}
              />
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">
        {metrics
          .map((metric) => `${metricInitial(metric)}: ${metric.label}`)
          .join(' · ')}{' '}
        · G: goles. Toca una jornada para ver el partido.
      </p>
    </div>
  )
}

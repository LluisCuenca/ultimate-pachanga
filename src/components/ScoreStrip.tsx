import { metricInitial, compactScore } from '@/lib/scorePresentation'
import { formatScore, formatVictories } from '@/lib/formatting'
import type { LeagueMetricRow } from '@/types/domain'

export function ScoreStrip({
  metrics,
  values,
  goals,
}: {
  metrics: readonly LeagueMetricRow[]
  values: Record<string, number>
  goals?: number | null
}) {
  return (
    <div className="score-strip">
      {metrics.map((metric) => (
        <span key={metric.code}>
          <abbr title={metric.label}>{metricInitial(metric)}</abbr>
          <b>{compactScore(values[metric.code] ?? null)}</b>
        </span>
      ))}
      {goals !== undefined ? (
        <span>
          <abbr title="Goles">G</abbr>
          <b>{goals ?? '—'}</b>
        </span>
      ) : null}
    </div>
  )
}
export function ScoreExtras({
  base,
  victory,
  attributes,
}: {
  base: number | null
  victory: number | null
  attributes: readonly { label: string }[]
}) {
  const awards = attributes.map((item) => item.label).join(' · ')
  return (
    <div className="score-extras">
      <span>Base {formatScore(base)}</span>
      <span title="Victorias">
        V {victory === null ? '—' : formatVictories(victory)}
      </span>
      <span className="truncate text-tier-gold" title={awards}>
        {awards || 'Sin atributos'}
      </span>
    </div>
  )
}

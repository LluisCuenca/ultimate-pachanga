import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Award } from 'lucide-react'
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
      {awards ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="score-awards"
              aria-label={`Ver atributos: ${awards}`}
            >
              <Award aria-hidden="true" className="size-3.5" />
              <span>{attributes.length}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="text-sm">
            <p className="mb-2 font-bold">Atributos del partido</p>
            <ul className="space-y-2">
              {attributes.map((attribute, index) => (
                <li key={index}>{attribute.label}</li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}

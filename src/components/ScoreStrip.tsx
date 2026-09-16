import { useEffect, useRef } from 'react'
import { allowsMotion } from '@/lib/useAppMotion'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Award } from 'lucide-react'
import { AwardIcon } from '@/components/AwardIcon'
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
                <li key={index} className="flex items-center gap-2">
                  <AwardIcon label={attribute.label} />
                  {attribute.label}
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}

/** The final remains readable while its breakdown is available in the same row. */
export function ScoreDetails({
  final,
  base,
  victory,
  attributes,
}: {
  final: number | null
  base: number | null
  victory: number | null
  attributes: readonly { label: string }[]
}) {
  const scoreRef = useRef<HTMLButtonElement>(null)
  const previous = useRef(final)
  useEffect(() => {
    const changed = previous.current !== final
    previous.current = final
    if (!changed || !allowsMotion() || !scoreRef.current?.animate) return
    const animation = scoreRef.current.animate(
      [
        { boxShadow: '0 0 0 2px var(--tier-gold)' },
        { boxShadow: '0 0 0 0 transparent' },
      ],
      { duration: 500 },
    )
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const cancel = () => animation.cancel()
    media.addEventListener('change', cancel)
    return () => {
      cancel()
      media.removeEventListener('change', cancel)
    }
  }, [final])
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          ref={scoreRef}
          className="final-score score-detail-trigger"
          aria-label={`Puntuación final ${formatScore(final)}. Ver desglose${attributes.length ? ` y atributos: ${attributes.map((a) => a.label).join(', ')}` : ''}`}
        >
          {formatScore(final)}
          {attributes.length > 0 && (
            <span className="score-award-dot" aria-hidden="true" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="text-sm">
        <p className="mb-2 font-bold">Desglose de puntuación</p>
        <p>
          Base {formatScore(base)} · V{' '}
          {victory === null ? '—' : formatVictories(victory)}
        </p>
        {attributes.length > 0 && (
          <ul className="mt-3 space-y-2">
            {attributes.map((attribute, index) => (
              <li key={index} className="flex items-center gap-2">
                <AwardIcon label={attribute.label} />
                {attribute.label}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 font-bold text-tier-gold">
          Final {formatScore(final)}
        </p>
      </PopoverContent>
    </Popover>
  )
}

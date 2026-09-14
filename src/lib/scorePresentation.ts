import type { LeagueMetricRow } from '@/types/domain'

export function metricInitial(metric: LeagueMetricRow) {
  return (
    (
      { attack: 'A', defence: 'D', tactics: 'T', physical: 'F' } as Record<
        string,
        string
      >
    )[metric.code] ?? metric.label.slice(0, 1).toUpperCase()
  )
}
// Abbreviate only an explicit round number; never derive it from a player's appearances.
export function shortMatchTitle(title: string) {
  const match = title.match(/(?:\bjornada\s*|\bJ\s*)(\d+)/i)
  return match ? `J${Number(match[1])}` : title
}

export function compactScore(value: number | null | undefined): string {
  return value == null
    ? '—'
    : value.toLocaleString('es-ES', { maximumFractionDigits: 2 })
}

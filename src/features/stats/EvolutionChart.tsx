import { useState } from 'react'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { X } from 'lucide-react'
import type { EvolutionRow } from '@/features/stats/evolution'

export interface EvolutionSeries {
  playerId: string
  name: string
  avatarPath?: string | null
  /** A CSS colour, kept with the player rather than with their position. */
  color: string
  dash?: string
}

interface EvolutionChartProps {
  rows: readonly EvolutionRow[]
  series: readonly EvolutionSeries[]
  /** What the y axis measures, e.g. "Valoración". */
  valueLabel: string
  domain: [number, number]
  formatValue: (value: number) => string
  onRemove: (playerId: string) => void
}

interface ChartRow extends Record<string, number | string | null> {
  label: string
  matchTitle: string
}

function toChartRows(
  rows: readonly EvolutionRow[],
  series: readonly EvolutionSeries[],
): ChartRow[] {
  return rows.map((row) => {
    const chartRow: ChartRow = { label: row.label, matchTitle: row.matchTitle }

    for (const { playerId } of series) {
      chartRow[playerId] = row.values[playerId] ?? null
    }

    return chartRow
  })
}

/** The last value each line reaches, shown in the legend. */
function toLatestValue(
  rows: readonly EvolutionRow[],
  playerId: string,
): number | null {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const value = rows[index].values[playerId]
    if (value !== null && value !== undefined) return value
  }

  return null
}

/**
 * The evolution of a chosen measure across the season's jornadas.
 *
 * Gold and neutral lines also use stable dash patterns. Each series is named
 * and carries its latest figure, so hue is never the only way to identify it. It doubles as the
 * remove control, which is where a reader looks when a line is in the way.
 */
export function EvolutionChart({
  rows,
  series,
  valueLabel,
  domain,
  formatValue,
  onRemove,
}: EvolutionChartProps) {
  const [focused, setFocused] = useState<string | null>(null)
  const activeFocus = series.some((entry) => entry.playerId === focused)
    ? focused
    : null
  const chartRows = toChartRows(rows, series)

  return (
    <div className="ranking-panel flex flex-col gap-3">
      <div className="h-80 w-full" data-testid="evolution-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartRows}
            margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
          >
            <CartesianGrid
              stroke="var(--color-border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="var(--color-border)"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              tickMargin={8}
            />
            <YAxis
              domain={domain}
              stroke="var(--color-border)"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              tickMargin={4}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: 'var(--color-muted-foreground)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null

                const row = chartRows.find((entry) => entry.label === label)
                const named = payload
                  .map((entry) => ({
                    name:
                      series.find(
                        (candidate) => candidate.playerId === entry.dataKey,
                      )?.name ?? '',
                    avatarPath: series.find(
                      (candidate) => candidate.playerId === entry.dataKey,
                    )?.avatarPath,
                    color: String(entry.color ?? ''),
                    value: typeof entry.value === 'number' ? entry.value : null,
                  }))
                  .filter((entry) => entry.value !== null)
                  .sort((left, right) => (right.value ?? 0) - (left.value ?? 0))

                return (
                  <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                    <p className="mb-1 font-semibold text-popover-foreground">
                      {row?.matchTitle ?? label}
                    </p>
                    <ul className="flex flex-col gap-0.5">
                      {named.map((entry) => (
                        <li
                          key={entry.name}
                          className="flex items-center gap-2 text-popover-foreground"
                        >
                          <span
                            aria-hidden="true"
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <PlayerAvatar
                            name={entry.name}
                            path={entry.avatarPath}
                            className="size-7"
                          />
                          <span className="flex-1 truncate">{entry.name}</span>
                          <span className="numeric font-semibold">
                            {formatValue(entry.value as number)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              }}
            />
            {series.map((entry) => (
              <Line
                key={entry.playerId}
                type="monotone"
                dataKey={entry.playerId}
                name={entry.name}
                stroke={entry.color}
                strokeDasharray={entry.dash}
                strokeWidth={activeFocus === entry.playerId ? 3 : 2}
                strokeOpacity={
                  activeFocus && activeFocus !== entry.playerId ? 0.2 : 1
                }
                dot={false}
                activeDot={{ r: 4 }}
                // A missed jornada carries the previous value, so the only gaps
                // left are the ones before a player's debut. Bridging those
                // would draw a line for matches they were not in.
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul
        className="grid gap-1 sm:grid-cols-2"
        aria-label={`Series: ${valueLabel}`}
      >
        {series.map((entry) => {
          const latest = toLatestValue(rows, entry.playerId)

          return (
            <li key={entry.playerId} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setFocused(
                    activeFocus === entry.playerId ? null : entry.playerId,
                  )
                }
                aria-pressed={activeFocus === entry.playerId}
                data-testid={`evolution-legend-${entry.playerId}`}
                title={`Destacar ${entry.name}`}
                className="leaderboard-row flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <svg
                  className="evolution-pattern"
                  viewBox="0 0 24 12"
                  aria-hidden="true"
                >
                  <line
                    x1="0"
                    y1="6"
                    x2="24"
                    y2="6"
                    stroke={entry.color}
                    strokeWidth="2"
                    strokeDasharray={entry.dash}
                  />
                </svg>
                <PlayerAvatar name={entry.name} path={entry.avatarPath} />
                <span className="min-w-0 flex-1 truncate text-left font-medium">
                  {entry.name}
                </span>
                <span className="numeric text-muted-foreground">
                  {latest === null ? '—' : formatValue(latest)}
                </span>
              </button>
              <button
                type="button"
                className="graph-remove"
                aria-label={`Quitar ${entry.name} de la gráfica`}
                onClick={() => onRemove(entry.playerId)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

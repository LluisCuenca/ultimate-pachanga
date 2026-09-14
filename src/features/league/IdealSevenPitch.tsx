import { Link } from 'react-router'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { ScoreStrip } from '@/components/ScoreStrip'
import { PlayerCard } from '@/components/PlayerCard'
import { MarketValue } from '@/components/MarketValue'
import {
  CARD_WIDTH_PERCENT,
  describeSlot,
  getPitchSlots,
} from '@/lib/formations'
import type { LeagueMetricRow } from '@/types/domain'
import type {
  IdealSevenCardStyle,
  IdealSevenLineup,
  IdealSevenPlayer,
} from '@/features/league/idealSeven'

const FORMATION = '2-3-1'

const CARD_FACE: Record<
  IdealSevenCardStyle,
  'blue' | 'black' | 'legend' | 'purple'
> = {
  blue: 'blue',
  black: 'black',
  silver: 'legend',
  purple: 'purple',
}

interface IdealSevenPitchProps {
  lineup: IdealSevenLineup
  metrics: readonly LeagueMetricRow[]
}

export function IdealSevenPitch({ lineup, metrics }: IdealSevenPitchProps) {
  const selected = [
    lineup.goalkeeper,
    ...lineup.back,
    ...lineup.middle,
    lineup.attack,
  ]
  const bySlot = new Map<number, IdealSevenPlayer>([
    [0, lineup.goalkeeper],
    ...lineup.back.map((player, index) => [index + 1, player] as const),
    ...lineup.middle.map((player, index) => [index + 3, player] as const),
    [6, lineup.attack],
  ])

  return (
    <section className="flex flex-col gap-4">
      <div className="ideal-summary">
        <div>
          <span>Formación</span>
          <strong>2-3-1</strong>
          <small>+ portero</small>
        </div>
        <div>
          <span>Media</span>
          <strong>{lineup.totalRating}</strong>
          <small>valoración</small>
        </div>
        <div className="ideal-summary-value">
          <span>Valor del equipo</span>
          <strong>
            <MarketValue value={lineup.totalMarketValueGbp} />
          </strong>
        </div>
      </div>

      <div
        className="pitch-surface relative w-full overflow-hidden rounded-xl border"
        style={{ aspectRatio: '1000 / 1250' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}pitch.webp`}
          alt=""
          className="absolute inset-0 size-full object-cover"
          draggable={false}
        />

        {getPitchSlots(FORMATION).map((slot) => {
          const entry = bySlot.get(slot.slot)
          if (!entry) return null

          return (
            <div
              key={slot.slot}
              data-testid="ideal-seven-slot"
              className="absolute"
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                width: `${CARD_WIDTH_PERCENT}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <PlayerCard
                player={entry.player}
                metrics={metrics}
                compact
                linkTo={`/players/${entry.player.id}`}
                ratingOverride={entry.displayRating}
                faceOverride={CARD_FACE[entry.cardStyle]}
              />
              <span className="sr-only">
                {entry.player.displayName}, {describeSlot(FORMATION, slot.slot)}
              </span>
            </div>
          )
        })}
      </div>

      <section className="ranking-panel">
        <h2 className="mb-3 text-lg font-bold">Los elegidos</h2>
        <ol className="ideal-selection">
          {selected.map((entry) => (
            <li key={entry.player.id} data-face={CARD_FACE[entry.cardStyle]}>
              <Link to={`/players/${entry.player.id}`} className="block p-3">
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    name={entry.player.displayName}
                    path={entry.player.avatarPath}
                    className="size-11"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">
                      {entry.player.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.player.preferredPosition} ·{' '}
                      {entry.cardStyle === 'silver'
                        ? 'Leyenda'
                        : entry.cardStyle === 'purple'
                          ? 'MVP'
                          : entry.cardStyle === 'black'
                            ? 'Defensa'
                            : '7 ideal'}
                    </span>
                  </span>
                  <span className="numeric text-xl font-black text-tier-gold">
                    {entry.displayRating}
                  </span>
                </div>
                <ScoreStrip
                  metrics={metrics}
                  values={entry.bestMetricCardStats}
                />
                <p className="mt-2 text-right text-sm">
                  <MarketValue value={entry.player.marketValueGbp} />
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </section>
  )
}

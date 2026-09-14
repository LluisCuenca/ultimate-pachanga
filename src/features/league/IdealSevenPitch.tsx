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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">7 ideal</h2>
          <p className="text-sm text-muted-foreground">
            Formación 2-3-1 + portero
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <span>
            Media{' '}
            <span className="numeric font-bold">{lineup.totalRating}</span>
          </span>
          <span>
            Valor <MarketValue value={lineup.totalMarketValueGbp} />
          </span>
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {selected.map((entry) => (
          <PlayerCard
            key={entry.player.id}
            player={entry.player}
            metrics={metrics}
            linkTo={`/players/${entry.player.id}`}
            ratingOverride={entry.displayRating}
            metricCardStatsOverride={entry.bestMetricCardStats}
            faceOverride={CARD_FACE[entry.cardStyle]}
          />
        ))}
      </div>
    </section>
  )
}

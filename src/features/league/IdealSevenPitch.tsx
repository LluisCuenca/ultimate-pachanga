import { Link } from 'react-router'
import { formatScore } from '@/lib/formatting'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { ScoreStrip } from '@/components/ScoreStrip'
import { Award } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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

const DISTINCTIONS: Record<IdealSevenCardStyle, string> = {
  silver: 'Leyenda · Mayor valoración del siete ideal',
  purple: 'Champán · Más premios MVP entre los restantes',
  black: 'Élite · Mayor valor de mercado entre los restantes',
  blue: 'Marfil · Seleccionado para el siete ideal',
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
        <div className="ideal-summary-value">
          <span>Valor del equipo</span>
          <strong>
            <MarketValue value={lineup.totalMarketValueGbp} />
          </strong>
        </div>
        <div>
          <span>Formación</span>
          <strong>2-3-1</strong>
        </div>
        <div>
          <span>Media</span>
          <strong>{formatScore(lineup.totalRating / selected.length)}</strong>
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
              data-ideal-reveal="true"
              data-motion-delay={
                slot.slot === 0
                  ? 0
                  : slot.slot < 3
                    ? 55
                    : slot.slot < 6
                      ? 110
                      : 165
              }
              className="absolute"
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                width: `calc(${CARD_WIDTH_PERCENT}% * var(--pitch-card-scale, 1))`,
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
              <Link
                to={`/players/${entry.player.id}`}
                className="ideal-selection-link block p-3"
              >
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    name={entry.player.displayName}
                    path={entry.player.avatarPath}
                    className="size-9"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">
                      {entry.player.displayName}
                    </span>
                  </span>
                  <span className="numeric text-xl font-black text-tier-gold">
                    {entry.displayRating}
                  </span>
                </div>
                <div className="ideal-selection-data">
                  <MarketValue value={entry.player.marketValueGbp} />
                </div>
              </Link>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="ideal-distinction"
                    aria-label={`Distinción de ${entry.player.displayName}`}
                  >
                    <Award className="size-4" aria-hidden="true" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="text-sm">
                  {DISTINCTIONS[entry.cardStyle]}
                  <p className="mt-3 font-semibold">
                    Su mejor partido · {formatScore(entry.bestFinalScore)}{' '}
                    puntos
                  </p>
                  <ScoreStrip
                    metrics={metrics}
                    values={entry.bestMetricCardStats}
                  />
                </PopoverContent>
              </Popover>
            </li>
          ))}
        </ol>
      </section>
    </section>
  )
}

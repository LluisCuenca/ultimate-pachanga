import { describe, expect, it } from 'vitest'
import { buildEvolutionRows, RATING_SERIES_CODE } from './evolution'
import type { ScoreTimeline, TimelineScore } from './api'

const ADA = 'player-ada'
const BEA = 'player-bea'
const CARLA = 'player-carla'

function score(
  matchId: string,
  playerId: string,
  finalScore: number,
  metricScores: Record<string, number> = {},
): TimelineScore {
  return { matchId, playerId, finalScore, metricScores }
}

/**
 * Three jornadas. Ada plays them all; Bea misses the second; Carla debuts in
 * the third.
 */
function buildTimeline(scores: TimelineScore[]): ScoreTimeline {
  return {
    matches: [
      { id: 'match-1', title: 'Jornada 1', playedAt: '2026-06-01T18:00:00Z' },
      { id: 'match-2', title: 'Jornada 2', playedAt: '2026-06-08T18:00:00Z' },
      { id: 'match-3', title: 'Jornada 3', playedAt: '2026-06-15T18:00:00Z' },
    ],
    scores,
  }
}

const METRIC_TIMELINE = buildTimeline([
  score('match-1', ADA, 30, { attack: 8, defence: 4 }),
  score('match-1', BEA, 20, { attack: 4, defence: 6 }),
  score('match-2', ADA, 34, { attack: 6, defence: 5 }),
  score('match-3', ADA, 28, { attack: 9, defence: 3 }),
  score('match-3', BEA, 22, { attack: 5, defence: 7 }),
  score('match-3', CARLA, 40, { attack: 10, defence: 2 }),
])

describe('buildEvolutionRows', () => {
  it('labels one row per scored jornada, oldest first', () => {
    const rows = buildEvolutionRows(METRIC_TIMELINE, 'attack')

    expect(rows.map((row) => row.label)).toEqual(['J1', 'J2', 'J3'])
    expect(rows.map((row) => row.matchTitle)).toEqual([
      'Jornada 1',
      'Jornada 2',
      'Jornada 3',
    ])
  })

  it('plots the metric score of each jornada', () => {
    const rows = buildEvolutionRows(METRIC_TIMELINE, 'attack')

    expect(rows.map((row) => row.values[ADA])).toEqual([8, 6, 9])
  })

  it('carries a value across a jornada the player missed', () => {
    const rows = buildEvolutionRows(METRIC_TIMELINE, 'attack')

    expect(rows.map((row) => row.values[BEA])).toEqual([4, 4, 5])
  })

  it('leaves a player without a value until their first appearance', () => {
    const rows = buildEvolutionRows(METRIC_TIMELINE, 'attack')

    expect(rows.map((row) => row.values[CARLA])).toEqual([null, null, 10])
  })

  it('ignores a metric the player was not scored on', () => {
    const rows = buildEvolutionRows(METRIC_TIMELINE, 'tactics')

    expect(rows.every((row) => row.values[ADA] === null)).toBe(true)
  })

  describe('the rating series', () => {
    it('centres everyone when a single jornada has no spread to place them in', () => {
      const rows = buildEvolutionRows(
        buildTimeline([
          score('match-1', ADA, 30, { attack: 7 }),
          score('match-1', BEA, 30, { attack: 7 }),
        ]),
        RATING_SERIES_CODE,
      )

      expect(rows[0].values[ADA]).toBe(72)
      expect(rows[0].values[BEA]).toBe(72)
    })

    /**
     * Two players two metric points apart: the mean is 7, the population
     * spread is 1, so each sits one standard deviation — eighteen points — off
     * the centre.
     */
    it('places the final-score rating basis on the distribution of the jornada', () => {
      const rows = buildEvolutionRows(
        buildTimeline([
          score('match-1', ADA, 30, { attack: 8 }),
          score('match-1', BEA, 20, { attack: 6 }),
        ]),
        RATING_SERIES_CODE,
      )

      expect(rows[0].values[ADA]).toBe(90)
      expect(rows[0].values[BEA]).toBe(54)
    })

    it('holds a rating steady over a jornada the player missed', () => {
      const rows = buildEvolutionRows(METRIC_TIMELINE, RATING_SERIES_CODE)
      const beaRatings = rows.map((row) => row.values[BEA])

      expect(beaRatings[1]).toBe(beaRatings[0])
    })

    /**
     * A squad of seven where one player is the whole story sits two and a half
     * standard deviations out, which the unbounded formula would put past the
     * end of the scale.
     */
    it('bounds a rating at 99 however far ahead of the league a player is', () => {
      const rows = buildEvolutionRows(
        buildTimeline(
          [40, 0, 0, 0, 0, 0, 0].map((finalScore, index) =>
            score('match-1', `player-${index}`, finalScore, {
              attack: index === 0 ? 10 : 0,
            }),
          ),
        ),
        RATING_SERIES_CODE,
      )

      expect(rows[0].values['player-0']).toBe(99)
    })

    it('bounds a rating at 45 however far behind a player is', () => {
      const rows = buildEvolutionRows(
        buildTimeline(
          [0, 40, 40, 40, 40, 40, 40].map((finalScore, index) =>
            score('match-1', `player-${index}`, finalScore, {
              attack: index === 0 ? 0 : 10,
            }),
          ),
        ),
        RATING_SERIES_CODE,
      )

      expect(rows[0].values['player-0']).toBe(45)
    })
  })
})

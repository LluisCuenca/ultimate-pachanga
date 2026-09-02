import { describe, expect, it } from 'vitest'
import {
  calculateAttributePoints,
  calculateBaseScore,
  applyConfidenceAdjustment,
  calculateConfidencePct,
  calculateMatchRatingScore,
  calculateMean,
  calculateScoreBreakdown,
  calculateSpread,
  calculateWeightedMetricMean,
  calculateWeightedMetricScore,
  toCardRating,
  isGoalCountValid,
  isMetricScoreInRange,
  isVictoryShareValid,
  toCardStat,
  toCardTier,
  type AttributeDefinition,
} from './scoring'

const MVP: AttributeDefinition = { code: 'mvp', label: 'MVP', points: 2 }
const PUSKAS: AttributeDefinition = {
  code: 'puskas',
  label: 'Puskas',
  points: 2,
}
const ZAMORA: AttributeDefinition = {
  code: 'zamora',
  label: 'Zamora',
  points: 2,
}
const INJURY: AttributeDefinition = {
  code: 'injury',
  label: 'Lesión',
  points: -2,
}

describe('calculateBaseScore', () => {
  // The worked example from the specification, on the post-009 scale: the sum
  // of the four metrics rather than their mean.
  it('sums the metric scores', () => {
    expect(calculateBaseScore([6, 9, 8, 7])).toBe(30)
  })

  it('handles a single metric', () => {
    expect(calculateBaseScore([8])).toBe(8)
  })

  it('refuses to total nothing', () => {
    expect(() => calculateBaseScore([])).toThrow(/at least one metric/i)
  })
})

describe('calculateAttributePoints', () => {
  it('is zero when no attributes were awarded', () => {
    expect(calculateAttributePoints([])).toBe(0)
  })

  it('sums multiple positive attributes', () => {
    expect(calculateAttributePoints([MVP, PUSKAS])).toBe(4)
  })

  it('subtracts negative attributes', () => {
    expect(calculateAttributePoints([INJURY])).toBe(-2)
  })

  it('nets positive and negative attributes against each other', () => {
    expect(calculateAttributePoints([MVP, INJURY])).toBe(0)
  })
})

describe('calculateScoreBreakdown', () => {
  // 6+9+8+7 = 30, Zamora +2, a win +2.
  it('matches the specification example: 30 base, Zamora and a win is 34', () => {
    expect(calculateScoreBreakdown([6, 9, 8, 7], [ZAMORA], 1)).toEqual({
      baseScore: 30,
      attributePoints: 2,
      victoryPoints: 2,
      finalScore: 34,
    })
  })

  it('gives a draw half the victory points', () => {
    expect(calculateScoreBreakdown([6, 9, 8, 7], [], 0.5)).toEqual({
      baseScore: 30,
      attributePoints: 0,
      victoryPoints: 1,
      finalScore: 31,
    })
  })

  it('adds nothing for a defeat', () => {
    expect(calculateScoreBreakdown([6, 9, 8, 7], [], 0).finalScore).toBe(30)
  })

  it('lets a final score fall below zero', () => {
    expect(
      calculateScoreBreakdown([1, 0, 0, 1], [INJURY, INJURY], 0).finalScore,
    ).toBe(-2)
  })
})

describe('isVictoryShareValid', () => {
  it.each([0, 0.5, 1, 0.25])('accepts %s', (share) => {
    expect(isVictoryShareValid(share)).toBe(true)
  })

  it.each([-0.1, 1.1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects %s',
    (share) => {
      expect(isVictoryShareValid(share)).toBe(false)
    },
  )
})

describe('isGoalCountValid', () => {
  it.each([0, 1, 12])('accepts %s', (goals) => {
    expect(isGoalCountValid(goals)).toBe(true)
  })

  // Half a goal is not a thing, and neither is a negative one.
  it.each([-1, 1.5, Number.NaN])('rejects %s', (goals) => {
    expect(isGoalCountValid(goals)).toBe(false)
  })
})

// Per-metric card stats are still 0-10 averages: only the overall rating
// changed in 009, and that one is population-relative and lives in the view.
describe('toCardStat', () => {
  it('scales a 0-10 average onto 0-99', () => {
    expect(toCardStat(7.5)).toBe(75)
  })

  it('clamps above 99', () => {
    // A final score of 12.0 would scale to 120.
    expect(toCardStat(12)).toBe(99)
  })

  it('clamps below 0', () => {
    expect(toCardStat(-3)).toBe(0)
  })

  it('rounds to the nearest whole stat', () => {
    expect(toCardStat(8.25)).toBe(83)
    expect(toCardStat(9.875)).toBe(99)
    expect(toCardStat(7.749)).toBe(77)
  })

  // PostgreSQL rounds halves away from zero; Math.round rounds them up.
  it('rounds halves away from zero, as PostgreSQL does', () => {
    expect(toCardStat(8.25)).toBe(83)
    expect(toCardStat(0.25)).toBe(3)
  })

  it('has no value for a player with no average', () => {
    expect(toCardStat(null)).toBeNull()
    expect(toCardStat(undefined)).toBeNull()
  })
})

describe('toCardTier', () => {
  it('awards gold from 75', () => {
    expect(toCardTier(99)).toBe('gold')
    expect(toCardTier(75)).toBe('gold')
  })

  it('awards silver from 60', () => {
    expect(toCardTier(74)).toBe('silver')
    expect(toCardTier(60)).toBe('silver')
  })

  it('awards bronze below 60', () => {
    expect(toCardTier(59)).toBe('bronze')
    expect(toCardTier(0)).toBe('bronze')
  })

  it('falls back to bronze for an unrated player', () => {
    expect(toCardTier(null)).toBe('bronze')
  })
})

describe('calculateWeightedMetricScore', () => {
  it('uses the latest match directly when there is no history', () => {
    expect(calculateWeightedMetricScore(null, 8)).toBe(8)
  })

  it('gives history and the latest match the same weight', () => {
    expect(calculateWeightedMetricScore(6, 10)).toBe(8)
  })

  it('has no value without a latest match', () => {
    expect(calculateWeightedMetricScore(6, null)).toBeNull()
  })
})

describe('calculateWeightedMetricMean', () => {
  it('averages the available weighted metric scores', () => {
    expect(calculateWeightedMetricMean([8, 6, null, undefined])).toBe(7)
  })

  it('has no mean when no metric has a value', () => {
    expect(calculateWeightedMetricMean([null, undefined])).toBeNull()
  })
})

describe('calculateMatchRatingScore', () => {
  it('normalizes the final score over the default 40 metric points', () => {
    expect(calculateMatchRatingScore(34)).toBe(8.5)
  })

  it('keeps bonuses above the metric ceiling in the rating input', () => {
    expect(calculateMatchRatingScore(46)).toBe(11.5)
  })

  it('supports another metric capacity when a league changes metrics', () => {
    expect(calculateMatchRatingScore(30, 50)).toBe(6)
  })
})

describe('calculateConfidencePct', () => {
  it('uses the played share of the last six league matches', () => {
    expect(calculateConfidencePct(1)).toBeCloseTo(16.666)
    expect(calculateConfidencePct(2)).toBeCloseTo(33.333)
  })

  it('caps confidence at 100 once participation is above 60%', () => {
    expect(calculateConfidencePct(4)).toBe(100)
  })
})

describe('applyConfidenceAdjustment', () => {
  it('matches the one-match example', () => {
    expect(applyConfidenceAdjustment(99, (1 / 6) * 100)).toBe(90)
  })

  it('matches the two-match example', () => {
    expect(applyConfidenceAdjustment(77, (2 / 6) * 100)).toBe(70)
  })
})

describe('calculateMean and calculateSpread', () => {
  it('has no mean for an empty population', () => {
    expect(calculateMean([])).toBeNull()
    expect(calculateSpread([])).toBe(0)
  })

  it('reports no spread when everyone scored the same', () => {
    expect(calculateMean([30, 30, 30])).toBe(30)
    expect(calculateSpread([30, 30, 30])).toBe(0)
  })

  // Population rather than sample: 20 and 30 are 5 either side of 25, not 7.07.
  it('measures the population deviation, as stddev_pop does', () => {
    expect(calculateSpread([20, 30])).toBe(5)
  })
})

describe('toCardRating', () => {
  it('centres a player when there is no spread to place them in', () => {
    expect(toCardRating(8, 8, 0)).toBe(72)
    expect(toCardRating(null, 7, 1)).toBe(72)
    expect(toCardRating(8, null, 1)).toBe(72)
  })

  it('moves eighteen points per standard deviation', () => {
    expect(toCardRating(8, 7, 1)).toBe(90)
    expect(toCardRating(6, 7, 1)).toBe(54)
    expect(toCardRating(7, 7, 1)).toBe(72)
  })

  it('bounds the scale at 45 and 99', () => {
    expect(toCardRating(10, 7, 1)).toBe(99)
    expect(toCardRating(4, 7, 1)).toBe(45)
  })
})

describe('isMetricScoreInRange', () => {
  const attack = {
    code: 'attack',
    label: 'Ataque',
    minimumScore: 0,
    maximumScore: 10,
  }

  it('accepts the boundaries', () => {
    expect(isMetricScoreInRange(0, attack)).toBe(true)
    expect(isMetricScoreInRange(10, attack)).toBe(true)
  })

  it('rejects values outside the range', () => {
    expect(isMetricScoreInRange(-1, attack)).toBe(false)
    expect(isMetricScoreInRange(11, attack)).toBe(false)
  })

  it('rejects values that are not finite numbers', () => {
    expect(isMetricScoreInRange(Number.NaN, attack)).toBe(false)
    expect(isMetricScoreInRange(Number.POSITIVE_INFINITY, attack)).toBe(false)
  })
})

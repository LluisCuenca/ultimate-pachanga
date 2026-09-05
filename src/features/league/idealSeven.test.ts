import { describe, expect, it, vi } from 'vitest'
import {
  buildIdealSevenLineup,
  type BestPlayerScore,
} from '@/features/league/idealSeven'
import { buildMetric, buildPlayerCard, TEST_METRICS } from '@/test/factories'
import type { PlayerCardData, PlayerPosition } from '@/types/domain'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

function player({
  id,
  position,
  best,
  value = best * 1_000,
  defence = best,
  mvp = 0,
  confidence = 100,
}: {
  id: string
  position: PlayerPosition
  best: number
  value?: number
  defence?: number
  mvp?: number
  confidence?: number
}): PlayerCardData {
  return buildPlayerCard({
    id,
    playerCode: id,
    firstName: id,
    lastName: 'Player',
    displayName: id,
    preferredPosition: position,
    matchesPlayed: 3,
    weightedPerformanceScore: best / 4,
    marketValueGbp: value,
    confidencePct: confidence,
    metricCardStats: { attack: best, defence, tactics: best, physical: best },
    attributeCounts: { mvp },
  })
}

function bestScores(players: readonly PlayerCardData[]): BestPlayerScore[] {
  return players.map((entry) => ({
    playerId: entry.id,
    bestFinalScore: Number(entry.playerCode),
    metricScores: { attack: 9, defence: 8, tactics: 7, physical: 6 },
  }))
}

function lineupOf(players: readonly PlayerCardData[]) {
  return buildIdealSevenLineup({
    players,
    metrics: TEST_METRICS,
    bestScores: bestScores(players),
  })
}

function ids(players: readonly { player: PlayerCardData }[]): string[] {
  return players.map((entry) => entry.player.id)
}

describe('buildIdealSevenLineup', () => {
  it('builds a 2-3-1 side without using a player twice', () => {
    const lineup = lineupOf([
      player({ id: '20', position: 'GK', best: 20 }),
      player({ id: '19', position: 'CB', best: 19 }),
      player({ id: '18', position: 'LB', best: 18 }),
      player({ id: '17', position: 'CM', best: 17 }),
      player({ id: '16', position: 'CDM', best: 16 }),
      player({ id: '15', position: 'RW', best: 15 }),
      player({ id: '14', position: 'ST', best: 14 }),
    ])

    expect(lineup).not.toBeNull()
    const selected = [
      lineup!.goalkeeper,
      ...lineup!.back,
      ...lineup!.middle,
      lineup!.attack,
    ]

    expect(selected).toHaveLength(7)
    expect(new Set(ids(selected))).toHaveProperty('size', 7)
    expect(lineup!.back).toHaveLength(2)
    expect(lineup!.middle).toHaveLength(3)
  })

  it('keeps overlapping players for the line that makes the whole team valid', () => {
    const lineup = lineupOf([
      player({ id: '20', position: 'GK', best: 20 }),
      player({ id: '19', position: 'CB', best: 19 }),
      player({ id: '18', position: 'LB', best: 18 }),
      player({ id: '17', position: 'CM', best: 17 }),
      player({ id: '16', position: 'CDM', best: 16 }),
      player({ id: '15', position: 'RB', best: 15 }),
      player({ id: '30', position: 'CAM', best: 30 }),
    ])

    expect(lineup?.attack.player.id).toBe('30')
    expect(ids(lineup?.middle ?? [])).not.toContain('30')
  })

  it('uses market value before rating', () => {
    const lineup = lineupOf([
      player({ id: '20', position: 'GK', best: 20 }),
      player({ id: '19', position: 'CB', best: 19 }),
      player({ id: '18', position: 'LB', best: 18 }),
      player({ id: '17', position: 'CM', best: 17 }),
      player({ id: '16', position: 'CDM', best: 16 }),
      player({ id: '15', position: 'RW', best: 15 }),
      player({ id: '14', position: 'ST', best: 14 }),
      player({
        id: '10',
        position: 'CB',
        best: 10,
        value: 100_000_000,
      }),
    ])

    expect(ids(lineup?.back ?? [])).toContain('10')
  })

  it('uses rating to break tied market value', () => {
    const lowerRating = player({
      id: '18',
      position: 'CB',
      best: 17,
      value: 2_000,
    })
    const higherRating = player({
      id: '21',
      position: 'CB',
      best: 18,
      value: 2_000,
    })
    const lineup = buildIdealSevenLineup({
      players: [
        player({ id: '20', position: 'GK', best: 20 }),
        player({ id: '19', position: 'CB', best: 19 }),
        lowerRating,
        higherRating,
        player({ id: '17', position: 'CM', best: 17 }),
        player({ id: '16', position: 'CM', best: 16 }),
        player({ id: '15', position: 'RW', best: 15 }),
        player({ id: '14', position: 'ST', best: 14 }),
      ],
      metrics: TEST_METRICS,
      bestScores: bestScores([
        player({ id: '20', position: 'GK', best: 20 }),
        player({ id: '19', position: 'CB', best: 19 }),
        lowerRating,
        higherRating,
        player({ id: '17', position: 'CM', best: 17 }),
        player({ id: '16', position: 'CM', best: 16 }),
        player({ id: '15', position: 'RW', best: 15 }),
        player({ id: '14', position: 'ST', best: 14 }),
      ]),
    })

    expect(ids(lineup?.back ?? [])).toContain('21')
  })

  it('lets defensive positions qualify as goalkeeper', () => {
    const lineup = lineupOf([
      player({ id: '20', position: 'CB', best: 20 }),
      player({ id: '19', position: 'CB', best: 19 }),
      player({ id: '18', position: 'LB', best: 18 }),
      player({ id: '17', position: 'CM', best: 17 }),
      player({ id: '16', position: 'CDM', best: 16 }),
      player({ id: '15', position: 'RW', best: 15 }),
      player({ id: '14', position: 'ST', best: 14 }),
    ])

    expect(['20', '19', '18']).toContain(lineup?.goalkeeper.player.id)
  })

  it('marks black, silver and purple special cards distinctly', () => {
    const lineup = lineupOf([
      player({ id: '20', position: 'GK', best: 20, defence: 99 }),
      player({ id: '19', position: 'CB', best: 19 }),
      player({ id: '18', position: 'LB', best: 18 }),
      player({ id: '17', position: 'CM', best: 17, mvp: 4 }),
      player({ id: '16', position: 'CDM', best: 16, mvp: 6 }),
      player({ id: '15', position: 'RW', best: 15 }),
      player({ id: '30', position: 'ST', best: 30 }),
    ])

    expect(lineup?.goalkeeper.cardStyle).toBe('black')
    expect(lineup?.attack.cardStyle).toBe('silver')
    const selected = [
      lineup!.goalkeeper,
      ...lineup!.back,
      ...lineup!.middle,
      lineup!.attack,
    ]
    expect(selected.find((entry) => entry.player.id === '16')?.cardStyle).toBe(
      'purple',
    )
  })

  it('gives Legend priority over MVP and defence cards', () => {
    const lineup = lineupOf([
      player({ id: '30', position: 'GK', best: 30, defence: 99, mvp: 10 }),
      player({ id: '19', position: 'CB', best: 19 }),
      player({ id: '18', position: 'LB', best: 18 }),
      player({ id: '17', position: 'CM', best: 17, mvp: 3 }),
      player({ id: '16', position: 'CDM', best: 16, defence: 95 }),
      player({ id: '15', position: 'RW', best: 15 }),
      player({ id: '14', position: 'ST', best: 14 }),
    ])

    const selected = [
      lineup!.goalkeeper,
      ...lineup!.back,
      ...lineup!.middle,
      lineup!.attack,
    ]

    expect(selected.find((entry) => entry.player.id === '30')?.cardStyle).toBe(
      'silver',
    )
    expect(
      selected.find((entry) => entry.cardStyle === 'purple')?.player.id,
    ).toBe('17')
    expect(
      selected.find((entry) => entry.cardStyle === 'black')?.player.id,
    ).toBe('16')
  })

  it('gives MVP priority over the defensive card', () => {
    const lineup = lineupOf([
      player({ id: '30', position: 'GK', best: 30 }),
      player({ id: '19', position: 'CB', best: 19, defence: 99, mvp: 10 }),
      player({ id: '18', position: 'LB', best: 18, defence: 95 }),
      player({ id: '17', position: 'CM', best: 17 }),
      player({ id: '16', position: 'CDM', best: 16 }),
      player({ id: '15', position: 'RW', best: 15 }),
      player({ id: '14', position: 'ST', best: 14 }),
    ])

    const selected = [
      lineup!.goalkeeper,
      ...lineup!.back,
      ...lineup!.middle,
      lineup!.attack,
    ]

    expect(selected.find((entry) => entry.player.id === '19')?.cardStyle).toBe(
      'purple',
    )
    expect(
      selected.find((entry) => entry.cardStyle === 'black')?.player.id,
    ).toBe('18')
  })

  it('returns null when the league has no active metrics', () => {
    const lineup = buildIdealSevenLineup({
      players: [player({ id: '20', position: 'GK', best: 20 })],
      metrics: [buildMetric({ maximum_score: 0 })],
      bestScores: [
        {
          playerId: '20',
          bestFinalScore: 20,
          metricScores: { attack: 9 },
        },
      ],
    })

    expect(lineup).toBeNull()
  })

  it('only includes players with full confidence', () => {
    const lineup = lineupOf([
      player({ id: '20', position: 'GK', best: 20 }),
      player({ id: '19', position: 'CB', best: 19 }),
      player({ id: '18', position: 'LB', best: 18 }),
      player({ id: '17', position: 'CM', best: 17 }),
      player({ id: '16', position: 'CDM', best: 16 }),
      player({ id: '15', position: 'RW', best: 15 }),
      player({ id: '14', position: 'ST', best: 14 }),
      player({ id: '99', position: 'ST', best: 99, confidence: 50 }),
    ])

    expect(lineup?.attack.player.id).toBe('14')
  })
})

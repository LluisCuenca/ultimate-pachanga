import { supabase } from '@/lib/supabase'
import {
  calculateMean,
  calculateMatchRatingScore,
  calculateSpread,
  toCardRating,
} from '@/lib/scoring'
import type {
  LeagueMetricRow,
  PlayerCardData,
  PlayerPosition,
} from '@/types/domain'

const DEFENCE_METRIC_CODE = 'defence'
const MVP_ATTRIBUTE_CODE = 'mvp'

const GOALKEEPER_POSITIONS = new Set<PlayerPosition>(['GK', 'CB', 'LB', 'RB'])
const BACK_POSITIONS = new Set<PlayerPosition>(['CB', 'RB', 'LB', 'CDM'])
const MIDDLE_POSITIONS = new Set<PlayerPosition>([
  'RB',
  'LB',
  'CM',
  'CDM',
  'CAM',
  'LW',
  'RW',
])
const ATTACK_POSITIONS = new Set<PlayerPosition>(['LW', 'RW', 'ST', 'CAM'])

export type IdealSevenLine = 'gk' | 'back' | 'middle' | 'attack'
export type IdealSevenCardStyle = 'blue' | 'black' | 'silver' | 'purple'

export interface BestPlayerScore {
  playerId: string
  bestFinalScore: number
  metricScores: Record<string, number>
}

export interface IdealSevenPlayer {
  player: PlayerCardData
  line: IdealSevenLine
  displayRating: number
  bestFinalScore: number
  bestMetricCardStats: Record<string, number>
  cardStyle: IdealSevenCardStyle
}

export interface IdealSevenLineup {
  goalkeeper: IdealSevenPlayer
  back: IdealSevenPlayer[]
  middle: IdealSevenPlayer[]
  attack: IdealSevenPlayer
  totalRating: number
  totalMarketValueGbp: number
}

interface Candidate {
  player: PlayerCardData
  displayRating: number
  bestFinalScore: number
  bestMetricCardStats: Record<string, number>
}

interface GroupedSelection {
  goalkeeper: Candidate
  back: Candidate[]
  middle: Candidate[]
  attack: Candidate
  totalRating: number
  totalMarketValueGbp: number
}

export async function fetchBestPlayerScores(
  playerIds: readonly string[],
): Promise<BestPlayerScore[]> {
  if (playerIds.length === 0) return []

  const { data, error } = await supabase
    .from('player_match_scores')
    .select('player_id, final_score, metric_scores, matches!inner(status)')
    .in('player_id', [...playerIds])
    .eq('matches.status', 'scored')

  if (error) throw error

  const bestByPlayerId = new Map<
    string,
    { bestFinalScore: number; metricScores: Record<string, number> }
  >()
  for (const row of data) {
    if (!row.player_id || !Number.isFinite(row.final_score)) continue
    const existing = bestByPlayerId.get(row.player_id)
    if (existing && existing.bestFinalScore >= row.final_score) continue

    bestByPlayerId.set(row.player_id, {
      bestFinalScore: row.final_score,
      metricScores: toNumberRecord(row.metric_scores),
    })
  }

  return [...bestByPlayerId.entries()].map(([playerId, best]) => ({
    playerId,
    ...best,
  }))
}

export function buildIdealSevenLineup({
  players,
  metrics,
  bestScores,
}: {
  players: readonly PlayerCardData[]
  metrics: readonly LeagueMetricRow[]
  bestScores: readonly BestPlayerScore[]
}): IdealSevenLineup | null {
  const metricCapacity = metrics.reduce(
    (total, metric) => total + metric.maximum_score,
    0,
  )
  if (metricCapacity <= 0) return null

  const eligiblePlayers = players.filter(
    (player) =>
      player.isActive &&
      !player.isGuest &&
      player.matchesPlayed > 0 &&
      player.confidencePct === 100,
  )
  const bestScoreByPlayerId = new Map(
    bestScores.map((score) => [score.playerId, score]),
  )
  const distribution = eligiblePlayers
    .map((player) => player.weightedPerformanceScore)
    .filter((score) => Number.isFinite(score))
  const leagueMean = calculateMean(distribution)
  const leagueSpread = calculateSpread(distribution)

  const candidates = eligiblePlayers
    .map((player): Candidate | null => {
      const bestScore = bestScoreByPlayerId.get(player.id)
      if (!bestScore) return null

      const matchRatingScore = calculateMatchRatingScore(
        bestScore.bestFinalScore,
        metricCapacity,
      )

      return {
        player,
        bestFinalScore: bestScore.bestFinalScore,
        bestMetricCardStats: toCardStats(bestScore.metricScores),
        displayRating: toCardRating(matchRatingScore, leagueMean, leagueSpread),
      }
    })
    .filter((candidate): candidate is Candidate => candidate !== null)

  const goalkeepers = candidates.filter(isGoalkeeperCandidate)
  const backs = candidates.filter((candidate) =>
    BACK_POSITIONS.has(candidate.player.preferredPosition),
  )
  const middles = candidates.filter((candidate) =>
    MIDDLE_POSITIONS.has(candidate.player.preferredPosition),
  )
  const attackers = candidates.filter((candidate) =>
    ATTACK_POSITIONS.has(candidate.player.preferredPosition),
  )

  let bestSelection: GroupedSelection | null = null

  for (const goalkeeper of goalkeepers) {
    for (const back of combinations(backs, 2)) {
      if (hasDuplicatePlayers([goalkeeper, ...back])) continue

      for (const middle of combinations(middles, 3)) {
        if (hasDuplicatePlayers([goalkeeper, ...back, ...middle])) continue

        for (const attack of attackers) {
          const selected = [goalkeeper, ...back, ...middle, attack]
          if (hasDuplicatePlayers(selected)) continue

          const selection = {
            goalkeeper,
            back: sortLine(back),
            middle: sortLine(middle),
            attack,
            totalRating: selected.reduce(
              (total, candidate) => total + candidate.displayRating,
              0,
            ),
            totalMarketValueGbp: selected.reduce(
              (total, candidate) => total + candidate.player.marketValueGbp,
              0,
            ),
          }

          if (
            !bestSelection ||
            compareSelections(selection, bestSelection) < 0
          ) {
            bestSelection = selection
          }
        }
      }
    }
  }

  if (!bestSelection) return null

  const styled = applyCardStyles(bestSelection)

  return {
    ...styled,
    totalRating: bestSelection.totalRating,
    totalMarketValueGbp: bestSelection.totalMarketValueGbp,
  }
}

function isGoalkeeperCandidate(candidate: Candidate): boolean {
  return GOALKEEPER_POSITIONS.has(candidate.player.preferredPosition)
}

function hasDuplicatePlayers(candidates: readonly Candidate[]): boolean {
  return (
    new Set(candidates.map((candidate) => candidate.player.id)).size !==
    candidates.length
  )
}

function combinations<T>(items: readonly T[], size: number): T[][] {
  if (size === 0) return [[]]
  if (items.length < size) return []

  const result: T[][] = []

  function visit(start: number, picked: T[]) {
    if (picked.length === size) {
      result.push([...picked])
      return
    }

    for (
      let index = start;
      index <= items.length - (size - picked.length);
      index += 1
    ) {
      picked.push(items[index])
      visit(index + 1, picked)
      picked.pop()
    }
  }

  visit(0, [])
  return result
}

function sortLine(candidates: readonly Candidate[]): Candidate[] {
  return [...candidates].sort(compareCandidates)
}

function compareCandidates(left: Candidate, right: Candidate): number {
  return (
    right.displayRating - left.displayRating ||
    right.player.marketValueGbp - left.player.marketValueGbp ||
    left.player.displayName.localeCompare(right.player.displayName, 'es') ||
    left.player.id.localeCompare(right.player.id)
  )
}

function compareSelections(
  left: GroupedSelection,
  right: GroupedSelection,
): number {
  return (
    right.totalMarketValueGbp - left.totalMarketValueGbp ||
    right.totalRating - left.totalRating ||
    selectionKey(left).localeCompare(selectionKey(right), 'es')
  )
}

function selectionKey(selection: GroupedSelection): string {
  return [
    selection.goalkeeper,
    ...selection.back,
    ...selection.middle,
    selection.attack,
  ]
    .map(
      (candidate) => `${candidate.player.displayName}:${candidate.player.id}`,
    )
    .join('|')
}

function applyCardStyles(selection: GroupedSelection): {
  goalkeeper: IdealSevenPlayer
  back: IdealSevenPlayer[]
  middle: IdealSevenPlayer[]
  attack: IdealSevenPlayer
} {
  const selected = [
    { candidate: selection.goalkeeper, line: 'gk' },
    ...selection.back.map((candidate) => ({ candidate, line: 'back' })),
    ...selection.middle.map((candidate) => ({ candidate, line: 'middle' })),
    { candidate: selection.attack, line: 'attack' },
  ] as const

  const silver = maxBy(selected, ({ candidate }) => [
    candidate.displayRating,
    candidate.player.marketValueGbp,
  ])
  const purple = maxBy(
    selected.filter(
      (entry) =>
        entry.candidate.player.id !== silver?.candidate.player.id &&
        (entry.candidate.player.attributeCounts[MVP_ATTRIBUTE_CODE] ?? 0) > 0,
    ),
    ({ candidate }) => [
      candidate.player.attributeCounts[MVP_ATTRIBUTE_CODE] ?? 0,
      candidate.displayRating,
      candidate.player.marketValueGbp,
    ],
  )
  const black = maxBy(
    selected.filter(
      (entry) =>
        entry.candidate.player.id !== silver?.candidate.player.id &&
        entry.candidate.player.id !== purple?.candidate.player.id,
    ),
    ({ candidate }) => [
      candidate.player.metricCardStats[DEFENCE_METRIC_CODE] ?? 0,
      candidate.displayRating,
      candidate.player.marketValueGbp,
    ],
  )

  const styleByPlayerId = new Map<string, IdealSevenCardStyle>()
  if (silver) styleByPlayerId.set(silver.candidate.player.id, 'silver')
  if (purple) styleByPlayerId.set(purple.candidate.player.id, 'purple')
  if (black) styleByPlayerId.set(black.candidate.player.id, 'black')

  function decorate(
    candidate: Candidate,
    line: IdealSevenLine,
  ): IdealSevenPlayer {
    return {
      ...candidate,
      line,
      cardStyle: styleByPlayerId.get(candidate.player.id) ?? 'blue',
    }
  }

  return {
    goalkeeper: decorate(selection.goalkeeper, 'gk'),
    back: selection.back.map((candidate) => decorate(candidate, 'back')),
    middle: selection.middle.map((candidate) => decorate(candidate, 'middle')),
    attack: decorate(selection.attack, 'attack'),
  }
}

function maxBy<T>(
  items: readonly T[],
  selector: (item: T) => readonly number[],
): T | null {
  let best: T | null = null
  let bestValues: readonly number[] = []

  for (const item of items) {
    const values = selector(item)
    if (!best || compareNumberTuples(values, bestValues) > 0) {
      best = item
      bestValues = values
    }
  }

  return best
}

function compareNumberTuples(
  left: readonly number[],
  right: readonly number[],
): number {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

function toNumberRecord(value: unknown): Record<string, number> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, raw]) => [key, Number(raw)] as const)
      .filter(([, parsed]) => Number.isFinite(parsed)),
  )
}

function toCardStats(scores: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(scores).map(([key, score]) => [
      key,
      Math.min(99, Math.max(0, Math.round(score * 10))),
    ]),
  )
}

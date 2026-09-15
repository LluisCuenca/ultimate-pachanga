import { useLayoutMotion } from '@/lib/useLayoutMotion'
import { Link } from 'react-router'
import { PlayerIdentity } from '@/components/PlayerRow'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { PlayerCardData } from '@/types/domain'

/** Gold, silver and bronze for the podium; plain type for everyone else. */
const PODIUM_CLASSES = [
  'text-tier-gold',
  'text-tier-silver',
  'text-tier-bronze',
]

interface RankingTableProps {
  players: readonly PlayerCardData[]
  /** Column heading for the ranked value. */
  valueLabel: string
  renderValue: (player: PlayerCardData) => React.ReactNode
  /** Secondary column, e.g. matches played for context. */
  contextLabel?: string
  renderContext?: (player: PlayerCardData) => React.ReactNode
}

export function RankingTable({
  players,
  valueLabel,
  renderValue,
  contextLabel,
  renderContext,
}: RankingTableProps) {
  const motionRoot = useLayoutMotion(
    players.map((player) => player.id).join('|'),
  )
  return (
    <div
      ref={motionRoot}
      className="ranking-table overflow-x-auto rounded-xl border"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-right">#</TableHead>
            <TableHead>Jugador</TableHead>
            {contextLabel && renderContext ? (
              <TableHead className="text-right">{contextLabel}</TableHead>
            ) : null}
            <TableHead className="text-right">{valueLabel}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, index) => {
            return (
              <TableRow
                key={player.id}
                data-motion-key={player.id}
                className="leaderboard-row ranking-player-row"
              >
                <TableCell
                  className={cn(
                    'numeric text-right font-bold',
                    PODIUM_CLASSES[index] ?? 'text-muted-foreground',
                  )}
                >
                  {index + 1}
                </TableCell>
                <TableCell>
                  <Link
                    to={`/players/${player.id}`}
                    className="ranking-player-link"
                  >
                    <PlayerIdentity player={player} />
                  </Link>
                </TableCell>
                {contextLabel && renderContext ? (
                  <TableCell className="numeric text-right text-sm text-muted-foreground">
                    {renderContext(player)}
                  </TableCell>
                ) : null}
                <TableCell className="numeric text-right font-semibold">
                  {renderValue(player)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

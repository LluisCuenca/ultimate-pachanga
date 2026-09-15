import { Link } from 'react-router'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import type { PlayerCardData } from '@/types/domain'

export function PlayerIdentity({
  player,
}: {
  player: Pick<PlayerCardData, 'displayName' | 'avatarPath'>
}) {
  return (
    <>
      <PlayerAvatar name={player.displayName} path={player.avatarPath} />
      <span className="player-row-name">{player.displayName}</span>
    </>
  )
}

/** Shared rhythm for league, podiums and compact player lists. */
export function PlayerRow({
  player,
  rank,
  value,
}: {
  player: Pick<PlayerCardData, 'id' | 'displayName' | 'avatarPath'>
  rank?: React.ReactNode
  value: React.ReactNode
}) {
  return (
    <Link
      to={`/players/${player.id}`}
      aria-label={player.displayName}
      className="player-row"
    >
      {rank !== undefined ? (
        <span className="player-row-rank">{rank}</span>
      ) : null}
      <PlayerIdentity player={player} />
      <span className="player-row-value numeric">{value}</span>
    </Link>
  )
}

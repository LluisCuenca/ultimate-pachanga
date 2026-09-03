import { Link } from 'react-router'
import { CalendarDays, MapPin } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { MatchStatusBadge } from '@/components/MatchStatusBadge'
import { VenuePhoto } from '@/components/VenuePhoto'
import {
  formatMatchDateTime,
  formatMatchRelative,
  toInitials,
} from '@/lib/formatting'
import { getAvatarUrl } from '@/lib/supabase'
import type { MatchRow, PlayerCardData } from '@/types/domain'

export function MatchCard({
  match,
  featured = false,
  participants = [],
}: {
  match: MatchRow
  featured?: boolean
  /** The featured fixture can preview the players already called up. */
  participants?: readonly PlayerCardData[]
}) {
  return (
    <Link
      to={`/matches/${match.id}`}
      className="motion-card block rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card
        className={
          featured
            ? 'grid grid-rows-[12rem_auto] gap-0 overflow-hidden border-primary/35 py-0 shadow-[0_24px_54px_rgb(0_0_0/0.45),0_0_44px_rgb(234_175_53/0.16)] transition-all hover:-translate-y-1 hover:border-primary/80 sm:grid-rows-[15rem_auto] lg:aspect-[5/2] lg:min-h-80 lg:grid-cols-[minmax(0,46%)_minmax(0,1fr)] lg:grid-rows-none'
            : 'grid aspect-video min-h-52 grid-cols-[minmax(0,42%)_minmax(0,1fr)] gap-0 py-0 shadow-[0_16px_34px_rgb(0_0_0/0.38),0_0_30px_rgb(234_175_53/0.1)] transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-[0_18px_38px_rgb(0_0_0/0.4),0_0_40px_rgb(234_175_53/0.2)] lg:min-h-56'
        }
      >
        <VenuePhoto
          match={match}
          className="motion-card-photo"
          overlayClassName={
            featured
              ? 'bg-gradient-to-b from-transparent via-card/25 to-card lg:bg-gradient-to-r'
              : undefined
          }
        />

        <div
          className={
            featured
              ? 'flex min-w-0 flex-col gap-5 px-5 py-6 sm:px-7 sm:py-8'
              : 'flex min-w-0 flex-col gap-2 py-4 pr-4 pl-3'
          }
        >
          <div className="flex items-start justify-between gap-2">
            <h3
              className={
                featured
                  ? 'technical text-xs font-semibold text-primary uppercase'
                  : 'technical text-[0.625rem] font-semibold text-muted-foreground uppercase'
              }
            >
              {match.title}
            </h3>
            <MatchStatusBadge status={match.status} />
          </div>

          <p
            className={
              featured
                ? 'motion-card-title flex min-w-0 flex-col font-heading text-3xl leading-[0.88] font-bold uppercase sm:text-5xl'
                : 'flex min-w-0 flex-col font-heading text-[1.75rem] leading-[0.9] font-bold uppercase sm:text-3xl'
            }
          >
            <span className="truncate" title={match.home_team_name}>
              {match.home_team_name}
            </span>
            <span className="truncate" title={match.away_team_name}>
              <span className="font-normal text-muted-foreground">vs </span>
              {match.away_team_name}
            </span>
          </p>

          {featured && participants.length > 0 ? (
            <div
              className="border-t border-primary/20 pt-4"
              role="group"
              aria-label={`Convocados: ${participants.map((player) => player.displayName).join(', ')}`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {participants.slice(0, 6).map((player) => {
                  const avatarUrl = getAvatarUrl(player.avatarPath)

                  return (
                    <Avatar
                      key={player.id}
                      title={player.displayName}
                      className="size-10 shrink-0 border border-primary/55 shadow-[0_0_18px_rgb(234_175_53/0.3)] sm:size-11"
                    >
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt="" />
                      ) : null}
                      <AvatarFallback className="bg-primary/15 font-heading text-sm text-primary">
                        {toInitials(
                          player.firstName,
                          player.lastName,
                          player.displayName,
                        )}
                      </AvatarFallback>
                    </Avatar>
                  )
                })}
                {participants.length > 6 ? (
                  <span className="numeric flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/45 bg-primary/10 text-sm text-primary sm:size-11">
                    +{participants.length - 6}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <dl
            className={
              featured
                ? 'mt-auto flex flex-col gap-2 text-base text-muted-foreground'
                : 'mt-1 flex flex-col gap-1.5 text-sm text-muted-foreground'
            }
          >
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Fecha</dt>
              <CalendarDays
                className={
                  featured
                    ? 'size-5 shrink-0 text-primary'
                    : 'size-3.5 shrink-0'
                }
                aria-hidden="true"
              />
              <dd className="truncate">
                {formatMatchDateTime(match.played_at)} ·{' '}
                {formatMatchRelative(match.played_at)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Lugar</dt>
              <MapPin
                className={
                  featured
                    ? 'size-5 shrink-0 text-primary'
                    : 'size-3.5 shrink-0'
                }
                aria-hidden="true"
              />
              <dd className="truncate">{match.location}</dd>
            </div>
          </dl>
        </div>
      </Card>
    </Link>
  )
}

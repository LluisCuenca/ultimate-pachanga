import { Link } from 'react-router'
import { CalendarDays, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MatchStatusBadge } from '@/components/MatchStatusBadge'
import { VenuePhoto } from '@/components/VenuePhoto'
import { formatMatchDateTime, formatMatchRelative } from '@/lib/formatting'
import type { MatchRow } from '@/types/domain'

export function MatchCard({ match }: { match: MatchRow }) {
  return (
    <Link
      to={`/matches/${match.id}`}
      className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card className="grid min-h-36 grid-cols-[38%_1fr] gap-0 py-0 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-[0_16px_32px_rgb(0_0_0/0.35)] sm:grid-cols-[42%_1fr] lg:min-h-48">
        <VenuePhoto match={match} />

        <div className="flex min-w-0 flex-col gap-1.5 py-3.5 pr-4 pl-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="technical text-[0.625rem] font-semibold text-muted-foreground uppercase">
              {match.title}
            </h3>
            <MatchStatusBadge status={match.status} />
          </div>

          <p className="flex min-w-0 flex-col font-heading text-2xl leading-[0.9] font-bold uppercase">
            <span className="truncate">{match.home_team_name}</span>
            <span className="truncate">
              <span className="font-normal text-muted-foreground">vs </span>
              {match.away_team_name}
            </span>
          </p>

          <dl className="mt-auto flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Fecha</dt>
              <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
              <dd className="truncate">
                {formatMatchDateTime(match.played_at)} ·{' '}
                {formatMatchRelative(match.played_at)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Lugar</dt>
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <dd className="truncate">{match.location}</dd>
            </div>
          </dl>
        </div>
      </Card>
    </Link>
  )
}

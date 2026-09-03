import { CalendarDays, MapPin, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MatchStatusBadge } from '@/components/MatchStatusBadge'
import { VenuePhoto } from '@/components/VenuePhoto'
import { formatMatchDateTime, formatMatchRelative } from '@/lib/formatting'
import { getMatchPhotoUrl } from '@/lib/supabase'
import { getVenueImage } from '@/lib/venues'
import type { MatchRow } from '@/types/domain'

function getHeroImageUrl(match: MatchRow): string {
  const matchPhotoUrl = getMatchPhotoUrl(match.photo_path)

  return matchPhotoUrl
    ? `${matchPhotoUrl}?v=${Date.parse(match.updated_at)}`
    : getVenueImage(match.location)
}

/** The head of a match page: its artwork, fixture and all essential context. */
export function MatchHero({ match }: { match: MatchRow }) {
  const imageUrl = getHeroImageUrl(match)
  const imageLabel = match.photo_path
    ? `Imagen de ${match.title}`
    : `Imagen del recinto ${match.location}`

  return (
    <header className="grid overflow-hidden border border-primary/25 bg-card text-card-foreground shadow-[0_20px_44px_rgb(0_0_0/0.38)] sm:grid-cols-[44%_1fr]">
      <div className="relative min-h-64 sm:min-h-full">
        <VenuePhoto
          match={match}
          className="absolute inset-0"
          overlayClassName="bg-gradient-to-b from-transparent via-card/20 to-card sm:bg-gradient-to-r sm:from-transparent sm:via-card/35 sm:to-card"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              className="absolute right-4 bottom-4 border border-primary/45 bg-black/70 text-foreground backdrop-blur hover:bg-primary hover:text-primary-foreground"
            >
              <Maximize2 className="size-4" aria-hidden="true" />
              Ver imagen
            </Button>
          </DialogTrigger>
          <DialogContent className="h-[94svh] w-[94vw] max-w-none overflow-hidden border-primary/30 bg-black p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>{imageLabel}</DialogTitle>
              <DialogDescription>
                Imagen asociada a la jornada.
              </DialogDescription>
            </DialogHeader>
            <img
              src={imageUrl}
              alt={imageLabel}
              className="size-full object-contain"
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 px-6 py-7 sm:px-9 sm:py-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="technical text-xs font-semibold text-primary uppercase">
            {match.title}
          </p>
          <MatchStatusBadge status={match.status} />
        </div>
        <h1 className="flex min-w-0 flex-col font-heading text-5xl leading-[0.84] font-bold uppercase">
          <span className="truncate">{match.home_team_name}</span>
          <span className="truncate text-muted-foreground">vs</span>
          <span className="truncate">{match.away_team_name}</span>
        </h1>
        <dl className="mt-auto flex flex-col gap-2 border-t border-primary/20 pt-5 text-base text-muted-foreground">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Fecha</dt>
            <CalendarDays
              className="size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <dd>
              {formatMatchDateTime(match.played_at)} ·{' '}
              {formatMatchRelative(match.played_at)}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Lugar</dt>
            <MapPin
              className="size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <dd>{match.location}</dd>
          </div>
        </dl>
      </div>
    </header>
  )
}

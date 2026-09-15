import { useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getVenueImage } from '@/lib/venues'
import { CalendarDays, MapPin, Expand } from 'lucide-react'
import { MatchStatusBadge } from '@/components/MatchStatusBadge'
import { VenuePhoto } from '@/components/VenuePhoto'
import { toPhotoUrl } from '@/lib/matchPhoto'
import { formatMatchDateTime, formatMatchRelative } from '@/lib/formatting'
import type { MatchRow } from '@/types/domain'

/**
 * The head of a match page: the venue photograph on the left and the fixture on
 * the right.
 *
 * On narrow screens the photograph becomes a band across the top, where a
 * side-by-side split would leave neither half enough room.
 */
export function MatchHero({ match }: { match: MatchRow }) {
  const preview = useRef<HTMLDivElement>(null)
  const fullPhoto = useRef<HTMLImageElement>(null)
  const setPhotoOrigin = () => {
    const image = fullPhoto.current
    const source = preview.current?.querySelector('img')
    if (!image || !source) return
    const from = source.getBoundingClientRect()
    const to = image.getBoundingClientRect()
    if (!to.width || !to.height) return
    image.style.setProperty(
      '--photo-x',
      `${from.left + from.width / 2 - to.left - to.width / 2}px`,
    )
    image.style.setProperty(
      '--photo-y',
      `${from.top + from.height / 2 - to.top - to.height / 2}px`,
    )
    image.style.setProperty('--photo-scale-x', `${from.width / to.width}`)
    image.style.setProperty('--photo-scale-y', `${from.height / to.height}`)
  }
  return (
    <header className="match-hero grid overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 sm:grid-cols-[42%_1fr]">
      <div ref={preview} className="match-photo-wrap">
        <VenuePhoto
          match={match}
          className="h-32 sm:h-auto sm:min-h-40"
          overlayClassName="bg-gradient-to-b from-transparent to-card sm:bg-gradient-to-r sm:from-transparent sm:via-card/40 sm:to-card"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="expand-photo"
              variant="outline"
              size="icon"
              aria-label="Ampliar imagen del partido"
            >
              <Expand aria-hidden="true" />
            </Button>
          </DialogTrigger>
          <DialogContent
            className="match-photo-dialog"
            onOpenAutoFocus={setPhotoOrigin}
          >
            <DialogTitle className="pr-8">
              {match.title} · Imagen del partido
            </DialogTitle>
            <DialogDescription className="sr-only">
              Fotografía completa del campo o del partido.
            </DialogDescription>
            <img
              ref={fullPhoto}
              onLoad={setPhotoOrigin}
              src={toPhotoUrl(match) ?? getVenueImage(match.location)}
              alt={`Campo de ${match.title}`}
              className="max-h-[75dvh] w-full object-contain"
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-heading text-2xl font-bold">{match.title}</h1>
          <MatchStatusBadge status={match.status} />
        </div>
        <p className="text-lg leading-tight font-bold">
          {match.home_team_name}{' '}
          <span className="font-normal text-muted-foreground">vs</span>{' '}
          {match.away_team_name}
        </p>
        <dl className="mt-auto flex flex-col gap-1 pt-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Fecha</dt>
            <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
            <dd>
              {formatMatchDateTime(match.played_at)} ·{' '}
              {formatMatchRelative(match.played_at)}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Lugar</dt>
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <dd>{match.location}</dd>
          </div>
        </dl>
      </div>
    </header>
  )
}

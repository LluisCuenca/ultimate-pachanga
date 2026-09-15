import { usePageState } from '@/hooks/usePageState'
import { Link } from 'react-router'
import { CalendarDays, Search, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { MatchRow } from '@/types/domain'

/** Only the current authorised league is available in the existing membership model. */
export function MatchArchive({
  matches,
  league,
}: {
  matches: readonly MatchRow[]
  league?: { id: string; title: string }
}) {
  const [query, setQuery] = usePageState('archive-query', '')
  const [searched, setSearched] = usePageState('archive-searched', false)
  const scoped = matches.filter((match) => match.league_id === league?.id)
  const search = query.trim().toLocaleLowerCase('es')
  const filtered = scoped.filter((match) => {
    if (/^\d+$/.test(search)) {
      const round = match.title.match(/(?:\bjornada\s*|\bJ\s*)(\d+)/i)
      return round !== null && Number(round[1]) === Number(search)
    }
    return `${match.title} ${match.home_team_name} ${match.away_team_name} ${match.location}`
      .toLocaleLowerCase('es')
      .includes(search)
  })
  function resetSearch() {
    setSearched(false)
  }
  return (
    <section
      className="ranking-panel match-archive"
      aria-label="Archivo de partidos"
    >
      <h2 className="flex items-center gap-2 font-bold">
        <CalendarDays className="size-4 text-primary" aria-hidden="true" />
        Archivo de partidos
      </h2>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setSearched(true)
        }}
      >
        <div className="archive-field">
          <Label htmlFor="archive-query">Buscar jornada</Label>
          <Input
            id="archive-query"
            type="search"
            placeholder="Número de jornada, p. ej. 5"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              resetSearch()
            }}
          />
        </div>
        <Button type="submit" disabled={!league}>
          <Search aria-hidden="true" />
          Buscar jornadas
        </Button>
      </form>
      {searched ? (
        <div className="archive-results">
          <p role="status" className="text-sm text-muted-foreground">
            {filtered.length
              ? `${filtered.length} jornadas encontradas`
              : 'No hay partidos que coincidan'}
          </p>
          {filtered.length ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Elige una jornada</h3>
              <ul className="archive-match-list">
                {filtered.map((match) => (
                  <li key={match.id}>
                    <Link
                      to={`/matches/${match.id}`}
                      aria-label={`Ver ${match.title}`}
                    >
                      <span>
                        <strong>{match.title}</strong>
                        <span className="block text-sm text-muted-foreground">
                          {new Date(match.played_at).toLocaleDateString(
                            'es-ES',
                          )}{' '}
                          · {match.home_team_name} / {match.away_team_name}
                        </span>
                      </span>
                      <ArrowRight
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Prueba otro número o nombre de jornada.
            </p>
          )}
        </div>
      ) : null}
    </section>
  )
}

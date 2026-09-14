import { useState } from 'react'
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
  const [year, setYear] = useState('all')
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)
  const [matchId, setMatchId] = useState('')
  const scoped = matches.filter((match) => match.league_id === league?.id)
  const years = [
    ...new Set(scoped.map((match) => new Date(match.played_at).getFullYear())),
  ].sort((a, b) => b - a)
  const filtered = scoped.filter(
    (match) =>
      (year === 'all' ||
        String(new Date(match.played_at).getFullYear()) === year) &&
      `${match.title} ${match.home_team_name} ${match.away_team_name} ${match.location}`
        .toLocaleLowerCase('es')
        .includes(query.trim().toLocaleLowerCase('es')),
  )
  function resetSearch() {
    setSearched(false)
    setMatchId('')
  }
  const selected = filtered.find((match) => match.id === matchId)
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
          setMatchId('')
        }}
      >
        <div className="archive-selectors">
          <div className="archive-field">
            <Label htmlFor="archive-year">1. Año</Label>
            <select
              id="archive-year"
              value={year}
              onChange={(event) => {
                setYear(event.target.value)
                resetSearch()
              }}
            >
              <option value="all">Todos los años</option>
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="archive-field">
            <Label htmlFor="archive-league">2. Liga</Label>
            <select
              id="archive-league"
              value={league?.id ?? ''}
              disabled={!league}
            >
              <option value={league?.id ?? ''}>
                {league?.title ?? 'Cargando liga…'}
              </option>
            </select>
          </div>
        </div>
        <div className="archive-field">
          <Label htmlFor="archive-query">
            Nombre, equipo o campo{' '}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </Label>
          <Input
            id="archive-query"
            type="search"
            placeholder="Buscar una jornada"
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
            <>
              <div className="archive-field">
                <Label htmlFor="archive-match">3. Jornada</Label>
                <select
                  id="archive-match"
                  value={matchId}
                  onChange={(event) => setMatchId(event.target.value)}
                >
                  <option value="">Elige un partido</option>
                  {filtered.map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.title} ·{' '}
                      {new Date(match.played_at).toLocaleDateString('es-ES')}
                    </option>
                  ))}
                </select>
              </div>
              {selected ? (
                <Button asChild variant="outline">
                  <Link to={`/matches/${selected.id}`}>
                    Ver {selected.title}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Prueba otro año o cambia la búsqueda.
            </p>
          )}
        </div>
      ) : null}
    </section>
  )
}

import { Award, CircleDot, Medal, Shield, Star } from 'lucide-react'

/** Shared line icons for the same recognition across league, stats and profiles. */
export function awardIcon(label: string) {
  const key = label
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return (
    (
      {
        'jugador revelacion': Medal,
        revelacion: Medal,
        mvp: Star,
        puskas: CircleDot,
        zamora: Shield,
      } as Record<string, typeof Award>
    )[key] ?? Award
  )
}

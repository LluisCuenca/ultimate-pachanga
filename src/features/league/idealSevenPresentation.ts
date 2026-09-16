import { Crown, Gem, Medal, Shield } from 'lucide-react'
import type { IdealSevenCardStyle } from './idealSeven'

export const IDEAL_DISTINCTIONS = {
  silver: {
    label: 'Leyenda',
    description:
      'Mayor valoración del 7 ideal. En caso de empate, mayor valor de mercado.',
    icon: Medal,
    face: 'legend',
    color: 'var(--ideal-legend)',
  },
  purple: {
    label: 'Champán',
    description:
      'Más premios MVP entre los restantes, con al menos uno. Desempatan la valoración y el valor de mercado.',
    icon: Gem,
    face: 'purple',
    color: 'var(--ideal-champagne)',
  },
  black: {
    label: 'Élite',
    description:
      'Mejor defensa entre los restantes. Desempatan la valoración y el valor de mercado.',
    icon: Crown,
    face: 'black',
    color: 'var(--ideal-elite)',
  },
  blue: {
    label: 'Marfil',
    description: 'Resto de jugadores seleccionados para el 7 ideal.',
    icon: Shield,
    face: 'blue',
    color: 'var(--ideal-ivory)',
  },
} as const satisfies Record<
  IdealSevenCardStyle,
  {
    label: string
    description: string
    icon: typeof Medal
    face: 'legend' | 'purple' | 'black' | 'blue'
    color: string
  }
>

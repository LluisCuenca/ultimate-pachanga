import { CalendarDays, Check, Clock3, Minus, Ban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatMatchStatus } from '@/lib/formatting'
import type { MatchStatus } from '@/types/domain'

/**
 * Colour carries the meaning at a glance: scored is done, cancelled is
 * inert, scheduled is upcoming.
 */
const STATUS_CLASSES: Record<MatchStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-primary/15 text-primary border-primary/30',
  played: 'bg-tier-silver/20 text-tier-silver border-tier-silver/40',
  scored:
    'bg-attribute-positive/15 text-attribute-positive border-attribute-positive/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
}

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const Icon = {
    draft: Minus,
    scheduled: CalendarDays,
    played: Clock3,
    scored: Check,
    cancelled: Ban,
  }[status]
  return (
    <Badge variant="outline" className={STATUS_CLASSES[status]}>
      <Icon className="size-3" aria-hidden="true" />
      {formatMatchStatus(status)}
    </Badge>
  )
}

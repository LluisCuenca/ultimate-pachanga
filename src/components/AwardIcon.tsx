import { awardIcon } from '@/lib/awardPresentation'
import { cn } from '@/lib/utils'

export function AwardIcon({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  const Icon = awardIcon(label)
  return (
    <Icon
      aria-hidden="true"
      className={cn('size-4 shrink-0 text-tier-gold', className)}
    />
  )
}

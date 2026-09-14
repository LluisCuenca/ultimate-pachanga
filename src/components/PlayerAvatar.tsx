import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export function PlayerAvatar({
  name,
  path,
  className,
}: {
  name: string
  path?: string | null
  className?: string
}) {
  return (
    <Avatar className={cn('size-9 shrink-0 ring-1 ring-border', className)}>
      {path ? (
        <AvatarImage
          src={getAvatarUrl(path) ?? undefined}
          alt=""
          loading="lazy"
          className="object-cover"
        />
      ) : null}
      <AvatarFallback className="bg-muted text-xs font-bold">
        {name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
          .toUpperCase() || '?'}
      </AvatarFallback>
    </Avatar>
  )
}

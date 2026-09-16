import { Lock, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface BalanceTeamsButtonProps {
  isAdmin: boolean
  hasEnoughPlayers: boolean
  isPending: boolean
  onBalance: () => void
}

export function BalanceTeamsButton({
  isAdmin,
  hasEnoughPlayers,
  isPending,
  onBalance,
}: BalanceTeamsButtonProps) {
  const blockedReason = !isAdmin
    ? 'Solo un administrador puede equilibrar los equipos.'
    : !hasEnoughPlayers
      ? 'Convoca al menos dos jugadores para poder repartirlos.'
      : null

  if (blockedReason)
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-muted-foreground"
            data-testid="balance-teams"
            aria-label="Equilibrar equipos: ver requisitos"
            disabled={isPending}
          >
            <Lock className="size-4" aria-hidden="true" />
            Equilibrar equipos
          </Button>
        </PopoverTrigger>
        <PopoverContent className="text-sm">
          <p className="mb-1 font-semibold">Equilibrar equipos</p>
          <p>{blockedReason}</p>
        </PopoverContent>
      </Popover>
    )

  return (
    <Button
      type="button"
      variant="default"
      size="sm"
      className="w-full"
      disabled={isPending}
      aria-busy={isPending}
      onClick={onBalance}
      data-testid="balance-teams"
    >
      <Scale className="size-4" aria-hidden="true" />
      {isPending ? 'Equilibrando…' : 'Equilibrar equipos'}
    </Button>
  )
}

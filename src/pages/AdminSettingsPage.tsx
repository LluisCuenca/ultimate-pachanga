import { Controller, useForm, useWatch } from 'react-hook-form'
import type { ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Flame, Loader2, Snowflake } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ErrorState'
import {
  updateLeagueSettings,
  type LeagueSettingsInput,
} from '@/features/league/adminApi'
import { leagueKeys, useLeague } from '@/features/league/useLeague'
import { playerKeys } from '@/features/players/api'
import { formatMarketValueExact } from '@/lib/formatting'
import { cn } from '@/lib/utils'

const settingsSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(120),
  status: z.enum(['active', 'inactive']),
  // Registered with valueAsNumber, so this receives a number rather than the
  // input's string. z.coerce would make the schema's input type `unknown`,
  // which no longer matches the form's own value type.
  marketConstantGbp: z
    .number({ message: 'Introduce un número' })
    .int('Introduce un número entero')
    .min(0, 'No puede ser negativo')
    .max(1_000_000_000, 'Demasiado grande'),
})

type SettingsValues = z.infer<typeof settingsSchema>

export function AdminSettingsPage() {
  const { data: league, isPending, error, refetch } = useLeague()
  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: (input: LeagueSettingsInput) =>
      updateLeagueSettings(league!.id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: leagueKeys.league }),
        // The market constant scales every valuation, so cards are stale too.
        queryClient.invalidateQueries({ queryKey: playerKeys.all }),
      ])
      toast.success('Ajustes guardados')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'No se pudieron guardar',
      )
    },
  })

  if (error) {
    return <ErrorState error={error} onRetry={() => void refetch()} />
  }

  if (isPending || !league) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 max-w-2xl rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Ajustes de la liga</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            <h2>Configuración</h2>
          </CardTitle>
          <CardDescription>
            El valor de mercado se recalcula al instante a partir de estos
            ajustes; no hay nada que volver a importar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            key={league.id}
            defaults={{
              title: league.title,
              status: league.status,
              marketConstantGbp: league.market_constant_gbp,
            }}
            onSubmit={(input) => save.mutateAsync(input)}
          />
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            <h2>Cómo se calculan las estadísticas</h2>
          </CardTitle>
          <CardDescription>
            Primero se calcula cada estadística, después la valoración de carta
            con victoria y atributos, y al final el valor de mercado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <div className="grid gap-4 md:grid-cols-[1fr_13rem]">
            <div className="space-y-3">
              <VisualStep
                index="1"
                title="Stats específicas"
                body="Para cada dimensión se hace la media aritmética: 50% valores históricos y 50% último partido. Ataque histórico 6 + último partido 10 = 8."
              />
              <VisualStep
                index="2"
                title="Valoración 0-99"
                body="Usa la puntuación final de todos los partidos: Estadísticas + Victorias + Atributos. 50% puntuaciones históricas, 50% último partido. Se aplica la distribución de Gauss comparando todos los jugadores entre sí."
              />
              <VisualStep
                index="3"
                title="Confianza"
                body="Se tiene en cuenta el % de asistencia en los últimos partidos. Confianzas de menos del 100% penalizan el valor de mercado."
                note="1"
              />
              <VisualStep
                index="4"
                title="Estado de forma"
                body="Resume si el jugador viene mejorando, empeorando o si su último partido se aleja de su media."
              />
              <VisualStep
                index="5"
                title="Mercado"
                body={`Valor final del jugador. Con ${formatMarketValueExact(
                  league.market_constant_gbp,
                )}, una valoración 82 vale ${formatMarketValueExact(
                  league.market_constant_gbp * 82,
                )}.`}
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/35 p-3 text-foreground">
              <div className="relative aspect-[4/5] rounded-lg border border-tier-gold/70 bg-gradient-to-b from-tier-gold-face to-tier-gold-face-deep p-3 shadow-inner">
                <span className="numeric text-3xl font-black text-tier-gold">
                  90
                </span>
                <span className="block text-xs font-bold tracking-wide opacity-80">
                  ST
                </span>
                <MiniDonut value={100} />
                <ReferenceNumber className="absolute top-3 left-3">
                  2
                </ReferenceNumber>
                <ReferenceNumber className="absolute top-3 right-10">
                  3
                </ReferenceNumber>
                <ReferenceNumber className="absolute bottom-3 left-3">
                  5
                </ReferenceNumber>
                <div className="absolute right-3 bottom-3 left-3 space-y-2">
                  <div className="h-2 rounded bg-white/65" />
                  <div className="h-2 w-2/3 rounded bg-white/40" />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <FormLegend
                  icon={<Flame className="size-4 text-red-400" />}
                  label="3 partidos mejorando"
                />
                <FormLegend
                  icon={<Snowflake className="size-4 text-cyan-200" />}
                  label="3 partidos empeorando"
                />
                <FormLegend
                  icon={<ArrowUp className="size-4 text-emerald-300" />}
                  label="mejor forma"
                />
                <FormLegend
                  icon={<ArrowDown className="size-4 text-rose-300" />}
                  label="peor forma"
                />
              </div>
            </div>
          </div>

          <p>
            <sup>1</sup> El ajuste de confianza se aplica después de la
            distribución: 99 con 1 partido de los últimos 6 baja a 90; 77 con 2
            partidos baja a 70. Los goles no suman puntos por sí solos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function VisualStep({
  index,
  title,
  body,
  note,
}: {
  index: string
  title: string
  body: string
  note?: string
}) {
  return (
    <div className="flex gap-3">
      <span className="numeric mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {index}
      </span>
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          {title}
          {note ? <sup className="ml-1 text-primary">{note}</sup> : null}
        </h3>
        <p>{body}</p>
      </div>
    </div>
  )
}

function ReferenceNumber({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'numeric flex size-5 items-center justify-center rounded-full bg-black/50 text-[0.625rem] font-bold text-white',
        className,
      )}
    >
      {children}
    </span>
  )
}

function MiniDonut({ value }: { value: number }) {
  return (
    <span className="absolute top-3 right-3 block size-5 rounded-full border border-white/45 bg-black/25 p-[2px]">
      <span
        className="block size-full rounded-full"
        style={{
          background: `conic-gradient(#38bdf8 ${value}%, rgb(15 23 42 / 0.72) 0)`,
        }}
      />
    </span>
  )
}

function FormLegend({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-[0.625rem] font-semibold text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
  )
}

function SettingsForm({
  defaults,
  onSubmit,
}: {
  defaults: SettingsValues
  onSubmit: (input: LeagueSettingsInput) => Promise<void>
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaults,
  })

  // useWatch rather than watch(): watch() returns a function the React
  // Compiler cannot memoize, which makes it skip the whole component.
  const constant = useWatch({ control, name: 'marketConstantGbp' })

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          title: values.title,
          status: values.status,
          marketConstantGbp: values.marketConstantGbp,
        }),
      )}
      className="flex flex-col gap-4"
    >
      <Field data-invalid={Boolean(errors.title) || undefined}>
        <FieldLabel htmlFor="league-title">Título</FieldLabel>
        <Input
          id="league-title"
          aria-invalid={Boolean(errors.title)}
          {...register('title')}
        />
        {errors.title ? <FieldError>{errors.title.message}</FieldError> : null}
      </Field>

      <Field>
        <FieldLabel htmlFor="league-status">Estado</FieldLabel>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="league-status"
                className="w-full"
                onBlur={field.onBlur}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="inactive">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <FieldDescription>
          Una liga inactiva no admite partidos nuevos.
        </FieldDescription>
      </Field>

      <Field data-invalid={Boolean(errors.marketConstantGbp) || undefined}>
        <FieldLabel htmlFor="league-constant">Constante de mercado</FieldLabel>
        <Input
          id="league-constant"
          type="number"
          min={0}
          step={1}
          aria-invalid={Boolean(errors.marketConstantGbp)}
          {...register('marketConstantGbp', { valueAsNumber: true })}
        />
        {errors.marketConstantGbp ? (
          <FieldError>{errors.marketConstantGbp.message}</FieldError>
        ) : (
          <FieldDescription>
            Multiplica la valoración de carta. Una valoración de 82 valdría{' '}
            {formatMarketValueExact(Number(constant) * 82 || 0)}.
          </FieldDescription>
        )}
      </Field>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          Guardar ajustes
        </Button>
      </div>
    </form>
  )
}

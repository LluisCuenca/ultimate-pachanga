import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { signIn, signUp } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'

const credentialsSchema = z.object({
  email: z.string().min(1, 'Introduce tu correo').email('Correo no válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

const LOGO_URL = `${import.meta.env.BASE_URL}ultimate-pachangas-logo.png`
const BRAND_NAME = 'Ultimate Pachangas'

type CredentialsValues = z.infer<typeof credentialsSchema>

type Mode = 'signin' | 'signup'

interface CredentialsFormProps {
  mode: Mode
  onSubmitted: () => void
}

function CredentialsForm({ mode, onSubmitted }: CredentialsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CredentialsValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: CredentialsValues) {
    try {
      if (mode === 'signin') {
        await signIn(values)
      } else {
        await signUp(values)
        toast.success('Cuenta creada. Ya puedes entrar.')
      }
      onSubmitted()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo completar la operación',
      )
    }
  }

  const passwordAutoComplete =
    mode === 'signin' ? 'current-password' : 'new-password'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field data-invalid={Boolean(errors.email) || undefined}>
        <FieldLabel htmlFor={`${mode}-email`}>Correo electrónico</FieldLabel>
        <Input
          id={`${mode}-email`}
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email ? <FieldError>{errors.email.message}</FieldError> : null}
      </Field>

      <Field data-invalid={Boolean(errors.password) || undefined}>
        <FieldLabel htmlFor={`${mode}-password`}>Contraseña</FieldLabel>
        <Input
          id={`${mode}-password`}
          type="password"
          autoComplete={passwordAutoComplete}
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
        />
        {errors.password ? (
          <FieldError>{errors.password.message}</FieldError>
        ) : null}
      </Field>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
      </Button>
      {mode === 'signin' ? (
        <Link
          to="/forgot-password"
          className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ¿Has olvidado tu contraseña?
        </Link>
      ) : null}
    </form>
  )
}

export function LoginPage() {
  const { session, isLoading } = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState<Mode>('signin')

  if (!isLoading && session) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/league'} replace />
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-lg border-primary/30 shadow-[0_24px_64px_rgb(0_0_0/0.6)]">
        <CardHeader className="flex flex-col items-center border-b border-border pb-6 text-center">
          <div className="flex flex-col items-center">
            <img
              src={LOGO_URL}
              alt="Ultimate Pachangas"
              className="h-32 w-32 object-contain"
            />
            <CardTitle className="mt-2 text-5xl leading-none uppercase">
              <h1>{BRAND_NAME}</h1>
            </CardTitle>
          </div>
          <CardDescription className="technical text-[0.625rem] uppercase">
            La liga entre amigos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <CredentialsForm mode="signin" onSubmitted={() => {}} />
            </TabsContent>
            <TabsContent value="signup">
              <CredentialsForm
                mode="signup"
                onSubmitted={() => setMode('signin')}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}

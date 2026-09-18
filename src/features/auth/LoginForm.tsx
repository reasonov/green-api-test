import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginRequest } from '@/features/auth/api'
import { useAuth } from '@/features/auth/useAuth'
import { loginSchema, type LoginValues } from '@/features/auth/schemas'
import { applyApiErrors } from '@/shared/api/errors'
import { Button } from '@/shared/ui/Button'
import { ErrorBanner } from '@/shared/ui/Feedback'
import { TextField } from '@/shared/ui/Fields'
import styles from '@/shared/ui/ui.module.css'

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/books'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  return (
    <form
      className={styles.field}
      onSubmit={handleSubmit(async (values) => {
        try {
          const session = await loginRequest(values)
          login(session)
          void navigate(from, { replace: true })
        } catch (error) {
          applyApiErrors(error, (name, payload) => {
            if (name === 'root') {
              setError('root', payload)
              return
            }
            setError(name as keyof LoginValues, payload)
          })
        }
      })}
    >
      {errors.root?.message ? (
        <ErrorBanner>{errors.root.message}</ErrorBanner>
      ) : null}
      <TextField
        label="Логин"
        autoComplete="username"
        error={errors.username?.message}
        {...register('username')}
      />
      <TextField
        label="Пароль"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Вход…' : 'Войти'}
      </Button>
    </form>
  )
}

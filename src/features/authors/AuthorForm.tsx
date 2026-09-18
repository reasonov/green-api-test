import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  authorSchema,
  type AuthorValues,
} from '@/features/authors/schemas'
import { applyApiErrors } from '@/shared/api/errors'
import { Button } from '@/shared/ui/Button'
import { ErrorBanner } from '@/shared/ui/Feedback'
import { TextField } from '@/shared/ui/Fields'
import styles from '@/features/catalog.module.css'

type Props = {
  fullName?: string
  onSubmit: (values: AuthorValues) => Promise<void>
}

export function AuthorForm({ fullName, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthorValues>({
    resolver: zodResolver(authorSchema),
    defaultValues: { full_name: fullName ?? '' },
  })

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(async (values) => {
        try {
          await onSubmit(values)
        } catch (error) {
          applyApiErrors(error, (name, payload) => {
            if (name === 'root') {
              setError('root', payload)
              return
            }
            setError(name as keyof AuthorValues, payload)
          })
        }
      })}
    >
      {errors.root?.message ? (
        <ErrorBanner>{errors.root.message}</ErrorBanner>
      ) : null}
      <TextField
        label="ФИО"
        error={errors.full_name?.message}
        {...register('full_name')}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Сохранение…' : 'Сохранить'}
      </Button>
    </form>
  )
}

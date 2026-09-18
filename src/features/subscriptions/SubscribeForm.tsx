import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { subscribeToAuthor } from '@/features/subscriptions/api'
import {
  subscribeSchema,
  type SubscribeValues,
} from '@/features/subscriptions/schemas'
import { applyApiErrors } from '@/shared/api/errors'
import { Button } from '@/shared/ui/Button'
import { ErrorBanner } from '@/shared/ui/Feedback'
import { TextField } from '@/shared/ui/Fields'
import styles from '@/features/catalog.module.css'

export function SubscribeForm({ authorId }: { authorId: number }) {
  const [done, setDone] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SubscribeValues>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: { phone: '' },
  })

  if (done) {
    return <p>Подписка оформлена. Новые книги придут по SMS.</p>
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(async (values) => {
        try {
          await subscribeToAuthor(authorId, values.phone)
          setDone(true)
        } catch (error) {
          applyApiErrors(error, (name, payload) => {
            if (name === 'root') {
              setError('root', payload)
              return
            }
            setError(name as keyof SubscribeValues, payload)
          })
        }
      })}
    >
      {errors.root?.message ? (
        <ErrorBanner>{errors.root.message}</ErrorBanner>
      ) : null}
      <TextField
        label="Телефон"
        placeholder="79001234567"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Отправка…' : 'Подписаться'}
      </Button>
    </form>
  )
}

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { authorKeys, fetchAuthors } from '@/features/authors/api'
import {
  bookCreateSchema,
  bookFormSchema,
  type BookFormValues,
} from '@/features/books/schemas'
import type { Book } from '@/shared/api/mappers'
import { applyApiErrors } from '@/shared/api/errors'
import { Button } from '@/shared/ui/Button'
import { ErrorBanner } from '@/shared/ui/Feedback'
import { Field, TextArea, TextField } from '@/shared/ui/Fields'
import styles from '@/features/catalog.module.css'
import ui from '@/shared/ui/ui.module.css'

type Props = {
  book?: Book
  onSubmit: (values: BookFormValues) => Promise<void>
}

export function BookForm({ book, onSubmit }: Props) {
  const isCreate = !book
  const authorsQuery = useQuery({
    queryKey: authorKeys.list({ page: 1, perPage: 100 }),
    queryFn: () => fetchAuthors({ page: 1, perPage: 100 }),
  })

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BookFormValues>({
    resolver: zodResolver(isCreate ? bookCreateSchema : bookFormSchema),
    defaultValues: {
      title: book?.title ?? '',
      year: book?.year ?? new Date().getFullYear(),
      description: book?.description ?? '',
      isbn: book?.isbn ?? '',
      author_ids: book?.authors.map((author) => author.id) ?? [],
      cover: undefined,
    },
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
            setError(name as keyof BookFormValues, payload)
          })
        }
      })}
    >
      {errors.root?.message ? (
        <ErrorBanner>{errors.root.message}</ErrorBanner>
      ) : null}
      <TextField
        label="Название"
        error={errors.title?.message}
        {...register('title')}
      />
      <TextField
        label="Год выпуска"
        type="number"
        error={errors.year?.message}
        {...register('year', { valueAsNumber: true })}
      />
      <TextArea
        label="Описание"
        error={errors.description?.message}
        {...register('description')}
      />
      <TextField
        label="ISBN"
        error={errors.isbn?.message}
        {...register('isbn')}
      />
      <Controller
        name="author_ids"
        control={control}
        render={({ field }) => (
          <div className={ui.field}>
            <span className={ui.label}>Авторы</span>
            {authorsQuery.isLoading ? <span>Загрузка авторов…</span> : null}
            <div className={ui.checks}>
              {(authorsQuery.data?.items ?? []).map((author) => {
                const checked = field.value.includes(author.id)
                return (
                  <label key={author.id} className={ui.check}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        field.onChange(
                          checked
                            ? field.value.filter((id) => id !== author.id)
                            : [...field.value, author.id],
                        )
                      }}
                    />
                    {author.full_name}
                  </label>
                )
              })}
            </div>
            {errors.author_ids?.message ? (
              <span className={ui.error}>{errors.author_ids.message}</span>
            ) : null}
          </div>
        )}
      />
      <Controller
        name="cover"
        control={control}
        render={({ field }) => (
          <Field
            label={isCreate ? 'Обложка' : 'Новая обложка'}
            error={errors.cover?.message}
          >
            <input
              className={ui.control}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              onChange={(event) => {
                field.onChange(event.target.files?.[0])
              }}
            />
          </Field>
        )}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Сохранение…' : 'Сохранить'}
      </Button>
    </form>
  )
}

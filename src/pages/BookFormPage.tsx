import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { BookForm } from '@/features/books/BookForm'
import {
  bookKeys,
  createBook,
  fetchBook,
  patchBook,
  replaceBook,
} from '@/features/books/api'
import type { BookFormValues } from '@/features/books/schemas'
import { PageHeader, Spinner } from '@/shared/ui/Feedback'
import { authorKeys } from '@/features/authors/api'

export function BookFormPage() {
  const { id } = useParams()
  const bookId = id ? Number(id) : undefined
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: bookId ? bookKeys.detail(bookId) : ['books', 'new'],
    queryFn: () => fetchBook(bookId as number),
    enabled: Number.isInteger(bookId),
  })

  const save = useMutation({
    mutationFn: async (values: BookFormValues) => {
      const payload = {
        title: values.title,
        year: values.year,
        description: values.description,
        isbn: values.isbn,
        author_ids: values.author_ids,
      }

      if (!bookId) {
        if (!(values.cover instanceof File)) {
          throw new Error('Загрузите обложку')
        }
        return createBook({ ...payload, cover: values.cover })
      }

      if (values.cover instanceof File) {
        return replaceBook(bookId, { ...payload, cover: values.cover })
      }

      return patchBook(bookId, payload)
    },
    onSuccess: async (book) => {
      await queryClient.invalidateQueries({ queryKey: bookKeys.all })
      await queryClient.invalidateQueries({ queryKey: authorKeys.all })
      void navigate(`/books/${book.id}`)
    },
  })

  if (bookId && query.isLoading) {
    return <Spinner />
  }

  return (
    <section>
      <PageHeader
        title={bookId ? 'Редактирование книги' : 'Новая книга'}
      />
      <BookForm
        book={query.data}
        onSubmit={async (values) => {
          await save.mutateAsync(values)
        }}
      />
    </section>
  )
}

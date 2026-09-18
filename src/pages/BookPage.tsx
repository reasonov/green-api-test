import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { bookKeys, deleteBook, fetchBook } from '@/features/books/api'
import styles from '@/features/catalog.module.css'
import { Button } from '@/shared/ui/Button'
import {
  ConfirmDialog,
  ErrorBanner,
  PageHeader,
  Spinner,
} from '@/shared/ui/Feedback'
import ui from '@/shared/ui/ui.module.css'

export function BookPage() {
  const { id } = useParams()
  const bookId = Number(id)
  const { isUser } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirm, setConfirm] = useState(false)

  const query = useQuery({
    queryKey: bookKeys.detail(bookId),
    queryFn: () => fetchBook(bookId),
    enabled: Number.isInteger(bookId),
  })

  const remove = useMutation({
    mutationFn: () => deleteBook(bookId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bookKeys.all })
      void navigate('/books')
    },
  })

  if (query.isLoading) {
    return <Spinner />
  }

  if (query.isError || !query.data) {
    return <ErrorBanner>Книга не найдена</ErrorBanner>
  }

  const book = query.data

  return (
    <section>
      <PageHeader
        title={book.title}
        description={`${book.year}${book.isbn ? ` · ISBN ${book.isbn}` : ''}`}
        actions={
          isUser ? (
            <div className={ui.row}>
              <Button
                variant="ghost"
                onClick={() => void navigate(`/books/${book.id}/edit`)}
              >
                Изменить
              </Button>
              <Button variant="danger" onClick={() => setConfirm(true)}>
                Удалить
              </Button>
            </div>
          ) : null
        }
      />
      <div className={styles.detail}>
        <img className={styles.detailCover} src={book.cover_url} alt={book.title} />
        <div>
          <p>{book.description || 'Без описания'}</p>
          <p className={styles.meta}>
            Авторы:{' '}
            {book.authors.map((item, index) => (
              <span key={item.id}>
                {index > 0 ? ', ' : null}
                <Link to={`/authors/${item.id}`}>{item.full_name}</Link>
              </span>
            ))}
          </p>
        </div>
      </div>
      {confirm ? (
        <ConfirmDialog
          title="Удалить книгу?"
          message={`«${book.title}» будет удалена из каталога.`}
          busy={remove.isPending}
          onCancel={() => setConfirm(false)}
          onConfirm={() => remove.mutate()}
        />
      ) : null}
    </section>
  )
}

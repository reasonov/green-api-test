import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { authorKeys, deleteAuthor, fetchAuthor } from '@/features/authors/api'
import { useAuth } from '@/features/auth/useAuth'
import { bookKeys } from '@/features/books/api'
import { SubscribeForm } from '@/features/subscriptions/SubscribeForm'
import styles from '@/features/catalog.module.css'
import { Button } from '@/shared/ui/Button'
import {
  ConfirmDialog,
  ErrorBanner,
  PageHeader,
  Spinner,
} from '@/shared/ui/Feedback'
import ui from '@/shared/ui/ui.module.css'

export function AuthorPage() {
  const { id } = useParams()
  const authorId = Number(id)
  const { isUser } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirm, setConfirm] = useState(false)

  const query = useQuery({
    queryKey: authorKeys.detail(authorId),
    queryFn: () => fetchAuthor(authorId),
    enabled: Number.isInteger(authorId),
  })

  const remove = useMutation({
    mutationFn: () => deleteAuthor(authorId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authorKeys.all })
      await queryClient.invalidateQueries({ queryKey: bookKeys.all })
      void navigate('/authors')
    },
  })

  if (query.isLoading) {
    return <Spinner />
  }

  if (query.isError || !query.data) {
    return <ErrorBanner>Автор не найден</ErrorBanner>
  }

  const author = query.data

  return (
    <section>
      <PageHeader
        title={author.full_name}
        actions={
          isUser ? (
            <div className={ui.row}>
              <Button
                variant="ghost"
                onClick={() => void navigate(`/authors/${author.id}/edit`)}
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
      <h2>Книги</h2>
      {author.books.length === 0 ? (
        <p className={styles.meta}>Пока нет книг</p>
      ) : (
        <div className={styles.list}>
          {author.books.map((book) => (
            <Link
              key={book.id}
              to={`/books/${book.id}`}
              className={styles.listItem}
            >
              <span>{book.title}</span>
              <span>{book.year}</span>
            </Link>
          ))}
        </div>
      )}
      <h2>Подписка на новые книги</h2>
      <SubscribeForm authorId={author.id} />
      {confirm ? (
        <ConfirmDialog
          title="Удалить автора?"
          message={`«${author.full_name}» будет удалён из каталога.`}
          busy={remove.isPending}
          onCancel={() => setConfirm(false)}
          onConfirm={() => remove.mutate()}
        />
      ) : null}
    </section>
  )
}

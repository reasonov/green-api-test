import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { BookCard } from '@/features/books/BookCard'
import { bookKeys, fetchBooks } from '@/features/books/api'
import { authorKeys, fetchAuthors } from '@/features/authors/api'
import styles from '@/features/catalog.module.css'
import { Button } from '@/shared/ui/Button'
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  Spinner,
} from '@/shared/ui/Feedback'
import { Pagination } from '@/shared/ui/Pagination'
import ui from '@/shared/ui/ui.module.css'

export function BooksPage() {
  const { isUser } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const page = Number.parseInt(params.get('page') ?? '1', 10) || 1
  const search = params.get('search') ?? ''
  const year = params.get('year') ? Number(params.get('year')) : undefined
  const authorId = params.get('author_id')
    ? Number(params.get('author_id'))
    : undefined

  const booksQuery = useQuery({
    queryKey: bookKeys.list({ page, search, year, authorId, perPage: 12 }),
    queryFn: () =>
      fetchBooks({ page, search, year, authorId, perPage: 12 }),
  })

  const authorsQuery = useQuery({
    queryKey: authorKeys.list({ page: 1, perPage: 100 }),
    queryFn: () => fetchAuthors({ page: 1, perPage: 100 }),
  })

  const update = (next: Record<string, string | undefined>) => {
    const copy = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (!value) {
        copy.delete(key)
      } else {
        copy.set(key, value)
      }
    }
    if (!('page' in next)) {
      copy.delete('page')
    }
    setParams(copy)
  }

  return (
    <section>
      <PageHeader
        title="Книги"
        description="Каталог доступен гостям. Изменения — после входа."
        actions={
          isUser ? (
            <Button onClick={() => void navigate('/books/new')}>
              Добавить книгу
            </Button>
          ) : null
        }
      />
      <form
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          update({
            search: String(form.get('search') ?? '') || undefined,
            year: String(form.get('year') ?? '') || undefined,
            author_id: String(form.get('author_id') ?? '') || undefined,
          })
        }}
      >
        <input
          className={ui.control}
          name="search"
          placeholder="Поиск"
          defaultValue={search}
        />
        <input
          className={ui.control}
          name="year"
          type="number"
          placeholder="Год"
          defaultValue={year ?? ''}
        />
        <select
          className={ui.control}
          name="author_id"
          defaultValue={authorId ?? ''}
        >
          <option value="">Все авторы</option>
          {(authorsQuery.data?.items ?? []).map((author) => (
            <option key={author.id} value={author.id}>
              {author.full_name}
            </option>
          ))}
        </select>
        <Button type="submit">Найти</Button>
      </form>
      {booksQuery.isLoading ? <Spinner /> : null}
      {booksQuery.isError ? (
        <ErrorBanner>Не удалось загрузить книги</ErrorBanner>
      ) : null}
      {booksQuery.data?.items.length === 0 ? (
        <EmptyState>Книги не найдены</EmptyState>
      ) : null}
      {booksQuery.data && booksQuery.data.items.length > 0 ? (
        <>
          <div className={styles.grid}>
            {booksQuery.data.items.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          <Pagination
            page={booksQuery.data.pagination.page}
            totalPages={booksQuery.data.pagination.total_pages}
            onPageChange={(nextPage) => update({ page: String(nextPage) })}
          />
        </>
      ) : null}
    </section>
  )
}

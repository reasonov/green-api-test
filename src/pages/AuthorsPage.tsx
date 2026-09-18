import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthorCard } from '@/features/authors/AuthorCard'
import { authorKeys, fetchAuthors } from '@/features/authors/api'
import { useAuth } from '@/features/auth/useAuth'
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

export function AuthorsPage() {
  const { isUser } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const page = Number.parseInt(params.get('page') ?? '1', 10) || 1
  const search = params.get('search') ?? ''

  const query = useQuery({
    queryKey: authorKeys.list({ page, search, perPage: 12 }),
    queryFn: () => fetchAuthors({ page, search, perPage: 12 }),
  })

  return (
    <section>
      <PageHeader
        title="Авторы"
        actions={
          isUser ? (
            <Button onClick={() => void navigate('/authors/new')}>
              Добавить автора
            </Button>
          ) : null
        }
      />
      <form
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          const next = new URLSearchParams()
          const value = String(form.get('search') ?? '')
          if (value) {
            next.set('search', value)
          }
          setParams(next)
        }}
      >
        <input
          className={ui.control}
          name="search"
          placeholder="Поиск по ФИО"
          defaultValue={search}
        />
        <Button type="submit">Найти</Button>
      </form>
      {query.isLoading ? <Spinner /> : null}
      {query.isError ? (
        <ErrorBanner>Не удалось загрузить авторов</ErrorBanner>
      ) : null}
      {query.data?.items.length === 0 ? (
        <EmptyState>Авторы не найдены</EmptyState>
      ) : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <div className={styles.list}>
            {query.data.items.map((author) => (
              <AuthorCard key={author.id} author={author} />
            ))}
          </div>
          <Pagination
            page={query.data.pagination.page}
            totalPages={query.data.pagination.total_pages}
            onPageChange={(nextPage) => {
              const next = new URLSearchParams(params)
              next.set('page', String(nextPage))
              setParams(next)
            }}
          />
        </>
      ) : null}
    </section>
  )
}

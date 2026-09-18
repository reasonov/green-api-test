import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { fetchTopAuthors, reportKeys } from '@/features/report/api'
import styles from '@/features/catalog.module.css'
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  Spinner,
} from '@/shared/ui/Feedback'
import ui from '@/shared/ui/ui.module.css'

export function ReportPage() {
  const currentYear = new Date().getFullYear()
  const years = useMemo(
    () => Array.from({ length: 12 }, (_, index) => currentYear - index),
    [currentYear],
  )
  const [year, setYear] = useState(2024)

  const query = useQuery({
    queryKey: reportKeys.topAuthors(year),
    queryFn: () => fetchTopAuthors(year),
  })

  return (
    <section>
      <PageHeader
        title="ТОП-10 авторов"
        description="Авторы с наибольшим числом книг за выбранный год."
        actions={
          <select
            className={ui.control}
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
            <option value={1869}>1869</option>
          </select>
        }
      />
      {query.isLoading ? <Spinner /> : null}
      {query.isError ? (
        <ErrorBanner>Не удалось загрузить отчёт</ErrorBanner>
      ) : null}
      {query.data?.items.length === 0 ? (
        <EmptyState>За {year} год книг нет</EmptyState>
      ) : null}
      {query.data && query.data.items.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Место</th>
              <th>Автор</th>
              <th>Книг</th>
            </tr>
          </thead>
          <tbody>
            {query.data.items.map((item) => (
              <tr key={item.author_id}>
                <td>{item.rank}</td>
                <td>
                  <Link to={`/authors/${item.author_id}`}>{item.full_name}</Link>
                </td>
                <td>{item.books_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  )
}

import { Link } from 'react-router-dom'
import { PageHeader } from '@/shared/ui/Feedback'

export function NotFoundPage() {
  return (
    <section>
      <PageHeader title="Страница не найдена" />
      <Link to="/books">Вернуться к книгам</Link>
    </section>
  )
}

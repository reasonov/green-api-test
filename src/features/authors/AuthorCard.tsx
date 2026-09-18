import { Link } from 'react-router-dom'
import type { AuthorShort } from '@/shared/api/mappers'
import styles from '@/features/catalog.module.css'

export function AuthorCard({ author }: { author: AuthorShort }) {
  return (
    <Link to={`/authors/${author.id}`} className={styles.listItem}>
      <strong>{author.full_name}</strong>
      <span>Открыть</span>
    </Link>
  )
}

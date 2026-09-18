import { Link } from 'react-router-dom'
import type { Book } from '@/shared/api/mappers'
import styles from '@/features/catalog.module.css'

export function BookCard({ book }: { book: Book }) {
  return (
    <Link to={`/books/${book.id}`} className={styles.card}>
      <img className={styles.cover} src={book.cover_url} alt={book.title} />
      <div className={styles.body}>
        <div className={styles.title}>{book.title}</div>
        <div className={styles.meta}>{book.year}</div>
        <div className={styles.meta}>
          {book.authors.map((author) => author.full_name).join(', ')}
        </div>
      </div>
    </Link>
  )
}

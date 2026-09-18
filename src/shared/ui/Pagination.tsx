import { Button } from '@/shared/ui/Button'
import styles from '@/shared/ui/ui.module.css'

type Props = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={styles.pager}>
      <Button
        variant="ghost"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Назад
      </Button>
      <span>
        {page} из {totalPages}
      </span>
      <Button
        variant="ghost"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Вперёд
      </Button>
    </div>
  )
}

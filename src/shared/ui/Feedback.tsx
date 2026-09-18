import type { ReactNode } from 'react'
import { Button } from '@/shared/ui/Button'
import styles from '@/shared/ui/ui.module.css'

export function Spinner({ label = 'Загрузка…' }: { label?: string }) {
  return <p className={styles.status}>{label}</p>
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className={styles.status}>{children}</p>
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return <div className={styles.banner}>{children}</div>
}

type ConfirmProps = {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Удалить',
  onConfirm,
  onCancel,
  busy,
}: ConfirmProps) {
  return (
    <div className={styles.overlay} role="presentation" onClick={onCancel}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className={styles.row}>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Отмена
          </Button>
        </div>
      </div>
    </div>
  )
}

type HeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: HeaderProps) {
  return (
    <div className={styles.header}>
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions}
    </div>
  )
}

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from '@/shared/ui/ui.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  className,
  children,
  type = 'button',
  ...props
}: Props) {
  const variantClass =
    variant === 'ghost' ? styles.ghost : variant === 'danger' ? styles.danger : ''

  return (
    <button
      type={type}
      className={[styles.button, variantClass, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}

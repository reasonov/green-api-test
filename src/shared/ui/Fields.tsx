import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import styles from '@/shared/ui/ui.module.css'

type FieldProps = {
  label: string
  error?: string
  children: ReactNode
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function TextField({ label, error, ...props }: InputProps) {
  return (
    <Field label={label} error={error}>
      <input className={styles.control} {...props} />
    </Field>
  )
}

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
}

export function TextArea({ label, error, ...props }: AreaProps) {
  return (
    <Field label={label} error={error}>
      <textarea className={styles.area} {...props} />
    </Field>
  )
}

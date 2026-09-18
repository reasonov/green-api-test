import { LoginForm } from '@/features/auth/LoginForm'
import { useAuth } from '@/features/auth/useAuth'
import { Navigate } from 'react-router-dom'
import styles from '@/features/catalog.module.css'

export function LoginPage() {
  const { isUser } = useAuth()

  if (isUser) {
    return <Navigate to="/books" replace />
  }

  return (
    <section className={styles.login}>
      <h1>Вход</h1>
      <p>Демо: user / password</p>
      <LoginForm />
    </section>
  )
}

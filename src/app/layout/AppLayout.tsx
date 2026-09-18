import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/shared/ui/Button'
import styles from '@/app/layout/AppLayout.module.css'

const navClass = ({ isActive }: { isActive: boolean }) =>
  [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')

export function AppLayout() {
  const { isUser, user, logout } = useAuth()

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.bar}>
          <NavLink to="/books" className={styles.brand}>
            Каталог книг
          </NavLink>
          <nav className={styles.nav}>
            <NavLink to="/books" className={navClass}>
              Книги
            </NavLink>
            <NavLink to="/authors" className={navClass}>
              Авторы
            </NavLink>
            <NavLink to="/report" className={navClass}>
              Отчёт
            </NavLink>
            {isUser ? (
              <>
                <span>{user?.username}</span>
                <Button variant="ghost" onClick={logout}>
                  Выйти
                </Button>
              </>
            ) : (
              <NavLink to="/login" className={navClass}>
                Войти
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>Каталог книг · тестовое задание</footer>
    </div>
  )
}

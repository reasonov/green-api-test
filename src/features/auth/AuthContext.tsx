import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AuthContext, type AuthContextValue } from '@/features/auth/context'
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearSession,
  readSession,
  writeSession,
  type Session,
} from '@/shared/api/session'
import { isUserRole } from '@/shared/lib/rbac'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession())

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  const login = useCallback((next: Session) => {
    writeSession(next)
    setSession(next)
  }, [])

  useEffect(() => {
    const onUnauthorized = () => setSession(null)
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized)
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isUser: isUserRole(session?.user.role),
      login,
      logout,
    }),
    [login, logout, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

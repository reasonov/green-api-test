import { createContext } from 'react'
import type { Session, SessionUser } from '@/shared/api/session'

export type AuthContextValue = {
  user: SessionUser | null
  isUser: boolean
  login: (session: Session) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

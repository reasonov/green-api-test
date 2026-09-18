import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/features/auth/useAuth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isUser } = useAuth()
  const location = useLocation()

  if (!isUser) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

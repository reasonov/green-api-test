export const AUTH_UNAUTHORIZED_EVENT = 'catalog:unauthorized'
export const SESSION_KEY = 'catalog.session'

export type SessionUser = {
  id: number
  username: string
  role: string
}

export type Session = {
  token: string
  expiresAt: string
  user: SessionUser
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  const user = record.user

  return (
    typeof record.token === 'string' &&
    typeof record.expiresAt === 'string' &&
    !!user &&
    typeof user === 'object' &&
    typeof (user as SessionUser).id === 'number' &&
    typeof (user as SessionUser).username === 'string' &&
    typeof (user as SessionUser).role === 'string'
  )
}

export function isSessionExpired(session: Session): boolean {
  return Date.parse(session.expiresAt) <= Date.now()
}

export function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isSession(parsed) || isSessionExpired(parsed)) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function writeSession(session: Session): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function getAccessToken(): string | null {
  return readSession()?.token ?? null
}

export function notifyUnauthorized(): void {
  clearSession()
  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
}

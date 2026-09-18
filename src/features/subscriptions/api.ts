import { apiBaseUrl } from '@/shared/api/client'
import { HttpError, parseErrorBody } from '@/shared/api/errors'
import { getAccessToken, notifyUnauthorized } from '@/shared/api/session'

export async function subscribeToAuthor(
  authorId: number,
  phone: string,
): Promise<void> {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const token = getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(
    `${apiBaseUrl}/authors/${authorId}/subscriptions`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone }),
    },
  )

  if (response.status === 401) {
    notifyUnauthorized()
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    throw new HttpError(
      response.status,
      payload ? parseErrorBody(payload) : [{ message: 'Не удалось подписаться' }],
    )
  }
}

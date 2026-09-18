import createClient from 'openapi-fetch'
import {
  HttpError,
  parseErrorBody,
  type ErrorItem,
} from '@/shared/api/errors'
import { getAccessToken, notifyUnauthorized } from '@/shared/api/session'
import type { paths } from '@/shared/api/schema'

export const apiBaseUrl =
  import.meta.env.VITE_API_URL ??
  new URL(
    'api/v1',
    `${window.location.origin}${import.meta.env.BASE_URL}`,
  ).pathname.replace(/\/$/, '')

export const client = createClient<paths>({
  baseUrl: apiBaseUrl,
})

client.use({
  onRequest({ request }) {
    const token = getAccessToken()
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
  },
  onResponse({ response }) {
    if (response.status === 401) {
      notifyUnauthorized()
    }
    return response
  },
})

function fallbackErrors(status: number): ErrorItem[] {
  if (status === 401) {
    return [{ message: 'Необходима авторизация' }]
  }
  if (status === 403) {
    return [{ message: 'Недостаточно прав' }]
  }
  if (status === 404) {
    return [{ message: 'Не найдено' }]
  }
  return [{ message: 'Ошибка запроса' }]
}

export async function unwrap<T>(
  promise: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await promise

  if (!response.ok) {
    throw new HttpError(
      response.status,
      error ? parseErrorBody(error) : fallbackErrors(response.status),
    )
  }

  return data as T
}

export async function sendForm<T>(
  method: 'POST' | 'PUT',
  path: string,
  form: FormData,
): Promise<T> {
  const headers = new Headers()
  const token = getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers,
    body: form,
  })

  if (response.status === 401) {
    notifyUnauthorized()
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new HttpError(
      response.status,
      payload ? parseErrorBody(payload) : fallbackErrors(response.status),
    )
  }

  return payload as T
}

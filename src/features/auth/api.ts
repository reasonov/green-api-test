import { client, unwrap } from '@/shared/api/client'
import type { Session } from '@/shared/api/session'
import type { LoginValues } from '@/features/auth/schemas'

export async function loginRequest(values: LoginValues): Promise<Session> {
  const response = await unwrap(
    client.POST('/auth/login', {
      body: values,
    }),
  )

  const data = response.data
  if (
    !data?.token ||
    !data.expires_at ||
    !data.user?.id ||
    !data.user.username ||
    !data.user.role
  ) {
    throw new Error('Некорректный ответ сервера')
  }

  return {
    token: data.token,
    expiresAt: data.expires_at,
    user: {
      id: data.user.id,
      username: data.user.username,
      role: data.user.role,
    },
  }
}

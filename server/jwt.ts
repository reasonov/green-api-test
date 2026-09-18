import { createHmac, timingSafeEqual } from 'node:crypto'

const secret = process.env.JWT_SECRET ?? 'dev-secret'
const tokenTtlMs = 8 * 60 * 60 * 1000

export type TokenPayload = {
  id: number
  username: string
  role: string
  exp: number
}

function toBase64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url')
}

function sign(payload: TokenPayload): string {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = toBase64Url(JSON.stringify(payload))
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')

  return `${header}.${body}.${signature}`
}

export function createToken(user: {
  id: number
  username: string
  role: string
}): { token: string; expiresAt: string } {
  const expiresAt = new Date(Date.now() + tokenTtlMs)
  const token = sign({
    id: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(expiresAt.getTime() / 1000),
  })

  return { token, expiresAt: expiresAt.toISOString() }
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  const [header, body, signature] = parts
  const expected = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url')

  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as TokenPayload

    if (payload.exp * 1000 <= Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

import { describe, expect, it } from 'vitest'
import { isValidIsbn } from '@/shared/lib/isbn'
import { isValidPhone, normalizePhone } from '@/shared/lib/phone'
import { isUserRole } from '@/shared/lib/rbac'
import { formatBookSms } from '@/shared/lib/sms'
import { HttpError, toFieldMap } from '@/shared/api/errors'
import { loginSchema } from '@/features/auth/schemas'
import { authorSchema } from '@/features/authors/schemas'
import { bookCreateSchema } from '@/features/books/schemas'
import { subscribeSchema } from '@/features/subscriptions/schemas'

describe('isbn', () => {
  it('accepts a valid ISBN-13', () => {
    expect(isValidIsbn('978-0-306-40615-7')).toBe(true)
  })

  it('rejects a broken ISBN', () => {
    expect(isValidIsbn('123')).toBe(false)
  })
})

describe('phone', () => {
  it('normalizes local numbers to 7xxxxxxxxxx', () => {
    expect(normalizePhone('+7 (900) 000-00-01')).toBe('79000000001')
    expect(normalizePhone('89000000001')).toBe('79000000001')
  })

  it('rejects short numbers', () => {
    expect(isValidPhone('123')).toBe(false)
  })
})

describe('rbac', () => {
  it('treats only role user as privileged', () => {
    expect(isUserRole('user')).toBe(true)
    expect(isUserRole('guest')).toBe(false)
    expect(isUserRole(undefined)).toBe(false)
  })
})

describe('sms', () => {
  it('formats a single author', () => {
    expect(formatBookSms(['Лев Толстой'])).toBe('Новая книга автора Лев Толстой')
  })

  it('formats several authors without duplicates', () => {
    expect(formatBookSms(['Фёдор Достоевский', 'Фёдор Достоевский', 'Лев Толстой'])).toBe(
      'Новая книга авторов Фёдор Достоевский, Лев Толстой',
    )
  })
})

describe('api errors', () => {
  it('maps field errors once', () => {
    const error = new HttpError(422, [
      { field: 'title', message: 'Укажите название' },
      { field: 'title', message: 'Ещё раз' },
      { message: 'Общая' },
    ])
    expect(toFieldMap(error)).toEqual({ title: 'Укажите название' })
  })
})

describe('schemas', () => {
  it('requires login fields', () => {
    const result = loginSchema.safeParse({ username: '', password: '' })
    expect(result.success).toBe(false)
  })

  it('requires author name', () => {
    expect(authorSchema.safeParse({ full_name: 'А' }).success).toBe(false)
    expect(authorSchema.safeParse({ full_name: 'Антон Чехов' }).success).toBe(
      true,
    )
  })

  it('requires a cover on create', () => {
    const result = bookCreateSchema.safeParse({
      title: 'Книга',
      year: 2024,
      author_ids: [1],
    })
    expect(result.success).toBe(false)
  })

  it('validates subscribe phone', () => {
    expect(subscribeSchema.safeParse({ phone: '79001234567' }).success).toBe(
      true,
    )
    expect(subscribeSchema.safeParse({ phone: 'abc' }).success).toBe(false)
  })
})

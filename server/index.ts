import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { TokenPayload } from './jwt.ts'
import { createToken, verifyToken } from './jwt.ts'
import {
  asStringArray,
  isCoverFile,
  paginate,
  parseId,
  parseYear,
  validateBookFields,
  validateCover,
  validateFullName,
  validatePhone,
  type FieldError,
} from './http.ts'
import { buildBookSms, sendSms } from './sms.ts'
import {
  coverUrl,
  nextAuthor,
  nextBook,
  nextSubscription,
  saveCover,
  store,
  type AuthorRecord,
  type BookRecord,
} from './store.ts'

type Env = {
  Variables: {
    user: TokenPayload
  }
}

const app = new Hono<Env>()
const api = new Hono<Env>()

app.use('*', cors())

function fail(status: 400 | 401 | 403 | 404 | 422, errors: FieldError[]) {
  return Response.json({ success: false, errors }, { status })
}

function ok(data: unknown, status: 200 | 201 = 200) {
  return Response.json({ success: true, data }, { status })
}

function toAuthorShort(author: AuthorRecord) {
  return { id: author.id, full_name: author.full_name }
}

function toBook(book: BookRecord) {
  return {
    id: book.id,
    title: book.title,
    year: book.year,
    description: book.description,
    isbn: book.isbn,
    cover_url: coverUrl(book.cover_name),
    authors: book.author_ids
      .map((id) => store.authors.find((author) => author.id === id))
      .filter((author): author is AuthorRecord => Boolean(author))
      .map(toAuthorShort),
  }
}

function toAuthor(author: AuthorRecord) {
  return {
    id: author.id,
    full_name: author.full_name,
    books: store.books
      .filter((book) => book.author_ids.includes(author.id))
      .map((book) => ({
        id: book.id,
        title: book.title,
        year: book.year,
      })),
  }
}

function resolveAuthors(ids: number[]): {
  authors: AuthorRecord[]
  errors: FieldError[]
} {
  const authors: AuthorRecord[] = []
  for (const id of ids) {
    const author = store.authors.find((item) => item.id === id)
    if (!author) {
      return {
        authors: [],
        errors: [
          {
            field: 'author_ids',
            message: `Автор с id ${id} не найден`,
          },
        ],
      }
    }
    authors.push(author)
  }
  return { authors, errors: [] }
}

async function notifySubscribers(book: BookRecord): Promise<void> {
  const namesByPhone = new Map<string, string[]>()

  for (const authorId of book.author_ids) {
    const author = store.authors.find((item) => item.id === authorId)
    if (!author) {
      continue
    }

    for (const subscription of store.subscriptions) {
      if (subscription.author_id !== authorId) {
        continue
      }

      const names = namesByPhone.get(subscription.phone) ?? []
      if (!names.includes(author.full_name)) {
        names.push(author.full_name)
      }
      namesByPhone.set(subscription.phone, names)
    }
  }

  await Promise.allSettled(
    [...namesByPhone.entries()].map(async ([phone, names]) => {
      try {
        await sendSms(phone, buildBookSms(names))
      } catch (error) {
        console.error('[SMSPilot] send failed', { phone, error })
      }
    }),
  )
}

async function requireUser(
  c: { req: { header: (name: string) => string | undefined }; set: (key: 'user', value: TokenPayload) => void },
  next: () => Promise<void>,
) {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return fail(401, [{ message: 'Необходима авторизация' }])
  }

  const payload = verifyToken(header.slice(7))
  if (!payload) {
    return fail(401, [{ message: 'Недействительный токен' }])
  }

  if (payload.role !== 'user') {
    return fail(403, [{ message: 'Недостаточно прав' }])
  }

  c.set('user', payload)
  await next()
}

api.post('/auth/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const username =
    body && typeof body === 'object' && 'username' in body
      ? String(body.username)
      : ''
  const password =
    body && typeof body === 'object' && 'password' in body
      ? String(body.password)
      : ''

  const user = store.users.find(
    (item) => item.username === username && item.password === password,
  )

  if (!user) {
    return fail(401, [{ message: 'Неверные учётные данные' }])
  }

  const { token, expiresAt } = createToken(user)

  return ok({
    token,
    expires_at: expiresAt,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  })
})

api.get('/books', (c) => {
  const query = c.req.query()
  const search = query.search?.trim().toLowerCase()
  const year = query.year ? Number.parseInt(query.year, 10) : undefined
  const authorId = query.author_id
    ? Number.parseInt(query.author_id, 10)
    : undefined

  let items = [...store.books]

  if (search) {
    items = items.filter((book) => {
      const haystack = `${book.title} ${book.description} ${book.isbn}`.toLowerCase()
      return haystack.includes(search)
    })
  }

  if (year !== undefined && Number.isInteger(year)) {
    items = items.filter((book) => book.year === year)
  }

  if (authorId !== undefined && Number.isInteger(authorId)) {
    items = items.filter((book) => book.author_ids.includes(authorId))
  }

  const page = paginate(items, query.page, query['per-page'])

  return ok({
    items: page.items.map(toBook),
    pagination: page.pagination,
  })
})

api.post('/books', requireUser, async (c) => {
  const body = await c.req.parseBody({ all: true })
  const authorIds = asStringArray(
    body.author_ids ?? body['author_ids[]'],
  )
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value))

  const cover = body.cover
  const errors = validateBookFields({
    title: body.title,
    year: body.year,
    description: body.description,
    isbn: body.isbn,
    authorIds,
  })

  if (!isCoverFile(cover)) {
    errors.push({ field: 'cover', message: 'Загрузите обложку' })
  } else {
    errors.push(...validateCover(cover))
  }

  const resolved = resolveAuthors(authorIds)
  errors.push(...resolved.errors)

  if (errors.length > 0) {
    return fail(422, errors)
  }

  const coverName = await saveCover(cover as File)
  const book: BookRecord = {
    id: nextBook(),
    title: String(body.title).trim(),
    year: Number.parseInt(String(body.year), 10),
    description:
      typeof body.description === 'string' ? body.description.trim() : '',
    isbn: typeof body.isbn === 'string' ? body.isbn.trim() : '',
    cover_name: coverName,
    author_ids: authorIds,
  }

  store.books.push(book)
  await notifySubscribers(book)
  return ok(toBook(book), 201)
})

api.get('/books/:id', (c) => {
  const id = parseId(c.req.param('id'))
  const book = store.books.find((item) => item.id === id)
  if (!book) {
    return fail(404, [{ message: 'Книга не найдена' }])
  }
  return ok(toBook(book))
})

api.put('/books/:id', requireUser, async (c) => {
  const id = parseId(c.req.param('id'))
  const book = store.books.find((item) => item.id === id)
  if (!book) {
    return fail(404, [{ message: 'Книга не найдена' }])
  }

  const body = await c.req.parseBody({ all: true })
  const authorIds = asStringArray(
    body.author_ids ?? body['author_ids[]'],
  )
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value))

  const cover = body.cover
  const errors = validateBookFields({
    title: body.title,
    year: body.year,
    description: body.description,
    isbn: body.isbn,
    authorIds,
  })

  if (!isCoverFile(cover)) {
    errors.push({ field: 'cover', message: 'Загрузите обложку' })
  } else {
    errors.push(...validateCover(cover))
  }

  const resolved = resolveAuthors(authorIds)
  errors.push(...resolved.errors)

  if (errors.length > 0) {
    return fail(422, errors)
  }

  book.title = String(body.title).trim()
  book.year = Number.parseInt(String(body.year), 10)
  book.description =
    typeof body.description === 'string' ? body.description.trim() : ''
  book.isbn = typeof body.isbn === 'string' ? body.isbn.trim() : ''
  book.author_ids = authorIds
  book.cover_name = await saveCover(cover as File)

  return ok(toBook(book))
})

api.patch('/books/:id', requireUser, async (c) => {
  const id = parseId(c.req.param('id'))
  const book = store.books.find((item) => item.id === id)
  if (!book) {
    return fail(404, [{ message: 'Книга не найдена' }])
  }

  const body = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return fail(422, [{ message: 'Некорректное тело запроса' }])
  }

  const payload = body as Record<string, unknown>
  const nextTitle = payload.title ?? book.title
  const nextYear = payload.year ?? book.year
  const nextDescription =
    payload.description === undefined ? book.description : payload.description
  const nextIsbn = payload.isbn === undefined ? book.isbn : payload.isbn
  const nextAuthorIds = Array.isArray(payload.author_ids)
    ? payload.author_ids
        .map((value) => Number.parseInt(String(value), 10))
        .filter((value) => Number.isInteger(value))
    : book.author_ids

  const errors = validateBookFields({
    title: nextTitle,
    year: nextYear,
    description: nextDescription,
    isbn: nextIsbn,
    authorIds: nextAuthorIds,
    requireAuthors: payload.author_ids !== undefined,
  })

  if (payload.author_ids !== undefined) {
    errors.push(...resolveAuthors(nextAuthorIds).errors)
  }

  if (errors.length > 0) {
    return fail(422, errors)
  }

  book.title = String(nextTitle).trim()
  book.year = Number(nextYear)
  book.description = String(nextDescription ?? '').trim()
  book.isbn = String(nextIsbn ?? '').trim()
  book.author_ids = nextAuthorIds

  return ok(toBook(book))
})

api.delete('/books/:id', requireUser, (c) => {
  const id = parseId(c.req.param('id'))
  const index = store.books.findIndex((item) => item.id === id)
  if (index === -1) {
    return fail(404, [{ message: 'Книга не найдена' }])
  }

  store.books.splice(index, 1)
  return c.body(null, 204)
})

api.get('/authors', (c) => {
  const query = c.req.query()
  const search = query.search?.trim().toLowerCase()
  let items = [...store.authors]

  if (search) {
    items = items.filter((author) =>
      author.full_name.toLowerCase().includes(search),
    )
  }

  const page = paginate(items, query.page, query['per-page'])

  return ok({
    items: page.items.map(toAuthorShort),
    pagination: page.pagination,
  })
})

api.post('/authors', requireUser, async (c) => {
  const body = await c.req.json().catch(() => null)
  const fullName =
    body && typeof body === 'object' && 'full_name' in body
      ? body.full_name
      : undefined
  const errors = validateFullName(fullName)
  if (errors.length > 0) {
    return fail(422, errors)
  }

  const author: AuthorRecord = {
    id: nextAuthor(),
    full_name: String(fullName).trim(),
  }
  store.authors.push(author)
  return ok(toAuthor(author), 201)
})

api.get('/authors/:id', (c) => {
  const id = parseId(c.req.param('id'))
  const author = store.authors.find((item) => item.id === id)
  if (!author) {
    return fail(404, [{ message: 'Автор не найден' }])
  }
  return ok(toAuthor(author))
})

api.put('/authors/:id', requireUser, async (c) => {
  const id = parseId(c.req.param('id'))
  const author = store.authors.find((item) => item.id === id)
  if (!author) {
    return fail(404, [{ message: 'Автор не найден' }])
  }

  const body = await c.req.json().catch(() => null)
  const fullName =
    body && typeof body === 'object' && 'full_name' in body
      ? body.full_name
      : undefined
  const errors = validateFullName(fullName)
  if (errors.length > 0) {
    return fail(422, errors)
  }

  author.full_name = String(fullName).trim()
  return ok(toAuthor(author))
})

api.delete('/authors/:id', requireUser, (c) => {
  const id = parseId(c.req.param('id'))
  const index = store.authors.findIndex((item) => item.id === id)
  if (index === -1) {
    return fail(404, [{ message: 'Автор не найден' }])
  }

  store.authors.splice(index, 1)
  for (const book of store.books) {
    book.author_ids = book.author_ids.filter((authorId) => authorId !== id)
  }
  store.subscriptions = store.subscriptions.filter(
    (item) => item.author_id !== id,
  )

  return c.body(null, 204)
})

api.post('/authors/:id/subscriptions', async (c) => {
  const id = parseId(c.req.param('id'))
  const author = store.authors.find((item) => item.id === id)
  if (!author) {
    return fail(404, [{ message: 'Автор не найден' }])
  }

  const body = await c.req.json().catch(() => null)
  const phoneValue =
    body && typeof body === 'object' && 'phone' in body ? body.phone : undefined
  const { errors, normalized } = validatePhone(phoneValue)
  if (errors.length > 0 || !normalized) {
    return fail(422, errors)
  }

  const exists = store.subscriptions.some(
    (item) => item.author_id === id && item.phone === normalized,
  )
  if (!exists) {
    store.subscriptions.push({
      id: nextSubscription(),
      author_id: author.id,
      phone: normalized,
    })
  }

  return ok({
    author_id: author.id,
    phone: normalized,
  }, 201)
})

api.get('/reports/top-authors', (c) => {
  const year = parseYear(c.req.query('year'))
  if (!year) {
    return fail(400, [
      { field: 'year', message: 'Укажите корректный год выпуска' },
    ])
  }

  const counts = new Map<number, number>()
  for (const book of store.books) {
    if (book.year !== year) {
      continue
    }
    for (const authorId of book.author_ids) {
      counts.set(authorId, (counts.get(authorId) ?? 0) + 1)
    }
  }

  const items = [...counts.entries()]
    .map(([authorId, booksCount]) => {
      const author = store.authors.find((item) => item.id === authorId)
      if (!author) {
        return null
      }
      return {
        author_id: author.id,
        full_name: author.full_name,
        books_count: booksCount,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => {
      if (right.books_count !== left.books_count) {
        return right.books_count - left.books_count
      }
      return left.full_name.localeCompare(right.full_name, 'ru')
    })
    .slice(0, 10)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }))

  return ok({ year, items })
})

app.route('/api/v1', api)

app.get('/uploads/covers/:name', (c) => {
  const file = store.covers.get(c.req.param('name'))
  if (!file) {
    return c.notFound()
  }

  return new Response(file.body, {
    headers: {
      'Content-Type': file.type,
      'Cache-Control': 'public, max-age=86400',
    },
  })
})

const port = Number.parseInt(process.env.API_PORT ?? '3001', 10)

serve({ fetch: app.fetch, port }, () => {
  console.info(`API listening on http://127.0.0.1:${port}`)
})

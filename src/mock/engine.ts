import { formatBookSms } from '@/shared/lib/sms'
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
} from '@/shared/lib/catalogApi'

type AuthorRecord = { id: number; full_name: string }
type BookRecord = {
  id: number
  title: string
  year: number
  description: string
  isbn: string
  cover_url: string
  author_ids: number[]
}
type SubscriptionRecord = { id: number; author_id: number; phone: string }
type TokenPayload = { id: number; username: string; role: string; exp: number }

function isbn13(body12: string): string {
  let sum = 0
  for (let index = 0; index < 12; index += 1) {
    sum += Number(body12[index]) * (index % 2 === 0 ? 1 : 3)
  }
  return `${body12}${(10 - (sum % 10)) % 10}`
}

function coverUrl(title: string, hue: number): string {
  const safe = title.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560"><rect width="400" height="560" fill="hsl(${hue} 38% 26%)"/><rect x="24" y="24" width="352" height="512" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2"/><text x="200" y="280" fill="#f7f1e8" font-size="22" font-family="Georgia, serif" text-anchor="middle">${safe}</text></svg>`
  return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
}

const authors: AuthorRecord[] = [
  { id: 1, full_name: 'Лев Толстой' },
  { id: 2, full_name: 'Фёдор Достоевский' },
  { id: 3, full_name: 'Антон Чехов' },
  { id: 4, full_name: 'Михаил Булгаков' },
  { id: 5, full_name: 'Борис Пастернак' },
  { id: 6, full_name: 'Иван Тургенев' },
  { id: 7, full_name: 'Александр Пушкин' },
  { id: 8, full_name: 'Николай Гоголь' },
  { id: 9, full_name: 'Иван Бунин' },
  { id: 10, full_name: 'Александр Солженицын' },
  { id: 11, full_name: 'Владимир Набоков' },
  { id: 12, full_name: 'Марина Цветаева' },
]

const books: BookRecord[] = [
  ['Война и мир', 1869, 'Роман-эпопея о русском обществе в эпоху наполеоновских войн.', '978517012301', [1], 'Война и мир', 18],
  ['Анна Каренина', 1877, 'История любви, семьи и общественного мнения в Петербурге и Москве.', '978517012302', [1], 'Анна Каренина', 28],
  ['Преступление и наказание', 1866, 'Психологический роман о вине, совести и возможности искупления.', '978517012303', [2], 'Преступление', 210],
  ['Идиот', 1869, 'Князь Мышкин возвращается в Петербург и сталкивается с обществом.', '978517012304', [2], 'Идиот', 220],
  ['Братья Карамазовы', 1880, 'Семейная драма и философский спор о вере, свободе и нравственности.', '978517012305', [2], 'Карамазовы', 230],
  ['Вишнёвый сад', 1904, 'Пьеса о распаде дворянской усадьбы и смене эпох.', '978517012306', [3], 'Вишнёвый сад', 92],
  ['Чайка', 1896, 'Комедия Чехова о театре, любви и несбывшихся ожиданиях.', '978517012307', [3], 'Чайка', 140],
  ['Мастер и Маргарита', 1967, 'Роман о дьяволе в Москве, любви и рукописи, которая не горит.', '978517012308', [4], 'Мастер', 345],
  ['Собачье сердце', 1968, 'Повесть о профессоре Преображенском и эксперименте над Шариком.', '978517012309', [4], 'Собачье сердце', 355],
  ['Доктор Живаго', 1957, 'Роман о русской интеллигенции на фоне революции и гражданской войны.', '978517012310', [5], 'Живаго', 48],
  ['Отцы и дети', 1862, 'Роман о нигилизме Базарова и конфликте поколений.', '978517012311', [6], 'Отцы и дети', 165],
  ['Евгений Онегин', 1833, 'Роман в стихах о светском денди и Татьяне Лариной.', '978517012312', [7], 'Онегин', 200],
  ['Мёртвые души', 1842, 'Поэма Гоголя о Чичикове и скупке мёртвых душ.', '978517012313', [8], 'Мёртвые души', 25],
  ['Тёмные аллеи', 2024, 'Сборник рассказов о любви. Переиздание.', '978517012314', [9], 'Тёмные аллеи', 270],
  ['Один день Ивана Денисовича', 2024, 'Повесть о лагерном дне. Переиздание.', '978517012315', [10], 'Иван Денисович', 15],
  ['Лолита', 2024, 'Роман Набокова. Переиздание.', '978517012316', [11], 'Лолита', 300],
  ['После России', 2024, 'Стихотворения Цветаевой. Переиздание.', '978517012317', [12], 'После России', 320],
  ['Кавказский цикл', 2024, 'Сборник повестей Толстого. Переиздание.', '978517012318', [1], 'Кавказ', 32],
  ['Севастопольские рассказы', 2024, 'Очерки Толстого о Крымской войне. Переиздание.', '978517012319', [1], 'Севастополь', 40],
  ['Бесы', 2024, 'Роман Достоевского. Переиздание.', '978517012320', [2], 'Бесы', 240],
  ['Игрок', 2024, 'Повесть Достоевского. Переиздание.', '978517012321', [2], 'Игрок', 250],
  ['Записки охотника', 2024, 'Цикл рассказов Тургенева. Переиздание.', '978517012322', [6], 'Охотник', 150],
  ['Белая гвардия', 2024, 'Роман Булгакова о Киеве 1918 года. Переиздание.', '978517012323', [4], 'Белая гвардия', 0],
  ['Палата № 6', 2024, 'Повесть Чехова. Переиздание.', '978517012324', [3], 'Палата № 6', 110],
].map((item, index) => {
  const [title, year, description, isbnBody, authorIds, coverTitle, hue] = item as [
    string,
    number,
    string,
    string,
    number[],
    string,
    number,
  ]
  return {
    id: index + 1,
    title,
    year,
    description,
    isbn: isbn13(isbnBody),
    cover_url: coverUrl(coverTitle, hue),
    author_ids: authorIds,
  }
})

const subscriptions: SubscriptionRecord[] = [
  { id: 1, author_id: 1, phone: '79000000001' },
  { id: 2, author_id: 4, phone: '79000000002' },
  { id: 3, author_id: 2, phone: '79000000002' },
]

let nextAuthorId = authors.length + 1
let nextBookId = books.length + 1
let nextSubscriptionId = subscriptions.length + 1

function fail(status: number, errors: FieldError[]): Response {
  return Response.json({ success: false, errors }, { status })
}

function ok(data: unknown, status = 200): Response {
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
    cover_url: book.cover_url,
    authors: book.author_ids
      .map((id) => authors.find((author) => author.id === id))
      .filter((author): author is AuthorRecord => Boolean(author))
      .map(toAuthorShort),
  }
}

function toAuthor(author: AuthorRecord) {
  return {
    id: author.id,
    full_name: author.full_name,
    books: books
      .filter((book) => book.author_ids.includes(author.id))
      .map((book) => ({ id: book.id, title: book.title, year: book.year })),
  }
}

function encodeToken(payload: TokenPayload): string {
  return btoa(JSON.stringify(payload))
}

function readToken(header: string | null): TokenPayload | null {
  if (!header?.startsWith('Bearer ')) {
    return null
  }
  try {
    const payload = JSON.parse(atob(header.slice(7))) as TokenPayload
    if (payload.exp <= Date.now() / 1000 || payload.role !== 'user') {
      return null
    }
    return payload
  } catch {
    return null
  }
}

function requireUser(request: Request): Response | TokenPayload {
  const payload = readToken(request.headers.get('Authorization'))
  if (!payload) {
    return fail(401, [{ message: 'Необходима авторизация' }])
  }
  return payload
}

function resolveAuthors(ids: number[]): { errors: FieldError[] } {
  for (const id of ids) {
    if (!authors.some((author) => author.id === id)) {
      return {
        errors: [{ field: 'author_ids', message: `Автор с id ${id} не найден` }],
      }
    }
  }
  return { errors: [] }
}

async function notifySubscribers(book: BookRecord): Promise<void> {
  const namesByPhone = new Map<string, string[]>()
  for (const authorId of book.author_ids) {
    const author = authors.find((item) => item.id === authorId)
    if (!author) continue
    for (const subscription of subscriptions) {
      if (subscription.author_id !== authorId) continue
      const names = namesByPhone.get(subscription.phone) ?? []
      if (!names.includes(author.full_name)) names.push(author.full_name)
      namesByPhone.set(subscription.phone, names)
    }
  }

  await Promise.allSettled(
    [...namesByPhone.entries()].map(async ([phone, names]) => {
      const text = formatBookSms(names)
      const url = new URL('https://smspilot.ru/api.php')
      url.searchParams.set('send', text)
      url.searchParams.set('to', phone)
      url.searchParams.set(
        'apikey',
        'XXXXXXXXXXXXYYYYYYYYYYYYZZZZZZZZXXXXXXXXXXXXYYYYYYYYYYYYZZZZZZZZ',
      )
      url.searchParams.set('format', 'json')
      try {
        const response = await fetch(url)
        console.info('[SMSPilot]', { to: phone, text, status: response.status })
      } catch (error) {
        console.info('[SMSPilot]', { to: phone, text, error })
      }
    }),
  )
}

async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null)
}

export async function handleMockRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url)
  const marker = '/api/v1'
  const index = url.pathname.indexOf(marker)
  if (index === -1) {
    return null
  }

  const path = url.pathname.slice(index + marker.length) || '/'
  const method = request.method.toUpperCase()

  if (method === 'POST' && path === '/auth/login') {
    const body = await readJson(request)
    const username =
      body && typeof body === 'object' && 'username' in body
        ? String(body.username)
        : ''
    const password =
      body && typeof body === 'object' && 'password' in body
        ? String(body.password)
        : ''
    if (username !== 'user' || password !== 'password') {
      return fail(401, [{ message: 'Неверные учётные данные' }])
    }
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000)
    return ok({
      token: encodeToken({
        id: 1,
        username: 'user',
        role: 'user',
        exp: Math.floor(expiresAt.getTime() / 1000),
      }),
      expires_at: expiresAt.toISOString(),
      user: { id: 1, username: 'user', role: 'user' },
    })
  }

  if (method === 'GET' && path === '/books') {
    const search = url.searchParams.get('search')?.trim().toLowerCase()
    const year = url.searchParams.get('year')
      ? Number.parseInt(url.searchParams.get('year') ?? '', 10)
      : undefined
    const authorId = url.searchParams.get('author_id')
      ? Number.parseInt(url.searchParams.get('author_id') ?? '', 10)
      : undefined
    let items = [...books]
    if (search) {
      items = items.filter((book) =>
        `${book.title} ${book.description} ${book.isbn}`.toLowerCase().includes(search),
      )
    }
    if (year !== undefined && Number.isInteger(year)) {
      items = items.filter((book) => book.year === year)
    }
    if (authorId !== undefined && Number.isInteger(authorId)) {
      items = items.filter((book) => book.author_ids.includes(authorId))
    }
    const page = paginate(
      items,
      url.searchParams.get('page') ?? undefined,
      url.searchParams.get('per-page') ?? undefined,
    )
    return ok({ items: page.items.map(toBook), pagination: page.pagination })
  }

  if (method === 'POST' && path === '/books') {
    const auth = requireUser(request)
    if (auth instanceof Response) return auth
    const form = await request.formData()
    const authorIds = asStringArray(form.getAll('author_ids'))
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value))
    const cover = form.get('cover')
    const errors = validateBookFields({
      title: form.get('title'),
      year: form.get('year'),
      description: form.get('description'),
      isbn: form.get('isbn'),
      authorIds,
    })
    if (!isCoverFile(cover)) {
      errors.push({ field: 'cover', message: 'Загрузите обложку' })
    } else {
      errors.push(...validateCover(cover))
    }
    errors.push(...resolveAuthors(authorIds).errors)
    if (errors.length > 0) return fail(422, errors)
    const book: BookRecord = {
      id: nextBookId,
      title: String(form.get('title')).trim(),
      year: Number.parseInt(String(form.get('year')), 10),
      description: String(form.get('description') ?? '').trim(),
      isbn: String(form.get('isbn') ?? '').trim(),
      cover_url: URL.createObjectURL(cover as File),
      author_ids: authorIds,
    }
    nextBookId += 1
    books.push(book)
    await notifySubscribers(book)
    return ok(toBook(book), 201)
  }

  const bookMatch = path.match(/^\/books\/(\d+)$/)
  if (bookMatch) {
    const id = parseId(bookMatch[1])
    const book = books.find((item) => item.id === id)
    if (method === 'GET') {
      return book ? ok(toBook(book)) : fail(404, [{ message: 'Книга не найдена' }])
    }
    const auth = requireUser(request)
    if (auth instanceof Response) return auth
    if (!book) return fail(404, [{ message: 'Книга не найдена' }])
    if (method === 'DELETE') {
      books.splice(books.indexOf(book), 1)
      return new Response(null, { status: 204 })
    }
    if (method === 'PUT') {
      const form = await request.formData()
      const authorIds = asStringArray(form.getAll('author_ids'))
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value))
      const cover = form.get('cover')
      const errors = validateBookFields({
        title: form.get('title'),
        year: form.get('year'),
        description: form.get('description'),
        isbn: form.get('isbn'),
        authorIds,
      })
      if (!isCoverFile(cover)) {
        errors.push({ field: 'cover', message: 'Загрузите обложку' })
      } else {
        errors.push(...validateCover(cover))
      }
      errors.push(...resolveAuthors(authorIds).errors)
      if (errors.length > 0) return fail(422, errors)
      book.title = String(form.get('title')).trim()
      book.year = Number.parseInt(String(form.get('year')), 10)
      book.description = String(form.get('description') ?? '').trim()
      book.isbn = String(form.get('isbn') ?? '').trim()
      book.author_ids = authorIds
      book.cover_url = URL.createObjectURL(cover as File)
      return ok(toBook(book))
    }
    if (method === 'PATCH') {
      const body = (await readJson(request)) as Record<string, unknown> | null
      if (!body) return fail(422, [{ message: 'Некорректное тело запроса' }])
      const nextAuthorIds = Array.isArray(body.author_ids)
        ? body.author_ids
            .map((value) => Number.parseInt(String(value), 10))
            .filter((value) => Number.isInteger(value))
        : book.author_ids
      const errors = validateBookFields({
        title: body.title ?? book.title,
        year: body.year ?? book.year,
        description: body.description === undefined ? book.description : body.description,
        isbn: body.isbn === undefined ? book.isbn : body.isbn,
        authorIds: nextAuthorIds,
        requireAuthors: body.author_ids !== undefined,
      })
      if (body.author_ids !== undefined) errors.push(...resolveAuthors(nextAuthorIds).errors)
      if (errors.length > 0) return fail(422, errors)
      book.title = String(body.title ?? book.title).trim()
      book.year = Number(body.year ?? book.year)
      book.description = String(body.description ?? book.description).trim()
      book.isbn = String(body.isbn ?? book.isbn).trim()
      book.author_ids = nextAuthorIds
      return ok(toBook(book))
    }
  }

  if (method === 'GET' && path === '/authors') {
    const search = url.searchParams.get('search')?.trim().toLowerCase()
    let items = [...authors]
    if (search) {
      items = items.filter((author) => author.full_name.toLowerCase().includes(search))
    }
    const page = paginate(
      items,
      url.searchParams.get('page') ?? undefined,
      url.searchParams.get('per-page') ?? undefined,
    )
    return ok({ items: page.items.map(toAuthorShort), pagination: page.pagination })
  }

  if (method === 'POST' && path === '/authors') {
    const auth = requireUser(request)
    if (auth instanceof Response) return auth
    const body = await readJson(request)
    const fullName =
      body && typeof body === 'object' && 'full_name' in body ? body.full_name : undefined
    const errors = validateFullName(fullName)
    if (errors.length > 0) return fail(422, errors)
    const author = { id: nextAuthorId, full_name: String(fullName).trim() }
    nextAuthorId += 1
    authors.push(author)
    return ok(toAuthor(author), 201)
  }

  const authorMatch = path.match(/^\/authors\/(\d+)$/)
  if (authorMatch) {
    const id = parseId(authorMatch[1])
    const author = authors.find((item) => item.id === id)
    if (method === 'GET') {
      return author ? ok(toAuthor(author)) : fail(404, [{ message: 'Автор не найден' }])
    }
    const auth = requireUser(request)
    if (auth instanceof Response) return auth
    if (!author) return fail(404, [{ message: 'Автор не найден' }])
    if (method === 'DELETE') {
      authors.splice(authors.indexOf(author), 1)
      for (const book of books) {
        book.author_ids = book.author_ids.filter((authorId) => authorId !== id)
      }
      const remaining = subscriptions.filter((item) => item.author_id !== id)
      subscriptions.length = 0
      subscriptions.push(...remaining)
      return new Response(null, { status: 204 })
    }
    if (method === 'PUT') {
      const body = await readJson(request)
      const fullName =
        body && typeof body === 'object' && 'full_name' in body ? body.full_name : undefined
      const errors = validateFullName(fullName)
      if (errors.length > 0) return fail(422, errors)
      author.full_name = String(fullName).trim()
      return ok(toAuthor(author))
    }
  }

  const subscribeMatch = path.match(/^\/authors\/(\d+)\/subscriptions$/)
  if (method === 'POST' && subscribeMatch) {
    const id = parseId(subscribeMatch[1])
    const author = authors.find((item) => item.id === id)
    if (!author) return fail(404, [{ message: 'Автор не найден' }])
    const body = await readJson(request)
    const phoneValue =
      body && typeof body === 'object' && 'phone' in body ? body.phone : undefined
    const { errors, normalized } = validatePhone(phoneValue)
    if (errors.length > 0 || !normalized) return fail(422, errors)
    if (!subscriptions.some((item) => item.author_id === id && item.phone === normalized)) {
      subscriptions.push({ id: nextSubscriptionId, author_id: author.id, phone: normalized })
      nextSubscriptionId += 1
    }
    return ok({ author_id: author.id, phone: normalized }, 201)
  }

  if (method === 'GET' && path === '/reports/top-authors') {
    const year = parseYear(url.searchParams.get('year') ?? undefined)
    if (!year) return fail(400, [{ field: 'year', message: 'Укажите корректный год выпуска' }])
    const counts = new Map<number, number>()
    for (const book of books) {
      if (book.year !== year) continue
      for (const authorId of book.author_ids) {
        counts.set(authorId, (counts.get(authorId) ?? 0) + 1)
      }
    }
    const items = [...counts.entries()]
      .map(([authorId, booksCount]) => {
        const author = authors.find((item) => item.id === authorId)
        return author
          ? { author_id: author.id, full_name: author.full_name, books_count: booksCount }
          : null
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((left, right) =>
        right.books_count !== left.books_count
          ? right.books_count - left.books_count
          : left.full_name.localeCompare(right.full_name, 'ru'),
      )
      .slice(0, 10)
      .map((item, rank) => ({ rank: rank + 1, ...item }))
    return ok({ year, items })
  }

  return fail(404, [{ message: 'Не найдено' }])
}

type CoverFile = {
  name: string
  type: string
  body: Buffer
}

export type AuthorRecord = {
  id: number
  full_name: string
}

export type BookRecord = {
  id: number
  title: string
  year: number
  description: string
  isbn: string
  cover_name: string
  author_ids: number[]
}

export type SubscriptionRecord = {
  id: number
  author_id: number
  phone: string
}

export type UserRecord = {
  id: number
  username: string
  password: string
  role: 'user'
}

function isbn13(body12: string): string {
  let sum = 0
  for (let index = 0; index < 12; index += 1) {
    sum += Number(body12[index]) * (index % 2 === 0 ? 1 : 3)
  }
  const check = (10 - (sum % 10)) % 10
  return `${body12}${check}`
}

function coverSvg(title: string, hue: number): CoverFile {
  const safe = title.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560">
  <rect width="400" height="560" fill="hsl(${hue} 38% 26%)"/>
  <rect x="24" y="24" width="352" height="512" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
  <text x="200" y="280" fill="#f7f1e8" font-size="22" font-family="Georgia, serif" text-anchor="middle">${safe}</text>
</svg>`
  const name = `${hue}-${title.toLowerCase().replace(/\s+/g, '-')}.svg`
  return {
    name,
    type: 'image/svg+xml',
    body: Buffer.from(svg),
  }
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

const seedBooks: Array<
  Omit<BookRecord, 'cover_name'> & { coverTitle: string; hue: number }
> = [
  {
    id: 1,
    title: 'Война и мир',
    year: 1869,
    description: 'Роман-эпопея о русском обществе в эпоху наполеоновских войн.',
    isbn: isbn13('978517012301'),
    author_ids: [1],
    coverTitle: 'Война и мир',
    hue: 18,
  },
  {
    id: 2,
    title: 'Анна Каренина',
    year: 1877,
    description: 'История любви, семьи и общественного мнения в Петербурге и Москве.',
    isbn: isbn13('978517012302'),
    author_ids: [1],
    coverTitle: 'Анна Каренина',
    hue: 28,
  },
  {
    id: 3,
    title: 'Преступление и наказание',
    year: 1866,
    description: 'Психологический роман о вине, совести и возможности искупления.',
    isbn: isbn13('978517012303'),
    author_ids: [2],
    coverTitle: 'Преступление',
    hue: 210,
  },
  {
    id: 4,
    title: 'Идиот',
    year: 1869,
    description: 'Князь Мышкин возвращается в Петербург и сталкивается с обществом.',
    isbn: isbn13('978517012304'),
    author_ids: [2],
    coverTitle: 'Идиот',
    hue: 220,
  },
  {
    id: 5,
    title: 'Братья Карамазовы',
    year: 1880,
    description: 'Семейная драма и философский спор о вере, свободе и нравственности.',
    isbn: isbn13('978517012305'),
    author_ids: [2],
    coverTitle: 'Карамазовы',
    hue: 230,
  },
  {
    id: 6,
    title: 'Вишнёвый сад',
    year: 1904,
    description: 'Пьеса о распаде дворянской усадьбы и смене эпох.',
    isbn: isbn13('978517012306'),
    author_ids: [3],
    coverTitle: 'Вишнёвый сад',
    hue: 92,
  },
  {
    id: 7,
    title: 'Чайка',
    year: 1896,
    description: 'Комедия Чехова о театре, любви и несбывшихся ожиданиях.',
    isbn: isbn13('978517012307'),
    author_ids: [3],
    coverTitle: 'Чайка',
    hue: 140,
  },
  {
    id: 8,
    title: 'Мастер и Маргарита',
    year: 1967,
    description: 'Роман о дьяволе в Москве, любви и рукописи, которая не горит.',
    isbn: isbn13('978517012308'),
    author_ids: [4],
    coverTitle: 'Мастер',
    hue: 345,
  },
  {
    id: 9,
    title: 'Собачье сердце',
    year: 1968,
    description: 'Повесть о профессоре Преображенском и эксперименте над Шариком.',
    isbn: isbn13('978517012309'),
    author_ids: [4],
    coverTitle: 'Собачье сердце',
    hue: 355,
  },
  {
    id: 10,
    title: 'Доктор Живаго',
    year: 1957,
    description: 'Роман о русской интеллигенции на фоне революции и гражданской войны.',
    isbn: isbn13('978517012310'),
    author_ids: [5],
    coverTitle: 'Живаго',
    hue: 48,
  },
  {
    id: 11,
    title: 'Отцы и дети',
    year: 1862,
    description: 'Роман о нигилизме Базарова и конфликте поколений.',
    isbn: isbn13('978517012311'),
    author_ids: [6],
    coverTitle: 'Отцы и дети',
    hue: 165,
  },
  {
    id: 12,
    title: 'Евгений Онегин',
    year: 1833,
    description: 'Роман в стихах о светском денди и Татьяне Лариной.',
    isbn: isbn13('978517012312'),
    author_ids: [7],
    coverTitle: 'Онегин',
    hue: 200,
  },
  {
    id: 13,
    title: 'Мёртвые души',
    year: 1842,
    description: 'Поэма Гоголя о Чичикове и скупке мёртвых душ.',
    isbn: isbn13('978517012313'),
    author_ids: [8],
    coverTitle: 'Мёртвые души',
    hue: 25,
  },
  {
    id: 14,
    title: 'Тёмные аллеи',
    year: 2024,
    description: 'Сборник рассказов о любви. Переиздание.',
    isbn: isbn13('978517012314'),
    author_ids: [9],
    coverTitle: 'Тёмные аллеи',
    hue: 270,
  },
  {
    id: 15,
    title: 'Один день Ивана Денисовича',
    year: 2024,
    description: 'Повесть о лагерном дне. Переиздание.',
    isbn: isbn13('978517012315'),
    author_ids: [10],
    coverTitle: 'Иван Денисович',
    hue: 15,
  },
  {
    id: 16,
    title: 'Лолита',
    year: 2024,
    description: 'Роман Набокова. Переиздание.',
    isbn: isbn13('978517012316'),
    author_ids: [11],
    coverTitle: 'Лолита',
    hue: 300,
  },
  {
    id: 17,
    title: 'После России',
    year: 2024,
    description: 'Стихотворения Цветаевой. Переиздание.',
    isbn: isbn13('978517012317'),
    author_ids: [12],
    coverTitle: 'После России',
    hue: 320,
  },
  {
    id: 18,
    title: 'Кавказский цикл',
    year: 2024,
    description: 'Сборник повестей Толстого. Переиздание.',
    isbn: isbn13('978517012318'),
    author_ids: [1],
    coverTitle: 'Кавказ',
    hue: 32,
  },
  {
    id: 19,
    title: 'Севастопольские рассказы',
    year: 2024,
    description: 'Очерки Толстого о Крымской войне. Переиздание.',
    isbn: isbn13('978517012319'),
    author_ids: [1],
    coverTitle: 'Севастополь',
    hue: 40,
  },
  {
    id: 20,
    title: 'Бесы',
    year: 2024,
    description: 'Роман Достоевского. Переиздание.',
    isbn: isbn13('978517012320'),
    author_ids: [2],
    coverTitle: 'Бесы',
    hue: 240,
  },
  {
    id: 21,
    title: 'Игрок',
    year: 2024,
    description: 'Повесть Достоевского. Переиздание.',
    isbn: isbn13('978517012321'),
    author_ids: [2],
    coverTitle: 'Игрок',
    hue: 250,
  },
  {
    id: 22,
    title: 'Записки охотника',
    year: 2024,
    description: 'Цикл рассказов Тургенева. Переиздание.',
    isbn: isbn13('978517012322'),
    author_ids: [6],
    coverTitle: 'Охотник',
    hue: 150,
  },
  {
    id: 23,
    title: 'Белая гвардия',
    year: 2024,
    description: 'Роман Булгакова о Киеве 1918 года. Переиздание.',
    isbn: isbn13('978517012323'),
    author_ids: [4],
    coverTitle: 'Белая гвардия',
    hue: 0,
  },
  {
    id: 24,
    title: 'Палата № 6',
    year: 2024,
    description: 'Повесть Чехова. Переиздание.',
    isbn: isbn13('978517012324'),
    author_ids: [3],
    coverTitle: 'Палата № 6',
    hue: 110,
  },
]

const covers = new Map<string, CoverFile>()
const books: BookRecord[] = seedBooks.map((book) => {
  const cover = coverSvg(book.coverTitle, book.hue)
  covers.set(cover.name, cover)
  return {
    id: book.id,
    title: book.title,
    year: book.year,
    description: book.description,
    isbn: book.isbn,
    cover_name: cover.name,
    author_ids: book.author_ids,
  }
})

const subscriptions: SubscriptionRecord[] = [
  { id: 1, author_id: 1, phone: '79000000001' },
  { id: 2, author_id: 4, phone: '79000000002' },
  { id: 3, author_id: 2, phone: '79000000002' },
]

const users: UserRecord[] = [
  { id: 1, username: 'user', password: 'password', role: 'user' },
]

let nextAuthorId = authors.length + 1
let nextBookId = books.length + 1
let nextSubscriptionId = subscriptions.length + 1
let nextCoverId = 1

export const store = {
  authors,
  books,
  subscriptions,
  users,
  covers,
}

export function coverUrl(name: string): string {
  return `/uploads/covers/${name}`
}

export async function saveCover(file: File): Promise<string> {
  const extension = file.name.includes('.')
    ? file.name.slice(file.name.lastIndexOf('.'))
    : ''
  const name = `${Date.now()}-${nextCoverId}${extension}`
  nextCoverId += 1
  const body = Buffer.from(await file.arrayBuffer())
  covers.set(name, {
    name,
    type: file.type || 'application/octet-stream',
    body,
  })
  return name
}

export function nextAuthor(): number {
  const id = nextAuthorId
  nextAuthorId += 1
  return id
}

export function nextBook(): number {
  const id = nextBookId
  nextBookId += 1
  return id
}

export function nextSubscription(): number {
  const id = nextSubscriptionId
  nextSubscriptionId += 1
  return id
}

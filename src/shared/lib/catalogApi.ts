import { isValidIsbn } from './isbn'
import { isValidPhone, normalizePhone } from './phone'

export type FieldError = {
  field?: string
  message: string
}

const currentYear = new Date().getFullYear()

export function paginate<T>(
  items: T[],
  pageRaw: string | undefined,
  perPageRaw: string | undefined,
): {
  items: T[]
  pagination: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
} {
  const page = Math.max(1, Number.parseInt(pageRaw ?? '1', 10) || 1)
  const perPage = Math.min(
    100,
    Math.max(1, Number.parseInt(perPageRaw ?? '20', 10) || 20),
  )
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * perPage

  return {
    items: items.slice(start, start + perPage),
    pagination: {
      total,
      page: safePage,
      per_page: perPage,
      total_pages: totalPages,
    },
  }
}

export function parseId(value: string): number | null {
  const id = Number.parseInt(value, 10)
  return Number.isInteger(id) && id > 0 ? id : null
}

export function parseYear(value: string | undefined): number | null {
  if (value === undefined || value === '') {
    return null
  }

  const year = Number.parseInt(value, 10)
  if (!Number.isInteger(year) || year < 1000 || year > currentYear + 1) {
    return null
  }

  return year
}

export function asStringArray(value: unknown): string[] {
  if (value == null || value === '') {
    return []
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => asStringArray(item))
  }

  return [String(value)]
}

export function validateFullName(fullName: unknown): FieldError[] {
  if (typeof fullName !== 'string' || fullName.trim().length < 2) {
    return [{ field: 'full_name', message: 'Укажите ФИО автора' }]
  }

  if (fullName.trim().length > 255) {
    return [{ field: 'full_name', message: 'ФИО слишком длинное' }]
  }

  return []
}

export function validateBookFields(input: {
  title: unknown
  year: unknown
  description?: unknown
  isbn?: unknown
  authorIds: unknown[]
  requireAuthors?: boolean
}): FieldError[] {
  const errors: FieldError[] = []
  const requireAuthors = input.requireAuthors ?? true

  if (typeof input.title !== 'string' || input.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Укажите название' })
  } else if (input.title.trim().length > 255) {
    errors.push({ field: 'title', message: 'Название слишком длинное' })
  }

  const year =
    typeof input.year === 'number'
      ? input.year
      : Number.parseInt(String(input.year ?? ''), 10)

  if (!Number.isInteger(year) || year < 1000 || year > currentYear + 1) {
    errors.push({ field: 'year', message: 'Укажите корректный год выпуска' })
  }

  if (
    typeof input.description === 'string' &&
    input.description.length > 5000
  ) {
    errors.push({ field: 'description', message: 'Описание слишком длинное' })
  }

  if (
    typeof input.isbn === 'string' &&
    input.isbn.trim() !== '' &&
    !isValidIsbn(input.isbn)
  ) {
    errors.push({ field: 'isbn', message: 'Некорректный ISBN' })
  }

  if (requireAuthors && input.authorIds.length === 0) {
    errors.push({
      field: 'author_ids',
      message: 'Выберите хотя бы одного автора',
    })
  }

  return errors
}

export function validatePhone(phone: unknown): {
  errors: FieldError[]
  normalized: string | null
} {
  if (typeof phone !== 'string') {
    return {
      errors: [{ field: 'phone', message: 'Укажите номер телефона' }],
      normalized: null,
    }
  }

  if (!isValidPhone(phone)) {
    return {
      errors: [{ field: 'phone', message: 'Некорректный номер телефона' }],
      normalized: null,
    }
  }

  return { errors: [], normalized: normalizePhone(phone) }
}

const allowedCoverTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])

export function isCoverFile(value: unknown): value is File {
  return value instanceof File && value.size > 0
}

export function validateCover(file: File): FieldError[] {
  if (file.type && !allowedCoverTypes.has(file.type)) {
    return [{ field: 'cover', message: 'Допустимы JPEG, PNG, WEBP, GIF или SVG' }]
  }

  if (file.size > 5 * 1024 * 1024) {
    return [{ field: 'cover', message: 'Файл больше 5 МБ' }]
  }

  return []
}

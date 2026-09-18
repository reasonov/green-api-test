import type { components } from '@/shared/api/schema'

export type Book = {
  id: number
  title: string
  year: number
  description: string
  isbn: string
  cover_url: string
  authors: Array<{ id: number; full_name: string }>
}

export type AuthorShort = {
  id: number
  full_name: string
}

export type Author = {
  id: number
  full_name: string
  books: Array<{ id: number; title: string; year: number }>
}

export type Pagination = {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export type BookListQuery = {
  page?: number
  perPage?: number
  search?: string
  year?: number
  authorId?: number
}

export type AuthorListQuery = {
  page?: number
  perPage?: number
  search?: string
}

export type TopAuthor = {
  rank: number
  author_id: number
  full_name: string
  books_count: number
}

export function mapBook(data: components['schemas']['Book'] | undefined): Book {
  if (!data?.id || !data.title || data.year == null || !data.cover_url) {
    throw new Error('Некорректные данные книги')
  }

  return {
    id: data.id,
    title: data.title,
    year: data.year,
    description: data.description ?? '',
    isbn: data.isbn ?? '',
    cover_url: data.cover_url,
    authors: (data.authors ?? []).flatMap((author) =>
      author.id && author.full_name
        ? [{ id: author.id, full_name: author.full_name }]
        : [],
    ),
  }
}

export function mapAuthor(
  data: components['schemas']['Author'] | undefined,
): Author {
  if (!data?.id || !data.full_name) {
    throw new Error('Некорректные данные автора')
  }

  return {
    id: data.id,
    full_name: data.full_name,
    books: (data.books ?? []).flatMap((book) =>
      book.id && book.title && book.year != null
        ? [{ id: book.id, title: book.title, year: book.year }]
        : [],
    ),
  }
}

export function mapPagination(
  data: components['schemas']['Pagination'] | undefined,
): Pagination {
  return {
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    per_page: data?.per_page ?? 20,
    total_pages: data?.total_pages ?? 1,
  }
}

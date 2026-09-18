import { client, sendForm, unwrap } from '@/shared/api/client'
import {
  mapBook,
  mapPagination,
  type Book,
  type BookListQuery,
  type Pagination,
} from '@/shared/api/mappers'
import type { components } from '@/shared/api/schema'

export const bookKeys = {
  all: ['books'] as const,
  list: (query: BookListQuery) => [...bookKeys.all, 'list', query] as const,
  detail: (id: number) => [...bookKeys.all, 'detail', id] as const,
}

export async function fetchBooks(
  query: BookListQuery,
): Promise<{ items: Book[]; pagination: Pagination }> {
  const response = await unwrap(
    client.GET('/books', {
      params: {
        query: {
          page: query.page,
          'per-page': query.perPage,
          search: query.search || undefined,
          year: query.year,
          author_id: query.authorId,
        },
      },
    }),
  )

  return {
    items: (response.data?.items ?? []).map((item) => mapBook(item)),
    pagination: mapPagination(response.data?.pagination),
  }
}

export async function fetchBook(id: number): Promise<Book> {
  const response = await unwrap(
    client.GET('/books/{id}', {
      params: { path: { id } },
    }),
  )
  return mapBook(response.data)
}

function toFormData(input: {
  title: string
  year: number
  description?: string
  isbn?: string
  author_ids: number[]
  cover: File
}): FormData {
  const form = new FormData()
  form.append('title', input.title)
  form.append('year', String(input.year))
  if (input.description) {
    form.append('description', input.description)
  }
  if (input.isbn) {
    form.append('isbn', input.isbn)
  }
  for (const id of input.author_ids) {
    form.append('author_ids', String(id))
  }
  form.append('cover', input.cover)
  return form
}

export async function createBook(input: {
  title: string
  year: number
  description?: string
  isbn?: string
  author_ids: number[]
  cover: File
}): Promise<Book> {
  const response = await sendForm<components['schemas']['BookResponse']>(
    'POST',
    '/books',
    toFormData(input),
  )
  return mapBook(response.data)
}

export async function replaceBook(
  id: number,
  input: {
    title: string
    year: number
    description?: string
    isbn?: string
    author_ids: number[]
    cover: File
  },
): Promise<Book> {
  const response = await sendForm<components['schemas']['BookResponse']>(
    'PUT',
    `/books/${id}`,
    toFormData(input),
  )
  return mapBook(response.data)
}

export async function patchBook(
  id: number,
  body: components['schemas']['BookInput'],
): Promise<Book> {
  const response = await unwrap(
    client.PATCH('/books/{id}', {
      params: { path: { id } },
      body,
    }),
  )
  return mapBook(response.data)
}

export async function deleteBook(id: number): Promise<void> {
  await unwrap(
    client.DELETE('/books/{id}', {
      params: { path: { id } },
    }),
  )
}

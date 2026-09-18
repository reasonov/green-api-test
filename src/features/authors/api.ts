import { client, unwrap } from '@/shared/api/client'
import {
  mapAuthor,
  mapPagination,
  type Author,
  type AuthorListQuery,
  type AuthorShort,
  type Pagination,
} from '@/shared/api/mappers'

export const authorKeys = {
  all: ['authors'] as const,
  list: (query: AuthorListQuery) => [...authorKeys.all, 'list', query] as const,
  detail: (id: number) => [...authorKeys.all, 'detail', id] as const,
}

export async function fetchAuthors(
  query: AuthorListQuery,
): Promise<{ items: AuthorShort[]; pagination: Pagination }> {
  const response = await unwrap(
    client.GET('/authors', {
      params: {
        query: {
          page: query.page,
          'per-page': query.perPage,
          search: query.search || undefined,
        },
      },
    }),
  )

  return {
    items: (response.data?.items ?? []).flatMap((item) =>
      item.id && item.full_name
        ? [{ id: item.id, full_name: item.full_name }]
        : [],
    ),
    pagination: mapPagination(response.data?.pagination),
  }
}

export async function fetchAuthor(id: number): Promise<Author> {
  const response = await unwrap(
    client.GET('/authors/{id}', {
      params: { path: { id } },
    }),
  )
  return mapAuthor(response.data)
}

export async function createAuthor(fullName: string): Promise<Author> {
  const response = await unwrap(
    client.POST('/authors', {
      body: { full_name: fullName },
    }),
  )
  return mapAuthor(response.data)
}

export async function updateAuthor(
  id: number,
  fullName: string,
): Promise<Author> {
  const response = await unwrap(
    client.PUT('/authors/{id}', {
      params: { path: { id } },
      body: { full_name: fullName },
    }),
  )
  return mapAuthor(response.data)
}

export async function deleteAuthor(id: number): Promise<void> {
  await unwrap(
    client.DELETE('/authors/{id}', {
      params: { path: { id } },
    }),
  )
}

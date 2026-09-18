import { client, unwrap } from '@/shared/api/client'
import type { TopAuthor } from '@/shared/api/mappers'

export const reportKeys = {
  topAuthors: (year: number) => ['report', 'top-authors', year] as const,
}

export async function fetchTopAuthors(
  year: number,
): Promise<{ year: number; items: TopAuthor[] }> {
  const response = await unwrap(
    client.GET('/reports/top-authors', {
      params: { query: { year } },
    }),
  )

  return {
    year: response.data?.year ?? year,
    items: (response.data?.items ?? []).flatMap((item) =>
      item.rank != null &&
      item.author_id != null &&
      item.full_name &&
      item.books_count != null
        ? [
            {
              rank: item.rank,
              author_id: item.author_id,
              full_name: item.full_name,
              books_count: item.books_count,
            },
          ]
        : [],
    ),
  }
}

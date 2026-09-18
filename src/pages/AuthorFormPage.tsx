import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthorForm } from '@/features/authors/AuthorForm'
import {
  authorKeys,
  createAuthor,
  fetchAuthor,
  updateAuthor,
} from '@/features/authors/api'
import type { AuthorValues } from '@/features/authors/schemas'
import { PageHeader, Spinner } from '@/shared/ui/Feedback'

export function AuthorFormPage() {
  const { id } = useParams()
  const authorId = id ? Number(id) : undefined
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: authorId ? authorKeys.detail(authorId) : ['authors', 'new'],
    queryFn: () => fetchAuthor(authorId as number),
    enabled: Number.isInteger(authorId),
  })

  const save = useMutation({
    mutationFn: (values: AuthorValues) =>
      authorId
        ? updateAuthor(authorId, values.full_name)
        : createAuthor(values.full_name),
    onSuccess: async (author) => {
      await queryClient.invalidateQueries({ queryKey: authorKeys.all })
      void navigate(`/authors/${author.id}`)
    },
  })

  if (authorId && query.isLoading) {
    return <Spinner />
  }

  return (
    <section>
      <PageHeader title={authorId ? 'Редактирование автора' : 'Новый автор'} />
      <AuthorForm
        fullName={query.data?.full_name}
        onSubmit={async (values) => {
          await save.mutateAsync(values)
        }}
      />
    </section>
  )
}

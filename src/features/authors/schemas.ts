import { z } from 'zod'

export const authorSchema = z.object({
  full_name: z.string().trim().min(2, 'Укажите ФИО').max(255),
})

export type AuthorValues = z.infer<typeof authorSchema>

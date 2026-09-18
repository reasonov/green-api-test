import { z } from 'zod'
import { isValidIsbn } from '@/shared/lib/isbn'

const currentYear = new Date().getFullYear()

const isbnField = z
  .string()
  .optional()
  .refine((value) => !value || isValidIsbn(value), 'Некорректный ISBN')

export const bookFormSchema = z.object({
  title: z.string().trim().min(1, 'Укажите название').max(255),
  year: z
    .number({ error: 'Укажите год' })
    .int('Укажите год')
    .min(1000, 'Слишком ранний год')
    .max(currentYear + 1, 'Слишком поздний год'),
  description: z.string().max(5000, 'Описание слишком длинное').optional(),
  isbn: isbnField,
  author_ids: z.array(z.number().int()).min(1, 'Выберите хотя бы одного автора'),
  cover: z.custom<File | undefined>(),
})

export const bookCreateSchema = bookFormSchema.superRefine((value, ctx) => {
  if (!(value.cover instanceof File)) {
    ctx.addIssue({
      code: 'custom',
      path: ['cover'],
      message: 'Загрузите обложку',
    })
  }
})

export type BookFormValues = z.infer<typeof bookFormSchema>

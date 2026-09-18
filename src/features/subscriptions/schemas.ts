import { z } from 'zod'
import { isValidPhone } from '@/shared/lib/phone'

export const subscribeSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, 'Укажите телефон')
    .refine(isValidPhone, 'Некорректный номер телефона'),
})

export type SubscribeValues = z.infer<typeof subscribeSchema>

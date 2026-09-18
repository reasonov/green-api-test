import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Укажите логин'),
  password: z.string().min(1, 'Укажите пароль'),
})

export type LoginValues = z.infer<typeof loginSchema>

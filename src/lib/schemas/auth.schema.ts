import { z } from 'zod'

export const LoginSchema = z.object({
  memberId: z.string().min(1, 'Select a family member'),
  pin: z.string().min(4, 'PIN must be at least 4 digits').max(6, 'PIN max 6 digits'),
})

export type LoginInput = z.infer<typeof LoginSchema>

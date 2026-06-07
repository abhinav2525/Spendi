import { z } from 'zod'

// Phase-0 PIN login. Stays in place until the auth cutover.
export const LoginSchema = z.object({
  memberId: z.string().min(1, 'Select a family member'),
  pin: z.string().min(4, 'PIN must be at least 4 digits').max(6, 'PIN max 6 digits'),
})

export type LoginInput = z.infer<typeof LoginSchema>

// Phase-2 Supabase Auth credentials.
export const CredentialsSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type CredentialsInput = z.infer<typeof CredentialsSchema>

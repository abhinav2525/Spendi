import { z } from 'zod'

export const IncomeSchema = z.object({
  source: z.enum(['salary', 'business', 'freelance', 'bonus', 'other']),
  amount: z.coerce.number().positive('Amount must be positive'),
  frequency: z.enum(['one-time', 'monthly', 'quarterly', 'annual']).default('monthly'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  customFields: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
})

export type IncomeInput = z.infer<typeof IncomeSchema>

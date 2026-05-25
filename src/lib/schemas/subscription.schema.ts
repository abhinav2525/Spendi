import { z } from 'zod'

export const SubscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  frequency: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
  renewalDate: z.string().min(1, 'Renewal date is required'),
  category: z.enum(['entertainment', 'utility', 'productivity', 'health', 'other']).default('other'),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
})

export type SubscriptionInput = z.infer<typeof SubscriptionSchema>

import { z } from 'zod'

export const BUDGET_CATEGORIES = [
  'overall', 'food', 'transport', 'utilities', 'entertainment',
  'shopping', 'health', 'education', 'other',
] as const

export const BudgetSchema = z.object({
  scope: z.enum(['user', 'household']),
  userId: z.string().optional(),
  category: z.enum(BUDGET_CATEGORIES),
  monthlyLimit: z.coerce.number().positive('Limit must be greater than zero'),
}).superRefine((data, ctx) => {
  if (data.scope === 'user' && !data.userId) {
    ctx.addIssue({
      code: 'custom',
      path: ['userId'],
      message: 'User scope requires a userId',
    })
  }
})

export type BudgetInput = z.infer<typeof BudgetSchema>

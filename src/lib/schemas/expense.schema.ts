import { z } from 'zod'

export const CustomFieldSchema = z.object({
  label: z.string().min(1),
  value: z.string(),
})

export const ExpenseSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  category: z.enum(['food', 'transport', 'utilities', 'entertainment', 'shopping', 'health', 'education', 'other']),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.enum(['daily', 'weekly', 'monthly']).optional(),
  tags: z.array(z.string()).default([]),
  paymentMode: z.enum(['cash', 'upi', 'card', 'netbanking']).default('upi'),
  customFields: z.array(CustomFieldSchema).default([]),
  eventId: z.string().optional(),
})

export type ExpenseInput = z.infer<typeof ExpenseSchema>
export type ExpenseFormValues = z.input<typeof ExpenseSchema>

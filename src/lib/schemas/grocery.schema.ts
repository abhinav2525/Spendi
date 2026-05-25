import { z } from 'zod'

export const GroceryItemSchema = z.object({
  name: z.string().min(1, 'Item name required'),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1, 'Unit required'),
  pricePerUnit: z.coerce.number().positive(),
  totalPrice: z.coerce.number().positive(),
})

export const GroceryEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  items: z.array(GroceryItemSchema).min(1, 'Add at least one item'),
  store: z.string().optional(),
  notes: z.string().optional(),
})

export type GroceryEntryInput = z.infer<typeof GroceryEntrySchema>

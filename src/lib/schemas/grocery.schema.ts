import { z } from 'zod'

export const GroceryItemSchema = z.object({
  name: z.string().min(1, 'Item name required'),
  quantity: z.coerce.number().min(0),
  unit: z.string().min(1, 'Unit required'),
  pricePerUnit: z.coerce.number().min(0),
  totalPrice: z.coerce.number().min(0),
})

export const GroceryEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  items: z.array(GroceryItemSchema).min(1, 'Add at least one item'),
  store: z.string().optional(),
  notes: z.string().optional(),
})

export type GroceryEntryInput = z.infer<typeof GroceryEntrySchema>

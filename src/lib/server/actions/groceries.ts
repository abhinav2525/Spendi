'use server'

import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/server/db/client'
import { groceryEntries } from '@/lib/server/db/schema'
import { requireMember } from '@/lib/server/supabase/auth'
import { GroceryEntrySchema, type GroceryEntryInput } from '@/lib/schemas/grocery.schema'
import type { GroceryEntry } from '@/types'
import type { Scope } from '@/lib/store/useScopeStore'

type GroceryRow = typeof groceryEntries.$inferSelect

function rowToGrocery(row: GroceryRow): GroceryEntry {
  return {
    id: row.id,
    userId: row.userId,
    date: row.date,
    items: row.items,
    totalAmount: Number(row.totalAmount),
    store: row.store ?? undefined,
    notes: row.notes ?? undefined,
  }
}

function sumTotal(items: GroceryEntryInput['items']): number {
  return items.reduce((sum, item) => sum + item.totalPrice, 0)
}

export async function listGroceries(opts: { scope: Scope }): Promise<GroceryEntry[]> {
  const me = await requireMember()
  const filters = [eq(groceryEntries.householdId, me.householdId)]
  if (opts.scope === 'mine') filters.push(eq(groceryEntries.userId, me.id))
  const rows = await db
    .select()
    .from(groceryEntries)
    .where(and(...filters))
    .orderBy(desc(groceryEntries.date))
  return rows.map(rowToGrocery)
}

export async function createGrocery(input: GroceryEntryInput): Promise<GroceryEntry> {
  const me = await requireMember()
  const parsed = GroceryEntrySchema.parse(input)
  const [row] = await db
    .insert(groceryEntries)
    .values({
      householdId: me.householdId,
      userId: me.id,
      date: parsed.date,
      items: parsed.items,
      totalAmount: sumTotal(parsed.items), // server is source of truth
      store: parsed.store ?? null,
      notes: parsed.notes ?? null,
    })
    .returning()
  return rowToGrocery(row)
}

export async function updateGrocery(
  id: string,
  input: Partial<GroceryEntryInput>,
): Promise<GroceryEntry> {
  const me = await requireMember()
  const update: Partial<typeof groceryEntries.$inferInsert> = {}
  if (input.date !== undefined) update.date = input.date
  if (input.items !== undefined) {
    update.items = input.items
    // Items changed → totalAmount must be recomputed to stay in sync.
    update.totalAmount = sumTotal(input.items)
  }
  if (input.store !== undefined) update.store = input.store ?? null
  if (input.notes !== undefined) update.notes = input.notes ?? null

  const [row] = await db
    .update(groceryEntries)
    .set(update)
    .where(and(eq(groceryEntries.id, id), eq(groceryEntries.householdId, me.householdId)))
    .returning()
  if (!row) throw new Error('Grocery trip not found')
  return rowToGrocery(row)
}

export async function deleteGrocery(id: string): Promise<void> {
  const me = await requireMember()
  await db
    .delete(groceryEntries)
    .where(and(eq(groceryEntries.id, id), eq(groceryEntries.householdId, me.householdId)))
}

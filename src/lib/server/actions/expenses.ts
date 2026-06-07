'use server'

import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/server/db/client'
import { expenses } from '@/lib/server/db/schema'
import { requireMember } from '@/lib/server/supabase/auth'
import { ExpenseSchema, type ExpenseInput } from '@/lib/schemas/expense.schema'
import type { Expense } from '@/types'
import type { Scope } from '@/lib/store/useScopeStore'

type ExpenseRow = typeof expenses.$inferSelect

/** Map a DB row to the public Expense shape (null → undefined for optional fields). */
function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    userId: row.userId,
    amount: Number(row.amount),
    category: row.category,
    description: row.description,
    date: row.date,
    isRecurring: row.isRecurring,
    recurringPeriod: row.recurringPeriod ?? undefined,
    tags: row.tags,
    paymentMode: row.paymentMode,
    customFields: row.customFields,
    eventId: row.eventId ?? undefined,
  }
}

export async function listExpenses(opts: { scope: Scope }): Promise<Expense[]> {
  const me = await requireMember()
  const filters = [eq(expenses.householdId, me.householdId)]
  if (opts.scope === 'mine') filters.push(eq(expenses.userId, me.id))
  const rows = await db
    .select()
    .from(expenses)
    .where(and(...filters))
    .orderBy(desc(expenses.date))
  return rows.map(rowToExpense)
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const me = await requireMember()
  const parsed = ExpenseSchema.parse(input)
  const [row] = await db
    .insert(expenses)
    .values({
      householdId: me.householdId,
      userId: me.id,
      amount: parsed.amount,
      category: parsed.category,
      description: parsed.description,
      date: parsed.date,
      isRecurring: parsed.isRecurring ?? false,
      recurringPeriod: parsed.recurringPeriod ?? null,
      tags: parsed.tags ?? [],
      paymentMode: parsed.paymentMode ?? 'upi',
      customFields: parsed.customFields ?? [],
      eventId: parsed.eventId || null,
    })
    .returning()
  return rowToExpense(row)
}

export async function updateExpense(id: string, input: Partial<ExpenseInput>): Promise<Expense> {
  const me = await requireMember()
  const update: Partial<typeof expenses.$inferInsert> = {}
  if (input.amount !== undefined) update.amount = input.amount
  if (input.category !== undefined) update.category = input.category
  if (input.description !== undefined) update.description = input.description
  if (input.date !== undefined) update.date = input.date
  if (input.isRecurring !== undefined) update.isRecurring = input.isRecurring
  if (input.recurringPeriod !== undefined) update.recurringPeriod = input.recurringPeriod ?? null
  if (input.tags !== undefined) update.tags = input.tags
  if (input.paymentMode !== undefined) update.paymentMode = input.paymentMode
  if (input.customFields !== undefined) update.customFields = input.customFields
  if (input.eventId !== undefined) update.eventId = input.eventId || null

  const [row] = await db
    .update(expenses)
    .set(update)
    .where(and(eq(expenses.id, id), eq(expenses.householdId, me.householdId)))
    .returning()
  if (!row) throw new Error('Expense not found')
  return rowToExpense(row)
}

export async function deleteExpense(id: string): Promise<void> {
  const me = await requireMember()
  await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.householdId, me.householdId)))
}

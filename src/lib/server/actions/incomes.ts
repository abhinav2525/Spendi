'use server'

import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/server/db/client'
import { incomes } from '@/lib/server/db/schema'
import { requireMember } from '@/lib/server/supabase/auth'
import { IncomeSchema, type IncomeInput } from '@/lib/schemas/income.schema'
import type { Income } from '@/types'
import type { Scope } from '@/lib/store/useScopeStore'

type IncomeRow = typeof incomes.$inferSelect

function rowToIncome(row: IncomeRow): Income {
  return {
    id: row.id,
    userId: row.userId,
    source: row.source,
    amount: Number(row.amount),
    frequency: row.frequency,
    description: row.description,
    date: row.date,
    customFields: row.customFields,
  }
}

export async function listIncomes(opts: { scope: Scope }): Promise<Income[]> {
  const me = await requireMember()
  const filters = [eq(incomes.householdId, me.householdId)]
  if (opts.scope === 'mine') filters.push(eq(incomes.userId, me.id))
  const rows = await db
    .select()
    .from(incomes)
    .where(and(...filters))
    .orderBy(desc(incomes.date))
  return rows.map(rowToIncome)
}

export async function createIncome(input: IncomeInput): Promise<Income> {
  const me = await requireMember()
  const parsed = IncomeSchema.parse(input)
  const [row] = await db
    .insert(incomes)
    .values({
      householdId: me.householdId,
      userId: me.id,
      source: parsed.source,
      amount: parsed.amount,
      frequency: parsed.frequency ?? 'monthly',
      description: parsed.description,
      date: parsed.date,
      customFields: parsed.customFields ?? [],
    })
    .returning()
  return rowToIncome(row)
}

export async function updateIncome(id: string, input: Partial<IncomeInput>): Promise<Income> {
  const me = await requireMember()
  const update: Partial<typeof incomes.$inferInsert> = {}
  if (input.source !== undefined) update.source = input.source
  if (input.amount !== undefined) update.amount = input.amount
  if (input.frequency !== undefined) update.frequency = input.frequency
  if (input.description !== undefined) update.description = input.description
  if (input.date !== undefined) update.date = input.date
  if (input.customFields !== undefined) update.customFields = input.customFields

  const [row] = await db
    .update(incomes)
    .set(update)
    .where(and(eq(incomes.id, id), eq(incomes.householdId, me.householdId)))
    .returning()
  if (!row) throw new Error('Income not found')
  return rowToIncome(row)
}

export async function deleteIncome(id: string): Promise<void> {
  const me = await requireMember()
  await db
    .delete(incomes)
    .where(and(eq(incomes.id, id), eq(incomes.householdId, me.householdId)))
}

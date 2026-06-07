'use server'

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/server/db/client'
import { budgets } from '@/lib/server/db/schema'
import { requireMember } from '@/lib/server/supabase/auth'
import { BudgetSchema, type BudgetInput } from '@/lib/schemas/budget.schema'
import type { Budget } from '@/types'

type BudgetRow = typeof budgets.$inferSelect

function rowToBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    scope: row.scope,
    userId: row.userId ?? undefined,
    category: row.category,
    monthlyLimit: Number(row.monthlyLimit),
  }
}

/** Returns every budget for the caller's household — both user-scoped and household-scoped. */
export async function listBudgets(): Promise<Budget[]> {
  const me = await requireMember()
  const rows = await db
    .select()
    .from(budgets)
    .where(eq(budgets.householdId, me.householdId))
  return rows.map(rowToBudget)
}

/**
 * Upsert keyed on (scope, userId, category) — matches the Zustand store's `setBudget`
 * semantics. Postgres can't UNIQUE-constrain across both scopes in a single index
 * because NULL userId rows would all be distinct, so 0001_policies.sql created two
 * partial unique indexes (one per scope). The Drizzle `targetWhere` clause tells
 * Postgres which one to conflict against.
 *
 * For `scope='user'`, `userId` is forced to the caller's id — we ignore whatever
 * the client sent.
 */
export async function setBudget(input: BudgetInput): Promise<Budget> {
  const me = await requireMember()
  const parsed = BudgetSchema.parse(input)

  if (parsed.scope === 'user') {
    const [row] = await db
      .insert(budgets)
      .values({
        householdId: me.householdId,
        userId: me.id,
        scope: 'user',
        category: parsed.category,
        monthlyLimit: parsed.monthlyLimit,
      })
      .onConflictDoUpdate({
        target: [budgets.householdId, budgets.userId, budgets.category],
        targetWhere: eq(budgets.scope, 'user'),
        set: { monthlyLimit: parsed.monthlyLimit },
      })
      .returning()
    return rowToBudget(row)
  }

  const [row] = await db
    .insert(budgets)
    .values({
      householdId: me.householdId,
      userId: null,
      scope: 'household',
      category: parsed.category,
      monthlyLimit: parsed.monthlyLimit,
    })
    .onConflictDoUpdate({
      target: [budgets.householdId, budgets.category],
      targetWhere: eq(budgets.scope, 'household'),
      set: { monthlyLimit: parsed.monthlyLimit },
    })
    .returning()
  return rowToBudget(row)
}

export async function updateBudget(id: string, input: Partial<BudgetInput>): Promise<Budget> {
  const me = await requireMember()
  const update: Partial<typeof budgets.$inferInsert> = {}
  // scope / userId can't change without breaking the upsert key; restrict updates
  // to monthlyLimit and category, matching what the form actually does on edit.
  if (input.category !== undefined) update.category = input.category
  if (input.monthlyLimit !== undefined) update.monthlyLimit = input.monthlyLimit

  const [row] = await db
    .update(budgets)
    .set(update)
    .where(and(eq(budgets.id, id), eq(budgets.householdId, me.householdId)))
    .returning()
  if (!row) throw new Error('Budget not found')
  return rowToBudget(row)
}

export async function deleteBudget(id: string): Promise<void> {
  const me = await requireMember()
  await db
    .delete(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.householdId, me.householdId)))
}

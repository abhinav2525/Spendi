'use server'

import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/server/db/client'
import { subscriptions } from '@/lib/server/db/schema'
import { requireMember } from '@/lib/server/supabase/auth'
import { SubscriptionSchema, type SubscriptionInput } from '@/lib/schemas/subscription.schema'
import type { Subscription } from '@/types'
import type { Scope } from '@/lib/store/useScopeStore'

type SubscriptionRow = typeof subscriptions.$inferSelect

function rowToSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    amount: Number(row.amount),
    frequency: row.frequency,
    renewalDate: row.renewalDate,
    category: row.category,
    isActive: row.isActive,
    notes: row.notes ?? undefined,
  }
}

export async function listSubscriptions(opts: { scope: Scope }): Promise<Subscription[]> {
  const me = await requireMember()
  const filters = [eq(subscriptions.householdId, me.householdId)]
  if (opts.scope === 'mine') filters.push(eq(subscriptions.userId, me.id))
  const rows = await db
    .select()
    .from(subscriptions)
    .where(and(...filters))
    .orderBy(desc(subscriptions.renewalDate))
  return rows.map(rowToSubscription)
}

export async function createSubscription(input: SubscriptionInput): Promise<Subscription> {
  const me = await requireMember()
  const parsed = SubscriptionSchema.parse(input)
  const [row] = await db
    .insert(subscriptions)
    .values({
      householdId: me.householdId,
      userId: me.id,
      name: parsed.name,
      amount: parsed.amount,
      frequency: parsed.frequency ?? 'monthly',
      renewalDate: parsed.renewalDate,
      category: parsed.category ?? 'other',
      isActive: parsed.isActive ?? true,
      notes: parsed.notes ?? null,
    })
    .returning()
  return rowToSubscription(row)
}

export async function updateSubscription(
  id: string,
  input: Partial<SubscriptionInput>,
): Promise<Subscription> {
  const me = await requireMember()
  const update: Partial<typeof subscriptions.$inferInsert> = {}
  if (input.name !== undefined) update.name = input.name
  if (input.amount !== undefined) update.amount = input.amount
  if (input.frequency !== undefined) update.frequency = input.frequency
  if (input.renewalDate !== undefined) update.renewalDate = input.renewalDate
  if (input.category !== undefined) update.category = input.category
  if (input.isActive !== undefined) update.isActive = input.isActive
  if (input.notes !== undefined) update.notes = input.notes ?? null

  const [row] = await db
    .update(subscriptions)
    .set(update)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.householdId, me.householdId)))
    .returning()
  if (!row) throw new Error('Subscription not found')
  return rowToSubscription(row)
}

export async function deleteSubscription(id: string): Promise<void> {
  const me = await requireMember()
  await db
    .delete(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.householdId, me.householdId)))
}

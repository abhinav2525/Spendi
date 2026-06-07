'use server'

import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/server/db/client'
import { events } from '@/lib/server/db/schema'
import { requireMember } from '@/lib/server/supabase/auth'
import { EventSchema, type EventInput } from '@/lib/schemas/event.schema'
import type { FinanceEvent } from '@/types'

type EventRow = typeof events.$inferSelect

function rowToEvent(row: EventRow): FinanceEvent {
  return {
    id: row.id,
    scope: row.scope,
    userId: row.userId ?? undefined,
    name: row.name,
    emoji: row.emoji,
    startDate: row.startDate,
    endDate: row.endDate ?? undefined,
    notes: row.notes ?? undefined,
    // Drizzle returns timestamps as Date; public type expects ISO string.
    createdAt: row.createdAt.toISOString(),
  }
}

/**
 * Returns every event for the caller's household — both user-scoped and household-scoped.
 * Consumers filter by `event.scope` and `event.userId` client-side; the list is small,
 * and EventList's filtering rules are more nuanced than a single scope param can express.
 */
export async function listEvents(): Promise<FinanceEvent[]> {
  const me = await requireMember()
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.householdId, me.householdId))
    .orderBy(desc(events.startDate))
  return rows.map(rowToEvent)
}

export async function createEvent(input: EventInput): Promise<FinanceEvent> {
  const me = await requireMember()
  const parsed = EventSchema.parse(input)
  // userId is forced to caller for user-scoped events; NULL for household-scoped.
  // endDate '' → null. Both the Zod superRefine and the DB CHECK guarantee
  // endDate >= startDate, so we don't re-check here.
  const [row] = await db
    .insert(events)
    .values({
      householdId: me.householdId,
      userId: parsed.scope === 'user' ? me.id : null,
      scope: parsed.scope,
      name: parsed.name,
      emoji: parsed.emoji,
      startDate: parsed.startDate,
      endDate: parsed.endDate ? parsed.endDate : null,
      notes: parsed.notes ?? null,
    })
    .returning()
  return rowToEvent(row)
}

export async function updateEvent(
  id: string,
  input: Partial<EventInput>,
): Promise<FinanceEvent> {
  const me = await requireMember()
  const update: Partial<typeof events.$inferInsert> = {}
  if (input.name !== undefined) update.name = input.name
  if (input.emoji !== undefined) update.emoji = input.emoji
  if (input.startDate !== undefined) update.startDate = input.startDate
  if (input.endDate !== undefined) update.endDate = input.endDate ? input.endDate : null
  if (input.notes !== undefined) update.notes = input.notes ?? null
  // scope and userId stay fixed for the row's lifetime — changing them would
  // need a delete-and-recreate to keep the scope/userId CHECK constraint happy.

  const [row] = await db
    .update(events)
    .set(update)
    .where(and(eq(events.id, id), eq(events.householdId, me.householdId)))
    .returning()
  if (!row) throw new Error('Event not found')
  return rowToEvent(row)
}

export async function deleteEvent(id: string): Promise<void> {
  const me = await requireMember()
  // expenses.eventId is ON DELETE SET NULL, so linked expenses keep their data
  // and just lose the event tag — matches existing behavior on the detail page.
  await db
    .delete(events)
    .where(and(eq(events.id, id), eq(events.householdId, me.householdId)))
}

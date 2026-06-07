'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/server/db/client'
import { householdMembers } from '@/lib/server/db/schema'
import { requireMember, type CurrentMember } from '@/lib/server/supabase/auth'

export async function getMe(): Promise<CurrentMember> {
  return requireMember()
}

export async function listHouseholdMembers(): Promise<CurrentMember[]> {
  const me = await requireMember()
  return db
    .select()
    .from(householdMembers)
    .where(eq(householdMembers.householdId, me.householdId))
}

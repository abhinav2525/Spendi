import 'server-only'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createSupabaseServerClient } from './server'
import { db } from '@/lib/server/db/client'
import { householdMembers } from '@/lib/server/db/schema'

export type CurrentMember = typeof householdMembers.$inferSelect

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user ?? null
}

export async function getCurrentMember(): Promise<CurrentMember | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const rows = await db
    .select()
    .from(householdMembers)
    .where(eq(householdMembers.id, user.id))
    .limit(1)
  return rows[0] ?? null
}

/** Use in Server Components / Server Actions that require a signed-in household member. */
export async function requireMember(): Promise<CurrentMember> {
  const member = await getCurrentMember()
  if (!member) redirect('/login')
  return member
}

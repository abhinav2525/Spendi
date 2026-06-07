'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/server/supabase/server'
import {
  CredentialsSchema,
  type CredentialsInput,
} from '@/lib/schemas/auth.schema'

export type AuthActionResult = { ok: true } | { ok: false; message: string }

export async function signInWithCredentials(
  input: CredentialsInput,
): Promise<AuthActionResult> {
  const parsed = CredentialsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    return { ok: false, message: error.message }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

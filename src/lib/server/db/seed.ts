import { createClient } from '@supabase/supabase-js'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'
import {
  MOCK_USERS,
  MOCK_EXPENSES,
  MOCK_INCOME,
  MOCK_SUBSCRIPTIONS,
  MOCK_EVENTS,
  MOCK_BUDGETS,
  MOCK_GROCERIES,
} from '@/lib/utils/mockData'

const SEED_PASSWORD = 'gharkhata-dev-1234'

const SEED_EMAILS: Record<string, string> = {
  'admin-1': 'rajesh@gharkhata.local',
  'member-1': 'priya@gharkhata.local',
  'member-2': 'arjun@gharkhata.local',
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

async function main() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const databaseUrl = requireEnv('DATABASE_DIRECT_URL')

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('→ Creating Supabase auth users')
  const idMap: Record<string, string> = {}
  for (const mock of MOCK_USERS) {
    const email = SEED_EMAILS[mock.id]
    if (!email) throw new Error(`No seed email mapped for ${mock.id}`)

    const { data: existing } = await admin.auth.admin.listUsers()
    const found = existing?.users.find((u) => u.email === email)
    if (found) {
      idMap[mock.id] = found.id
      console.log(`  · ${email} already exists → ${found.id}`)
      continue
    }
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { name: mock.name, role: mock.role },
    })
    if (error || !data.user) throw error ?? new Error('createUser returned no user')
    idMap[mock.id] = data.user.id
    console.log(`  · ${email} → ${data.user.id}`)
  }

  const sql = postgres(databaseUrl, { max: 1, prepare: false })
  const db = drizzle(sql, { schema })

  try {
    console.log('→ Wiping existing household-scoped data')
    await sql`TRUNCATE
      ${sql('households')}, ${sql('household_members')},
      ${sql('expenses')},   ${sql('incomes')},
      ${sql('subscriptions')}, ${sql('grocery_entries')},
      ${sql('budgets')},    ${sql('events')}
      RESTART IDENTITY CASCADE`

    console.log('→ Inserting household')
    const [household] = await db
      .insert(schema.households)
      .values({ name: 'GharKhata Demo' })
      .returning()

    console.log('→ Inserting household members')
    for (const mock of MOCK_USERS) {
      await db.insert(schema.householdMembers).values({
        id: idMap[mock.id],
        householdId: household.id,
        name: mock.name,
        role: mock.role,
      })
    }

    const userId = (mockId: string | undefined) =>
      mockId ? idMap[mockId] : undefined

    console.log('→ Inserting events')
    const eventIdMap: Record<string, string> = {}
    for (const ev of MOCK_EVENTS) {
      const [row] = await db
        .insert(schema.events)
        .values({
          householdId: household.id,
          userId: ev.scope === 'user' ? userId(ev.userId) : null,
          scope: ev.scope,
          name: ev.name,
          emoji: ev.emoji,
          startDate: ev.startDate,
          endDate: ev.endDate ?? null,
          notes: ev.notes ?? null,
        })
        .returning({ id: schema.events.id })
      eventIdMap[ev.id] = row.id
    }

    console.log('→ Inserting expenses')
    for (const ex of MOCK_EXPENSES) {
      await db.insert(schema.expenses).values({
        householdId: household.id,
        userId: userId(ex.userId)!,
        amount: ex.amount,
        category: ex.category,
        description: ex.description,
        date: ex.date,
        isRecurring: ex.isRecurring,
        recurringPeriod: ex.recurringPeriod ?? null,
        tags: ex.tags,
        paymentMode: ex.paymentMode,
        customFields: ex.customFields,
        eventId: ex.eventId ? eventIdMap[ex.eventId] : null,
      })
    }

    console.log('→ Inserting incomes')
    for (const inc of MOCK_INCOME) {
      await db.insert(schema.incomes).values({
        householdId: household.id,
        userId: userId(inc.userId)!,
        source: inc.source,
        amount: inc.amount,
        frequency: inc.frequency,
        description: inc.description,
        date: inc.date,
        customFields: inc.customFields,
      })
    }

    console.log('→ Inserting subscriptions')
    for (const sub of MOCK_SUBSCRIPTIONS) {
      await db.insert(schema.subscriptions).values({
        householdId: household.id,
        userId: userId(sub.userId)!,
        name: sub.name,
        amount: sub.amount,
        frequency: sub.frequency,
        renewalDate: sub.renewalDate,
        category: sub.category,
        isActive: sub.isActive,
        notes: sub.notes ?? null,
      })
    }

    console.log('→ Inserting groceries')
    for (const g of MOCK_GROCERIES) {
      await db.insert(schema.groceryEntries).values({
        householdId: household.id,
        userId: userId(g.userId)!,
        date: g.date,
        items: g.items,
        totalAmount: g.totalAmount,
        store: g.store ?? null,
        notes: g.notes ?? null,
      })
    }

    console.log('→ Inserting budgets')
    for (const b of MOCK_BUDGETS) {
      await db.insert(schema.budgets).values({
        householdId: household.id,
        userId: b.scope === 'user' ? userId(b.userId)! : null,
        scope: b.scope,
        category: b.category,
        monthlyLimit: b.monthlyLimit,
      })
    }

    console.log('\n✓ Seed complete.')
    console.log(`  Household:   ${household.id}`)
    console.log('  Login as:')
    for (const mock of MOCK_USERS) {
      console.log(`    ${SEED_EMAILS[mock.id]}  /  ${SEED_PASSWORD}`)
    }
  } finally {
    await sql.end()
  }
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err)
  process.exit(1)
})

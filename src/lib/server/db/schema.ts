import {
  pgEnum,
  pgTable,
  uuid,
  text,
  date,
  boolean,
  jsonb,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import type { CustomField, GroceryItem } from '@/types'

export const userRole = pgEnum('user_role', ['admin', 'member'])

export const expenseCategory = pgEnum('expense_category', [
  'food',
  'transport',
  'utilities',
  'entertainment',
  'shopping',
  'health',
  'education',
  'other',
])

export const paymentMode = pgEnum('payment_mode', ['cash', 'upi', 'card', 'netbanking'])

export const recurringPeriod = pgEnum('recurring_period', ['daily', 'weekly', 'monthly'])

export const incomeSource = pgEnum('income_source', [
  'salary',
  'business',
  'freelance',
  'bonus',
  'other',
])

export const incomeFrequency = pgEnum('income_frequency', [
  'one-time',
  'monthly',
  'quarterly',
  'annual',
])

export const subscriptionFrequency = pgEnum('subscription_frequency', [
  'monthly',
  'quarterly',
  'annual',
])

export const subscriptionCategory = pgEnum('subscription_category', [
  'entertainment',
  'utility',
  'productivity',
  'health',
  'other',
])

export const scope = pgEnum('scope', ['user', 'household'])

export const budgetCategory = pgEnum('budget_category', [
  'overall',
  'food',
  'transport',
  'utilities',
  'entertainment',
  'shopping',
  'health',
  'education',
  'other',
])

export const households = pgTable('households', {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
})

export const householdMembers = pgTable(
  'household_members',
  {
    id: uuid().primaryKey(),
    householdId: uuid()
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    avatar: text(),
    role: userRole().default('member').notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('household_members_household_id_idx').on(t.householdId)],
)

const amount = () => numeric({ precision: 12, scale: 2, mode: 'number' })

export const events = pgTable(
  'events',
  {
    id: uuid().defaultRandom().primaryKey(),
    householdId: uuid()
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    userId: uuid().references(() => householdMembers.id, { onDelete: 'cascade' }),
    scope: scope().notNull(),
    name: text().notNull(),
    emoji: text().default('🎉').notNull(),
    startDate: date({ mode: 'string' }).notNull(),
    endDate: date({ mode: 'string' }),
    notes: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('events_household_id_idx').on(t.householdId),
    index('events_user_id_idx').on(t.userId),
  ],
)

export const expenses = pgTable(
  'expenses',
  {
    id: uuid().defaultRandom().primaryKey(),
    householdId: uuid()
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    userId: uuid()
      .notNull()
      .references(() => householdMembers.id, { onDelete: 'cascade' }),
    amount: amount().notNull(),
    category: expenseCategory().notNull(),
    description: text().notNull(),
    date: date({ mode: 'string' }).notNull(),
    isRecurring: boolean().default(false).notNull(),
    recurringPeriod: recurringPeriod(),
    tags: jsonb().$type<string[]>().default([]).notNull(),
    paymentMode: paymentMode().default('upi').notNull(),
    customFields: jsonb().$type<CustomField[]>().default([]).notNull(),
    eventId: uuid().references(() => events.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('expenses_household_id_idx').on(t.householdId),
    index('expenses_user_id_idx').on(t.userId),
    index('expenses_date_idx').on(t.date),
    index('expenses_event_id_idx').on(t.eventId),
  ],
)

export const incomes = pgTable(
  'incomes',
  {
    id: uuid().defaultRandom().primaryKey(),
    householdId: uuid()
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    userId: uuid()
      .notNull()
      .references(() => householdMembers.id, { onDelete: 'cascade' }),
    source: incomeSource().notNull(),
    amount: amount().notNull(),
    frequency: incomeFrequency().default('monthly').notNull(),
    description: text().notNull(),
    date: date({ mode: 'string' }).notNull(),
    customFields: jsonb().$type<CustomField[]>().default([]).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('incomes_household_id_idx').on(t.householdId),
    index('incomes_user_id_idx').on(t.userId),
    index('incomes_date_idx').on(t.date),
  ],
)

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid().defaultRandom().primaryKey(),
    householdId: uuid()
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    userId: uuid()
      .notNull()
      .references(() => householdMembers.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    amount: amount().notNull(),
    frequency: subscriptionFrequency().default('monthly').notNull(),
    renewalDate: date({ mode: 'string' }).notNull(),
    category: subscriptionCategory().default('other').notNull(),
    isActive: boolean().default(true).notNull(),
    notes: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('subscriptions_household_id_idx').on(t.householdId),
    index('subscriptions_user_id_idx').on(t.userId),
  ],
)

export const groceryEntries = pgTable(
  'grocery_entries',
  {
    id: uuid().defaultRandom().primaryKey(),
    householdId: uuid()
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    userId: uuid()
      .notNull()
      .references(() => householdMembers.id, { onDelete: 'cascade' }),
    date: date({ mode: 'string' }).notNull(),
    items: jsonb().$type<GroceryItem[]>().notNull(),
    totalAmount: amount().notNull(),
    store: text(),
    notes: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('grocery_entries_household_id_idx').on(t.householdId),
    index('grocery_entries_user_id_idx').on(t.userId),
    index('grocery_entries_date_idx').on(t.date),
  ],
)

export const budgets = pgTable(
  'budgets',
  {
    id: uuid().defaultRandom().primaryKey(),
    householdId: uuid()
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    userId: uuid().references(() => householdMembers.id, { onDelete: 'cascade' }),
    scope: scope().notNull(),
    category: budgetCategory().notNull(),
    monthlyLimit: amount().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('budgets_household_id_idx').on(t.householdId)],
)

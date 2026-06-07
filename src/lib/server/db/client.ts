import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const isPooler = connectionString.includes('pooler.supabase.com')

const queryClient = postgres(connectionString, {
  max: isPooler ? 1 : 10,
  prepare: !isPooler,
  idle_timeout: 20,
})

export const db = drizzle(queryClient, { schema })

export type Database = typeof db

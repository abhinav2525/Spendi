import { defineConfig } from 'drizzle-kit'

// Bun loads .env.local automatically. DATABASE_DIRECT_URL is preferred for migrations
// (drizzle-kit opens its own connection); DATABASE_URL is the runtime pooler URL.
// `drizzle-kit generate` works offline, so a placeholder is fine until Supabase is provisioned.
const url =
  process.env.DATABASE_DIRECT_URL ??
  process.env.DATABASE_URL ??
  'postgresql://placeholder:placeholder@localhost:5432/placeholder'

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './src/lib/server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  schemaFilter: ['public'],
  verbose: true,
  strict: true,
})

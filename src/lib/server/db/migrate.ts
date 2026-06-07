import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

const url = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL
if (!url) {
  console.error('Set DATABASE_DIRECT_URL (preferred) or DATABASE_URL')
  process.exit(1)
}

const sql = postgres(url, { max: 1, prepare: false })
const db = drizzle(sql)

migrate(db, { migrationsFolder: 'src/lib/server/db/migrations' })
  .then(async () => {
    console.log('✓ Migrations applied')
    await sql.end()
  })
  .catch(async (err) => {
    console.error('✗ Migration failed:', err)
    await sql.end()
    process.exit(1)
  })

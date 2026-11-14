import type { Database } from './index';
import { migrations } from './migrations';

// Any fixed number, the same on every server
const MIGRATION_LOCK_ID = 727274;

/** Run pending migrations. Safe on every start. */
export async function runMigrations(db: Database) {
  await db.transaction(async tx => {
    await tx.query('SELECT pg_advisory_xact_lock($1)', [MIGRATION_LOCK_ID]);
    await tx.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await tx.query<{ id: string }>('SELECT id FROM schema_migrations');
    const applied = new Set(rows.map(r => r.id));

    for (const migration of migrations) {
      if (applied.has(migration.id)) continue;
      for (const statement of splitStatements(migration.sql)) {
        await tx.query(statement);
      }
      await tx.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migration.id]);
      console.log(`[db] applied migration ${migration.id}`);
    }
  });
}

function splitStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map(s => s.trim())
    .filter(Boolean);
}

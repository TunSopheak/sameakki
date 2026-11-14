import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config';

/** Query API shared by pg and PGlite. */
export interface Queryable {
  query<T = any>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export interface Database extends Queryable {
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
  kind: 'postgres' | 'pglite';
}

// Keep DATE as 'YYYY-MM-DD' text so time zones cannot shift it
const DATE_OID = 1082;

async function createPostgres(): Promise<Database> {
  const pg = await import('pg');
  const { Pool, types } = pg.default ?? pg;
  types.setTypeParser(DATE_OID, (v: string) => v);

  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    connectionTimeoutMillis: 10_000,
    // Keep connections under Neon's 5 minute sleep
    idleTimeoutMillis: 240_000,
    statement_timeout: 15_000,
    keepAlive: true,
  });

  // Neon drops idle connections; without this listener the app crashes
  pool.on('error', err => console.warn('[db] idle connection dropped:', err.message));

  return {
    kind: 'postgres',
    query: (sql, params) => pool.query(sql, params as any[]) as any,
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn({ query: (sql, params) => client.query(sql, params as any[]) as any });
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

async function createPglite(): Promise<Database> {
  const { PGlite } = await import('@electric-sql/pglite');
  fs.mkdirSync(config.pgliteDir, { recursive: true });
  // A stale lock file from a crash stops PGlite starting
  fs.rmSync(path.join(config.pgliteDir, 'postmaster.pid'), { force: true });
  const db = new PGlite(config.pgliteDir, { parsers: { [DATE_OID]: (v: string) => v } });
  await db.waitReady;

  // PGlite has one connection, so transactions run one by one
  let queue: Promise<unknown> = Promise.resolve();

  return {
    kind: 'pglite',
    query: (sql, params) => db.query(sql, params as any[]) as any,
    transaction(fn) {
      const run = queue.then(() =>
        db.transaction(tx => fn({ query: (sql, params) => tx.query(sql, params as any[]) as any }))
      );
      queue = run.catch(() => undefined);
      return run;
    },
    close: () => db.close(),
  };
}

let instance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!instance) {
    instance = config.databaseUrl ? await createPostgres() : await createPglite();
  }
  return instance;
}

export async function closeDb() {
  if (instance) {
    await instance.close();
    instance = null;
  }
}

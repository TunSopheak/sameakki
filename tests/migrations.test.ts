// Checks that a migration copes with data that already exists, the way it will on a real server.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Set before the app reads its settings, and never a real database (see the check in before()).
process.env.DATABASE_URL = '';
process.env.PGLITE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'sameakki-migration-'));
process.env.NODE_ENV = 'test';

let query: (sql: string, params?: unknown[]) => Promise<any[]>;
let rerun: (id: string) => Promise<void>;
let closeDb: () => Promise<void>;

before(async () => {
  const { getDb, closeDb: close } = await import('../server/db');
  const { runMigrations } = await import('../server/db/migrate');
  const db = await getDb();
  assert.equal(db.kind, 'pglite', 'The tests must use the temporary embedded database');
  await runMigrations(db);
  query = async (sql, params) => (await db.query(sql, params as any[])).rows;
  closeDb = close;
  // Forget that a migration ran so it runs again, on whatever the table holds by then
  rerun = async id => {
    await query('DELETE FROM schema_migrations WHERE id = $1', [id]);
    await runMigrations(db);
  };
});

after(async () => {
  await closeDb();
  fs.rmSync(process.env.PGLITE_DIR!, { recursive: true, force: true });
});

test('014 gives tasks that already exist a start date, never after the due date', async () => {
  // Put the table back the way it was before 014, then add tasks the old way
  await query('ALTER TABLE tasks DROP CONSTRAINT tasks_start_not_after_due');
  await query('ALTER TABLE tasks DROP COLUMN start_date');

  const [user] = await query("INSERT INTO users (name, email) VALUES ('U', 'u@t.local') RETURNING id");
  const [group] = await query("INSERT INTO groups (name, code) VALUES ('G', 'GRP-TEST') RETURNING id");
  const add = async (title: string, createdAt: string, due: string) =>
    (
      await query(
        `INSERT INTO tasks (group_id, title, assigned_to, due_date, created_at) VALUES ($1, $2, $3, $4, $5::timestamptz) RETURNING id`,
        [group.id, title, user.id, due, createdAt]
      )
    )[0].id as string;

  const morning = await add('Created in the morning', '2026-01-10T02:00:00Z', '2026-01-20'); // 09:00 in Phnom Penh
  const lateNight = await add('Created late at night UTC', '2026-01-10T20:00:00Z', '2026-01-25'); // already the 11th in Phnom Penh
  const afterDue = await add('Created after it was due', '2026-02-01T05:00:00Z', '2026-01-15');

  await rerun('014_task_start_date');

  const startOf = async (id: string) => (await query('SELECT start_date::text AS d FROM tasks WHERE id = $1', [id]))[0].d;
  assert.equal(await startOf(morning), '2026-01-10');
  assert.equal(await startOf(lateNight), '2026-01-11', 'the day is the one in Phnom Penh, not UTC');
  assert.equal(await startOf(afterDue), '2026-01-15', 'a start never lands after the due date');

  // The new rules are in place afterwards
  const nulls = await query('SELECT count(*)::int AS n FROM tasks WHERE start_date IS NULL');
  assert.equal(nulls[0].n, 0);
  await assert.rejects(query('UPDATE tasks SET start_date = due_date + 1 WHERE id = $1', [morning]));
  await assert.rejects(query('INSERT INTO tasks (group_id, title, due_date) VALUES ($1, $2, $3)', [group.id, 'No start', '2026-03-01']));
});

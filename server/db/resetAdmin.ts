// `npm run admin:reset -- <username> <password>` sets the Super Admin login.
// Stop the dev server first when using the embedded database.
import { hashPassword } from '../services/password';
import { closeDb, getDb } from './index';
import { runMigrations } from './migrate';

async function resetAdmin() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) {
    console.error('Usage: npm run admin:reset -- <username> <password>');
    process.exitCode = 1;
    return;
  }
  const db = await getDb();
  await runMigrations(db);
  const passwordHash = await hashPassword(password);

  const { rows } = await db.query<{ id: string }>(
    `SELECT id FROM users WHERE role = 'super_admin' ORDER BY created_at LIMIT 1`
  );

  if (rows[0]) {
    await db.query('UPDATE users SET username = $2, password_hash = $3 WHERE id = $1', [rows[0].id, username, passwordHash]);
    console.log(`[admin] Super Admin updated. Sign in with username "${username}".`);
  } else {
    await db.query(
      `INSERT INTO users (name, email, username, password_hash, role, department)
       VALUES ('Super Admin', $1, $1, $2, 'super_admin', 'Team Leader')`,
      [username, passwordHash]
    );
    console.log(`[admin] No Super Admin existed, so one was created. Sign in with username "${username}".`);
  }
  console.log('[admin] Change this password after signing in (profile menu > change password).');
}

resetAdmin()
  .catch(err => {
    console.error('[admin] failed:', err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());

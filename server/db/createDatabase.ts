// `npm run db:create`: creates the database named in DATABASE_URL if it is missing.
import pg from 'pg';
import { config } from '../config';

async function createDatabase() {
  if (!config.databaseUrl) {
    console.error('[db] DATABASE_URL is empty. Set it in .env first (see .env.example).');
    process.exitCode = 1;
    return;
  }

  const url = new URL(config.databaseUrl);
  const dbName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!dbName) throw new Error('DATABASE_URL has no database name at the end.');

  // CREATE DATABASE has to run from another database
  url.pathname = '/postgres';
  const client = new pg.Client({
    connectionString: url.toString(),
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();
  try {
    const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (rows[0]) {
      console.log(`[db] Database "${dbName}" already exists.`);
    } else {
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
      console.log(`[db] Created database "${dbName}". Start the app and the tables are created automatically.`);
    }
  } finally {
    await client.end();
  }
}

createDatabase().catch(err => {
  console.error('[db] failed:', err.message);
  process.exitCode = 1;
});

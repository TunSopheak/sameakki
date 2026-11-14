import { createApp } from './app';
import { config } from './config';
import { closeDb, getDb } from './db';
import { runMigrations } from './db/migrate';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function connectDatabase(attempts = 5) {
  for (let attempt = 1; ; attempt++) {
    try {
      const db = await getDb();
      await runMigrations(db);
      await Promise.all([db.query('SELECT 1'), db.query('SELECT 1'), db.query('SELECT 1')]);
      return db;
    } catch (err) {
      if (attempt >= attempts) throw err;
      console.warn(`[db] connection failed (${attempt}/${attempts}), retrying...`, (err as Error).message);
      await sleep(2000 * attempt);
    }
  }
}

async function main() {
  if (config.isProduction && !config.databaseUrl) {
    throw new Error('DATABASE_URL is required in production. The embedded database loses data on most hosts.');
  }

  const db = await connectDatabase();
  console.log(`[db] connected (${db.kind === 'pglite' ? 'embedded PGlite' : 'PostgreSQL'})`);

  const server = createApp().listen(config.port, () => {
    console.log(`[server] listening on port ${config.port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(async () => {
      await closeDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', err => console.error('[server] unhandled rejection:', err));

main().catch(err => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});

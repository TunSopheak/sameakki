import 'dotenv/config';
import path from 'node:path';

const env = process.env;
const isProduction = env.NODE_ENV === 'production';

const jwtSecret = env.JWT_SECRET || (isProduction ? '' : 'dev-only-insecure-secret-change-me');
if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production.');
}

export const config = {
  isProduction,
  port: Number(env.PORT) || 3000,
  /** Empty means the embedded PGlite database (local testing only). */
  databaseUrl: env.DATABASE_URL || '',
  pgliteDir: path.resolve(env.PGLITE_DIR || './data/pglite'),
  databaseSsl: env.DATABASE_SSL ? env.DATABASE_SSL !== 'false' : isProduction,
  jwtSecret,
  cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE !== 'false' : isProduction,
  jwtExpiresInDays: Number(env.JWT_EXPIRES_IN_DAYS) || 7,
  corsOrigins: (env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
  clientDistDir: path.resolve(env.CLIENT_DIST_DIR || './dist/client'),
};

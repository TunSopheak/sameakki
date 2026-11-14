import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { getDb } from '../db';
import { clearAuthCookie, requireAuth, setAuthCookie } from '../middleware/auth';
import { badRequest, unauthorized } from '../middleware/errors';
import { toUser, USER_COLUMNS } from '../services/mappers';
import { hashPassword } from '../services/password';
import { assertNotExpired } from '../services/plan';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1).max(200),
  password: z.string().min(1).max(200),
});

// There is no public sign-up: the Super Admin creates every account.

authRouter.post('/login', authLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const db = await getDb();
  const { rows } = await db.query(
    `SELECT ${USER_COLUMNS}, password_hash, expires_at FROM users WHERE (lower(email) = $1 OR lower(username) = $1) AND is_active = 1`,
    [input.email]
  );
  const row = rows[0];
  const ok = row?.password_hash ? await bcrypt.compare(input.password, row.password_hash) : false;
  if (!ok) throw unauthorized('Incorrect email/username or password.');
  assertNotExpired(row);

  setAuthCookie(res, row.id);
  res.json({ user: toUser(row) });
});

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1).max(200),
});

authRouter.post('/change-password', requireAuth, authLimiter, async (req, res) => {
  const input = passwordSchema.parse(req.body);
  const db = await getDb();
  const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user!.id]);
  const ok = rows[0]?.password_hash && (await bcrypt.compare(input.currentPassword, rows[0].password_hash));
  if (!ok) throw badRequest('Current password is incorrect.');
  if (input.newPassword === input.currentPassword) throw badRequest('Choose a different password from the current one.');
  await db.query('UPDATE users SET password_hash = $2, must_change_password = false WHERE id = $1', [
    req.user!.id,
    await hashPassword(input.newPassword),
  ]);
  res.status(204).end();
});

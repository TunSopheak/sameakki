import type { RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getDb } from '../db';
import { toUser, USER_COLUMNS } from '../services/mappers';
import { planState, LOCKED_MESSAGE, READ_ONLY_MESSAGE } from '../services/plan';
import type { User } from '../../shared/types';
import { forbidden, unauthorized } from './errors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const STILL_ALLOWED = /^\/api\/(auth\/change-password|notifications\/(read-all|[^/]+\/read)|users\/me(\/avatar)?)\/?$/;

export const AUTH_COOKIE = 'leadersync_token';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// A frontend on another domain needs SameSite=None, which browsers only allow with Secure.
const crossSite = config.corsOrigins.length > 0;
const cookieOptions = {
  httpOnly: true,
  sameSite: crossSite ? ('none' as const) : ('lax' as const),
  secure: crossSite || config.cookieSecure,
  path: '/',
};

/** `version` is the user's token_version. A password change raises it, which ends every older session. */
export function setAuthCookie(res: Response, userId: string, version: number) {
  const token = jwt.sign({ sub: userId, v: version }, config.jwtSecret, {
    expiresIn: `${config.jwtExpiresInDays}d`,
  });
  res.cookie(AUTH_COOKIE, token, {
    ...cookieOptions,
    maxAge: config.jwtExpiresInDays * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
}

/** Loads the signed-in user from the database, so role changes apply at once. */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  const token =
    req.cookies?.[AUTH_COOKIE] || (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (!token) return next(unauthorized());

  let userId: string;
  let version: number;
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    userId = String(payload.sub);
    version = Number(payload.v ?? 0); // sessions made before this existed count as version 0
  } catch {
    return next(unauthorized('Your session has expired. Please sign in again.'));
  }

  const db = await getDb();
  const { rows } = await db.query(`SELECT ${USER_COLUMNS}, expires_at, must_change_password, token_version FROM users WHERE id = $1 AND is_active = 1`, [userId]);
  if (!rows[0]) return next(unauthorized());
  if (rows[0].token_version !== version) return next(unauthorized('Your session has expired. Please sign in again.'));
  const plan = planState(rows[0]);
  if (plan.status === 'locked') return next(unauthorized(LOCKED_MESSAGE));
  // View-only: reading is fine, changing anything is not (except the person's own password, profile and notifications)
  if (plan.status === 'read_only' && !SAFE_METHODS.has(req.method) && !STILL_ALLOWED.test(req.originalUrl.split('?')[0])) {
    return next(forbidden(READ_ONLY_MESSAGE));
  }
  req.user = { ...toUser(rows[0]), mustChangePassword: rows[0].must_change_password === true, plan: { status: plan.status, expiresAt: plan.expiresAt, locksAt: plan.locksAt } };
  next();
};

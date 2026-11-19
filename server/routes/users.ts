import { roleKm } from '../services/roleLabels';
import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db';
import { ROLES } from '../../shared/types';
import { AVATAR_KEYS } from '../../shared/avatars';
import { requireSuperAdmin } from '../services/access';
import { logActivity } from '../services/activity';
import { badRequest, conflict, notFound } from '../middleware/errors';

export const usersRouter = Router();

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  nameKm: z.string().trim().max(120).optional(),
  specialty: z.string().trim().max(200).optional(),
  // A short name to sign in with, instead of the email. Empty removes it.
  username: z
    .union([
      z.literal(''),
      z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,40}$/, 'Username: 3-40 letters, numbers, dot, dash or underscore.'),
    ])
    .optional(),
});

usersRouter.patch('/users/me', async (req, res) => {
  const input = profileSchema.parse(req.body);
  const db = await getDb();
  if (input.username) {
    const { rows } = await db.query('SELECT 1 FROM users WHERE lower(username) = $1 AND is_active = 1 AND id <> $2', [input.username, req.user!.id]);
    if (rows[0]) throw conflict('That username is already taken.');
  }
  await db.query('UPDATE users SET name = $2, name_km = $3 WHERE id = $1', [req.user!.id, input.name, input.nameKm || null]);
  if (input.username !== undefined) {
    await db.query('UPDATE users SET username = $2 WHERE id = $1', [req.user!.id, input.username || null]);
  }
  // Account specialty, only when sent
  if (input.specialty !== undefined) {
    await db.query('UPDATE users SET specialty = $2 WHERE id = $1', [req.user!.id, input.specialty || null]);
  }
  res.status(204).end();
});

usersRouter.patch('/users/me/avatar', async (req, res) => {
  const { avatar } = z.object({ avatar: z.enum(AVATAR_KEYS) }).parse(req.body);
  const db = await getDb();
  await db.query('UPDATE users SET avatar = $2 WHERE id = $1', [req.user!.id, avatar]);
  res.status(204).end();
});

const roleSchema = z.object({
  role: z.enum(ROLES),
  groupId: z.string().uuid().optional(),
});

usersRouter.patch('/users/:userId/role', async (req, res) => {
  const user = req.user!;
  requireSuperAdmin(user);
  const input = roleSchema.parse(req.body);
  const targetId = req.params.userId;
  if (targetId === user.id) throw badRequest('You cannot change your own role.');
  if (input.role === 'super_admin') throw badRequest('There is only one Super Admin.');

  const db = await getDb();
  await db.transaction(async tx => {
    const { rows } = await tx.query('UPDATE users SET role = $2 WHERE id = $1 AND is_active = 1 RETURNING name', [
      targetId,
      input.role,
    ]);
    if (!rows[0]) throw notFound('User not found.');

    if (input.groupId) {
      const { rows: g } = await tx.query('SELECT 1 FROM groups WHERE id = $1', [input.groupId]);
      if (g[0]) {
        await logActivity(tx, user, {
          groupId: input.groupId,
          type: 'member_role_changed',
          targetId,
          targetTitle: rows[0].name,
          description: `updated ${rows[0].name}'s role to ${input.role.replace('_', ' ')}`,
          descriptionKm: `បានប្តូរសិទ្ធិ ${rows[0].name} ទៅជា ${roleKm(input.role)}`,
          metadata: { role: input.role },
        });
      }
    }
  });

  res.status(204).end();
});

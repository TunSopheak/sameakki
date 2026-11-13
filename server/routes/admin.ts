import { Router } from 'express';
import { z } from 'zod';
import type { AdminOverview } from '../../shared/types';
import { getDb } from '../db';
import { badRequest, notFound } from '../middleware/errors';
import { requireSuperAdmin } from '../services/access';

export const adminRouter = Router();

/** Everyone who has an account, and every group, for the Super Admin dashboard. */
adminRouter.get('/admin/overview', async (req, res) => {
  requireSuperAdmin(req.user!);
  const db = await getDb();

  const [users, groups] = await Promise.all([
    db.query(
      `SELECT u.id, u.name, u.name_km, u.email, u.username, u.role, u.avatar, u.created_at, u.last_seen_at, u.is_active,
              u.password_hash IS NOT NULL AS registered,
              (SELECT count(*)::int FROM group_members m WHERE m.user_id = u.id) AS group_count
         FROM users u ORDER BY u.created_at`
    ),
    db.query(
      `SELECT g.id, g.name, g.name_km, g.code, g.status, g.category, g.created_at, g.is_active, leader.name AS leader_name,
              (SELECT count(*)::int FROM group_members m WHERE m.group_id = g.id) AS member_count,
              (SELECT count(*)::int FROM tasks t WHERE t.group_id = g.id AND t.is_active = 1) AS task_count
         FROM groups g LEFT JOIN users leader ON leader.id = g.leader_id
        ORDER BY g.created_at DESC`
    ),
  ]);

  const overview: AdminOverview = {
    users: users.rows.map(r => ({
      id: r.id,
      name: r.name,
      nameKm: r.name_km ?? undefined,
      email: r.email,
      username: r.username ?? undefined,
      role: r.role,
      avatar: r.avatar ?? undefined,
      createdAt: new Date(r.created_at).toISOString(),
      lastSeenAt: r.last_seen_at ? new Date(r.last_seen_at).toISOString() : undefined,
      registered: r.registered,
      isActive: r.is_active === 1,
      groupCount: r.group_count,
    })),
    groups: groups.rows.map(r => ({
      id: r.id,
      name: r.name,
      nameKm: r.name_km ?? undefined,
      code: r.code,
      status: r.status,
      category: r.category,
      createdAt: new Date(r.created_at).toISOString(),
      leaderName: r.leader_name ?? undefined,
      memberCount: r.member_count,
      taskCount: r.task_count,
      isActive: r.is_active === 1,
    })),
  };
  res.json(overview);
});

const activeSchema = z.object({ active: z.boolean() });

/** Delete (active = false) or restore a user. Rows are kept; only is_active changes. */
adminRouter.post('/admin/users/:userId/active', async (req, res) => {
  const me = req.user!;
  requireSuperAdmin(me);
  const { active } = activeSchema.parse(req.body);
  const db = await getDb();

  await db.transaction(async tx => {
    const { rows } = await tx.query('SELECT role FROM users WHERE id = $1', [req.params.userId]);
    if (!rows[0]) throw notFound('User not found.');
    if (rows[0].role === 'super_admin') throw badRequest('A Super Admin cannot be deleted.');

    await tx.query('UPDATE users SET is_active = $2 WHERE id = $1', [req.params.userId, active ? 1 : 0]);
    // A deleted person leaves every group. Their past tasks and posts stay.
    if (!active) await tx.query('DELETE FROM group_members WHERE user_id = $1', [req.params.userId]);
  });
  res.status(204).end();
});

/** Delete (active = false) or restore a group. */
adminRouter.post('/admin/groups/:groupId/active', async (req, res) => {
  requireSuperAdmin(req.user!);
  const { active } = activeSchema.parse(req.body);
  const db = await getDb();
  const { rows } = await db.query('UPDATE groups SET is_active = $2 WHERE id = $1 RETURNING id', [req.params.groupId, active ? 1 : 0]);
  if (!rows[0]) throw notFound('Group not found.');
  res.status(204).end();
});

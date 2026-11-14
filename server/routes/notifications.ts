import { Router } from 'express';
import type { AppNotification, NotificationsResponse, NotificationType } from '../../shared/types';
import { getDb } from '../db';
import { notFound } from '../middleware/errors';
import { syncReminders } from '../services/notifications';

export const notificationsRouter = Router();

const LIMIT = 40;

notificationsRouter.get('/notifications', async (req, res) => {
  const userId = req.user!.id;
  const db = await getDb();
  await syncReminders(db, userId);

  const [list, count] = await Promise.all([
    db.query(
      `SELECT id, type, group_id, target_id, actor_name, params, created_at, read_at
         FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT ${LIMIT}`,
      [userId]
    ),
    db.query('SELECT count(*)::int AS n FROM notifications WHERE user_id = $1 AND read_at IS NULL', [userId]),
  ]);

  const items: AppNotification[] = list.rows.map(r => ({
    id: r.id,
    type: r.type as NotificationType,
    groupId: r.group_id ?? undefined,
    targetId: r.target_id ?? undefined,
    actorName: r.actor_name ?? undefined,
    params: typeof r.params === 'string' ? JSON.parse(r.params) : r.params ?? {},
    createdAt: new Date(r.created_at).toISOString(),
    read: r.read_at != null,
  }));
  const body: NotificationsResponse = { items, unread: count.rows[0].n };
  res.json(body);
});

notificationsRouter.post('/notifications/read-all', async (req, res) => {
  const db = await getDb();
  await db.query('UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL', [req.user!.id]);
  res.status(204).end();
});

notificationsRouter.post('/notifications/:id/read', async (req, res) => {
  const db = await getDb();
  const { rows } = await db.query(
    'UPDATE notifications SET read_at = COALESCE(read_at, now()) WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user!.id]
  );
  if (!rows[0]) throw notFound('Notification not found.');
  res.status(204).end();
});

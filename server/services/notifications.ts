import type { Queryable } from '../db';
import type { NotificationType } from '../../shared/types';

/** Day boundaries for reminders follow this time zone, not the server's. */
const TIME_ZONE = process.env.APP_TIME_ZONE || 'Asia/Phnom_Penh';
const KEEP_DAYS = 60;

interface NewNotification {
  userId: string;
  type: NotificationType;
  groupId?: string;
  targetId?: string;
  actorName?: string;
  params?: Record<string, string | undefined>;
  /** The same key for the same person is only stored once. */
  dedupeKey?: string;
}

/** Add a notification. Never throws for a duplicate. */
export async function notify(db: Queryable, n: NewNotification) {
  // Leave out empty values so the client never prints "undefined"
  const params = Object.fromEntries(Object.entries(n.params ?? {}).filter(([, v]) => v !== undefined && v !== ''));
  await db.query(
    `INSERT INTO notifications (user_id, type, group_id, target_id, actor_name, params, dedupe_key)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
     ON CONFLICT DO NOTHING`,
    [n.userId, n.type, n.groupId ?? null, n.targetId ?? null, n.actorName ?? null, JSON.stringify(params), n.dedupeKey ?? null]
  );
}

/**
 * A new comment. If the person has not read an earlier comment on the same thing, that entry is
 * refreshed instead of adding another one, so a busy thread does not flood the bell.
 */
export async function notifyComment(db: Queryable, n: Omit<NewNotification, 'type'> & { targetId: string }) {
  const params = Object.fromEntries(Object.entries(n.params ?? {}).filter(([, v]) => v !== undefined && v !== ''));
  const { rows } = await db.query(
    `UPDATE notifications SET actor_name = $3, params = $4::jsonb, created_at = now()
      WHERE user_id = $1 AND type = 'comment_added' AND target_id = $2 AND read_at IS NULL
      RETURNING id`,
    [n.userId, n.targetId, n.actorName ?? null, JSON.stringify(params)]
  );
  if (!rows[0]) await notify(db, { ...n, type: 'comment_added' });
}

/** The group's leader and its team leads, except the person who did the action. */
export async function groupLeadIds(db: Queryable, groupId: string, exceptUserId: string): Promise<string[]> {
  const { rows } = await db.query(
    `SELECT DISTINCT u.id
       FROM group_members m
       JOIN users u ON u.id = m.user_id AND u.is_active = 1
       JOIN groups g ON g.id = m.group_id
      WHERE m.group_id = $1 AND u.id <> $2 AND (u.id = g.leader_id OR u.role = 'team_lead')`,
    [groupId, exceptUserId]
  );
  return rows.map(r => r.id as string);
}

/**
 * Reminders that depend on the date are made when someone opens their notifications, so no
 * scheduler is needed. Each one has a dedupe key, so running this again adds nothing new.
 */
export async function syncReminders(db: Queryable, userId: string) {
  // Open tasks due today or tomorrow, or late by up to a week. Older ones would flood the bell the first time.
  await db.query(
    `INSERT INTO notifications (user_id, type, group_id, target_id, params, dedupe_key)
     SELECT t.assigned_to,
            CASE WHEN t.due_date < d.today THEN 'task_overdue' ELSE 'task_due_soon' END,
            t.group_id, t.id::text,
            jsonb_build_object('title', t.title, 'dueDate', t.due_date::text),
            CASE WHEN t.due_date < d.today THEN 'overdue:' ELSE 'soon:' END || t.id::text || ':' || t.due_date::text
       FROM tasks t
       JOIN groups g ON g.id = t.group_id AND g.is_active = 1
       JOIN group_members m ON m.group_id = t.group_id AND m.user_id = t.assigned_to
      CROSS JOIN (SELECT (now() AT TIME ZONE $2)::date AS today) d
      WHERE t.assigned_to = $1 AND t.is_active = 1 AND t.status IN ('todo', 'in_progress')
        AND t.due_date <= d.today + 1
        AND t.due_date >= d.today - 7
     ON CONFLICT DO NOTHING`,
    [userId, TIME_ZONE]
  );

  // A leader's plan ends within 7 days
  await db.query(
    `INSERT INTO notifications (user_id, type, params, dedupe_key)
     SELECT u.id, 'plan_expiring',
            jsonb_build_object('expiresAt', (u.expires_at AT TIME ZONE $2)::date::text),
            'plan:' || (u.expires_at AT TIME ZONE $2)::date::text
       FROM users u
      WHERE u.id = $1 AND u.role = 'team_lead' AND u.expires_at IS NOT NULL
        AND u.expires_at > now() AND u.expires_at <= now() + interval '7 days'
     ON CONFLICT DO NOTHING`,
    [userId, TIME_ZONE]
  );

  await db.query(`DELETE FROM notifications WHERE user_id = $1 AND created_at < now() - ($2 || ' days')::interval`, [
    userId,
    String(KEEP_DAYS),
  ]);
}

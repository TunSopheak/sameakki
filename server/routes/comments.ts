import { Router } from 'express';
import { z } from 'zod';
import type { Comment, CommentKind, User } from '../../shared/types';
import { getDb, type Queryable } from '../db';
import { notFound } from '../middleware/errors';
import { assert, assertWritable, getGroupAccess } from '../services/access';
import { groupLeadIds, notifyComment } from '../services/notifications';

export const commentsRouter = Router();

const bodySchema = z.object({ body: z.string().trim().min(1, 'Write something first.').max(2000) });
const MAX_PER_THREAD = 200;

interface Target {
  groupId: string;
  title: string;
  ownerIds: string[];
}

async function loadTarget(db: Queryable, user: User, kind: CommentKind, id: string) {
  const { rows } =
    kind === 'task'
      ? await db.query('SELECT group_id, title, assigned_to, assigned_by FROM tasks WHERE id = $1 AND is_active = 1', [id])
      : await db.query('SELECT group_id, title, user_id FROM daily_logs WHERE id = $1 AND is_active = 1', [id]);
  const row = rows[0];
  if (!row) throw notFound(kind === 'task' ? 'Task not found.' : 'Daily update not found.');

  const access = await getGroupAccess(db, user, row.group_id);
  const target: Target = {
    groupId: row.group_id,
    title: row.title,
    ownerIds: (kind === 'task' ? [row.assigned_to, row.assigned_by] : [row.user_id]).filter(Boolean),
  };
  return { target, access };
}

const toComment = (r: any): Comment => ({
  id: r.id,
  userId: r.user_id,
  userName: r.name,
  userNameKm: r.name_km ?? undefined,
  userRole: r.role,
  avatar: r.avatar ?? undefined,
  body: r.body,
  createdAt: new Date(r.created_at).toISOString(),
  editedAt: r.edited_at ? new Date(r.edited_at).toISOString() : undefined,
});

async function listComments(db: Queryable, kind: CommentKind, id: string): Promise<Comment[]> {
  const { rows } = await db.query(
    `SELECT c.id, c.user_id, c.body, c.created_at, c.edited_at, u.name, u.name_km, u.role, u.avatar
       FROM comments c JOIN users u ON u.id = c.user_id
      WHERE c.target_type = $1 AND c.target_id = $2 AND c.is_active = 1
      ORDER BY c.created_at DESC LIMIT ${MAX_PER_THREAD}`,
    [kind, id]
  );
  // Newest 200, shown oldest first
  return rows.reverse().map(toComment);
}

function register(kind: CommentKind, path: string) {
  commentsRouter.get(`${path}/:id/comments`, async (req, res) => {
    const db = await getDb();
    await loadTarget(db, req.user!, kind, req.params.id);
    res.json(await listComments(db, kind, req.params.id));
  });

  commentsRouter.post(`${path}/:id/comments`, async (req, res) => {
    const user = req.user!;
    const db = await getDb();
    const { target, access } = await loadTarget(db, user, kind, req.params.id);
    assertWritable(access);
    assert(access.canContribute, 'Viewers cannot comment.');
    const { body } = bodySchema.parse(req.body);

    const id = await db.transaction(async tx => {
      const { rows } = await tx.query(
        `INSERT INTO comments (group_id, target_type, target_id, user_id, body)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [target.groupId, kind, req.params.id, user.id, body]
      );

      const { rows: earlier } = await tx.query(
        `SELECT DISTINCT user_id FROM comments WHERE target_type = $1 AND target_id = $2 AND is_active = 1`,
        [kind, req.params.id]
      );
      const wanted = new Set<string>([
        ...target.ownerIds,
        ...(await groupLeadIds(tx, target.groupId, user.id)),
        ...earlier.map(r => r.user_id as string),
      ]);
      wanted.delete(user.id);
      const { rows: members } = await tx.query(
        `SELECT user_id FROM group_members WHERE group_id = $1 AND user_id = ANY($2::uuid[])`,
        [target.groupId, [...wanted]]
      );
      for (const m of members) {
        await notifyComment(tx, {
          userId: m.user_id,
          groupId: target.groupId,
          targetId: req.params.id,
          actorName: user.name,
          params: { title: target.title, snippet: body.length > 90 ? `${body.slice(0, 90)}…` : body, kind },
        });
      }
      return rows[0].id as string;
    });

    const { rows } = await db.query(
      `SELECT c.id, c.user_id, c.body, c.created_at, c.edited_at, u.name, u.name_km, u.role, u.avatar
         FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
      [id]
    );
    res.status(201).json(toComment(rows[0]));
  });
}

register('task', '/tasks');
register('daily_log', '/daily-logs');

commentsRouter.delete('/comments/:commentId', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { rows } = await db.query('SELECT group_id, user_id FROM comments WHERE id = $1 AND is_active = 1', [req.params.commentId]);
  const comment = rows[0];
  if (!comment) throw notFound('Comment not found.');
  const access = await getGroupAccess(db, user, comment.group_id);
  assert(comment.user_id === user.id || access.canLead, 'You can only delete your own comments.');
  await db.query('UPDATE comments SET is_active = 0 WHERE id = $1', [req.params.commentId]);
  res.status(204).end();
});

commentsRouter.patch('/comments/:commentId', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { rows } = await db.query('SELECT group_id, user_id FROM comments WHERE id = $1 AND is_active = 1', [req.params.commentId]);
  const comment = rows[0];
  if (!comment) throw notFound('Comment not found.');
  const access = await getGroupAccess(db, user, comment.group_id);
  assertWritable(access);
  assert(comment.user_id === user.id && access.canContribute, 'You can only edit your own comments.');
  const { body } = bodySchema.parse(req.body);

  await db.query('UPDATE comments SET body = $2, edited_at = now() WHERE id = $1', [req.params.commentId, body]);
  const { rows: updated } = await db.query(
    `SELECT c.id, c.user_id, c.body, c.created_at, c.edited_at, u.name, u.name_km, u.role, u.avatar
       FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
    [req.params.commentId]
  );
  res.json(toComment(updated[0]));
});

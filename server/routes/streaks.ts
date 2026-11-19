import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db';
import { computeStreak, rankMembers, type RankedMember } from '../../shared/streak';
import { assert, assertWritable, getGroupAccess } from '../services/access';
import { notify } from '../services/notifications';
import { pokeMessage, sendTelegram, telegramConfigured } from '../services/telegram';
import { TIME_ZONE } from '../services/time';
import { badRequest, conflict, notFound } from '../middleware/errors';

export const streaksRouter = Router();

/** Everyone who can post a daily ToDo in a group, with the days each one posted (Cambodia time) */
async function loadGroup(db: Awaited<ReturnType<typeof getDb>>, groupId: string) {
  const [today, members, logs] = await Promise.all([
    db.query(`SELECT (now() AT TIME ZONE $1)::date::text AS today`, [TIME_ZONE]),
    db.query(
      `SELECT u.id, u.name, (u.telegram_chat_id IS NOT NULL) AS telegram FROM group_members m JOIN users u ON u.id = m.user_id
        WHERE m.group_id = $1 AND u.is_active = 1 AND u.role <> 'viewer'`,
      [groupId]
    ),
    db.query(`SELECT user_id, (created_at AT TIME ZONE $2)::date::text AS day FROM daily_logs WHERE group_id = $1 AND is_active = 1`, [groupId, TIME_ZONE]),
  ]);

  const days = new Map<string, string[]>();
  for (const row of logs.rows) days.set(row.user_id, [...(days.get(row.user_id) ?? []), row.day]);

  const todayText: string = today.rows[0].today;
  const ranked = rankMembers<RankedMember>(
    members.rows.map(m => ({ userId: m.id as string, name: m.name as string, telegram: !!m.telegram, ...computeStreak(days.get(m.id) ?? [], todayText) }))
  );
  return { today: todayText, members: ranked };
}

// Streak ranking of a group, and who I have already poked today
streaksRouter.get('/groups/:groupId/streaks', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  const { today, members } = await loadGroup(db, access.groupId);
  const { rows } = await db.query(`SELECT to_user_id FROM pokes WHERE group_id = $1 AND from_user_id = $2 AND poke_date = $3::date`, [access.groupId, user.id, today]);
  res.json({ today, members, pokedToday: rows.map(r => r.to_user_id as string) });
});

const pokeSchema = z.object({ userId: z.string().uuid() });

// A nudge for a member who has not posted today. One poke to the same person per day.
streaksRouter.post('/groups/:groupId/pokes', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  assertWritable(access);
  assert(access.canContribute, 'Viewers cannot poke.');
  const { userId } = pokeSchema.parse(req.body);
  if (userId === user.id) throw badRequest('You cannot poke yourself.');

  const { today, members } = await loadGroup(db, access.groupId);
  const target = members.find(m => m.userId === userId);
  if (!target) throw notFound('Member not found.');
  if (target.postedToday) throw badRequest('This member has already posted today.');

  const { rows: group } = await db.query('SELECT name FROM groups WHERE id = $1', [access.groupId]);
  const groupName: string = group[0]?.name ?? '';

  const inserted = await db.transaction(async tx => {
    const { rows } = await tx.query(
      `INSERT INTO pokes (group_id, from_user_id, to_user_id, poke_date) VALUES ($1, $2, $3, $4::date)
       ON CONFLICT DO NOTHING RETURNING id`,
      [access.groupId, user.id, userId, today]
    );
    if (!rows[0]) return false;
    await notify(tx, {
      userId,
      type: 'poke',
      groupId: access.groupId,
      actorName: user.name,
      params: { streak: String(target.current), group: groupName },
    });
    return true;
  });
  if (!inserted) throw conflict('You already poked this member today.');

  // Also to Telegram, if they connected it. A failure here never fails the poke.
  if (telegramConfigured()) {
    const { rows } = await db.query('SELECT telegram_chat_id FROM users WHERE id = $1', [userId]);
    const chatId: string | null = rows[0]?.telegram_chat_id ?? null;
    if (chatId) await sendTelegram(chatId, pokeMessage({ from: user.name, group: groupName, streak: target.current, appUrl: process.env.APP_URL }));
  }

  res.status(201).json({ ok: true });
});

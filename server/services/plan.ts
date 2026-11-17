import type { PlanInfo } from '../../shared/types';
import { config } from '../config';
import type { Queryable } from '../db';
import { badRequest, unauthorized } from '../middleware/errors';
import { TIME_ZONE } from './time';

const DAY = 24 * 60 * 60 * 1000;

export const LOCKED_MESSAGE = `Your account has expired and the ${config.expiredGraceDays}-day view-only period has ended. Please contact the admin on Telegram to renew it.`;
export const READ_ONLY_MESSAGE = 'Your account has expired, so it is view-only. Please contact the admin on Telegram to renew it.';

/** active, read_only (grace days after the end date) or locked. */
export function planState(row: { role: string; expires_at?: Date | string | null }): Omit<PlanInfo, 'status'> & { status: 'active' | 'read_only' | 'locked' } {
  if (row.role === 'super_admin' || !row.expires_at) return { status: 'active' };
  const ends = new Date(row.expires_at).getTime();
  const locksAt = new Date(ends + config.expiredGraceDays * DAY);
  const info = { expiresAt: new Date(ends).toISOString(), locksAt: locksAt.toISOString() };
  if (Date.now() <= ends) return { status: 'active', ...info };
  return { status: Date.now() <= locksAt.getTime() ? 'read_only' : 'locked', ...info };
}

export function assertNotLocked(row: { role: string; expires_at?: Date | string | null }) {
  if (planState(row).status === 'locked') throw unauthorized(LOCKED_MESSAGE);
}

/** Throws when a new member would pass the leader's limit. Locks the group row so two joins cannot both take the last place. */
export async function assertCapacity(db: Queryable, groupId: string) {
  const { rows } = await db.query(
    `SELECT u.max_members,
            (SELECT count(*)::int FROM group_members m WHERE m.group_id = g.id) AS member_count
       FROM groups g LEFT JOIN users u ON u.id = g.leader_id
      WHERE g.id = $1
      FOR UPDATE OF g`,
    [groupId]
  );
  const row = rows[0];
  if (row?.max_members != null && row.member_count >= row.max_members) {
    throw badRequest(
      `This group has reached its limit of ${row.max_members} members. Contact the admin on Telegram to upgrade.`
    );
  }
}

/** End of a day in the app time zone. */
export const endOfDay = (date: string | null) => {
  if (!date) return null;
  const guess = new Date(`${date}T23:59:59.999Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(guess);
  const part = (type: string) => Number(parts.find(p => p.type === type)!.value);
  // Zone offset from UTC
  const offset = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second')) - Math.floor(guess.getTime() / 1000) * 1000;
  return new Date(guess.getTime() - offset);
};

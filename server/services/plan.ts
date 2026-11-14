import type { Queryable } from '../db';
import { badRequest, unauthorized } from '../middleware/errors';

export const EXPIRED_MESSAGE = 'Your account has expired. Please contact the admin on Telegram to renew it.';

/** Throws when a non-admin account is past its expiry date. */
export function assertNotExpired(row: { role: string; expires_at?: Date | string | null }) {
  if (row.role === 'super_admin' || !row.expires_at) return;
  if (new Date(row.expires_at).getTime() < Date.now()) throw unauthorized(EXPIRED_MESSAGE);
}

/** Throws when adding one more person would pass the group leader's member limit. */
export async function assertCapacity(db: Queryable, groupId: string) {
  const { rows } = await db.query(
    `SELECT u.max_members,
            (SELECT count(*)::int FROM group_members m WHERE m.group_id = g.id) AS member_count
       FROM groups g LEFT JOIN users u ON u.id = g.leader_id
      WHERE g.id = $1`,
    [groupId]
  );
  const row = rows[0];
  if (row?.max_members != null && row.member_count >= row.max_members) {
    throw badRequest(
      `This group has reached its limit of ${row.max_members} members. Contact the admin on Telegram to upgrade.`
    );
  }
}

/** "YYYY-MM-DD" to the end of that day (UTC), or null to remove the limit. */
export const endOfDay = (date: string | null) => (date ? new Date(`${date}T23:59:59.999Z`) : null);

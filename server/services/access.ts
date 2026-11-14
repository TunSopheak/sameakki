import type { Queryable } from '../db';
import type { User } from '../../shared/types';
import { forbidden, notFound } from '../middleware/errors';

// Roles: super_admin does everything. team_lead (or the group leader) manages tasks and
// standups in their groups. member works on own tasks. viewer is read-only.

export const isSuperAdmin = (user: User) => user.role === 'super_admin';

export interface GroupAccess {
  groupId: string;
  leaderId: string | null;
  isMember: boolean;
  canLead: boolean;
  canContribute: boolean;
}

export async function getGroupAccess(db: Queryable, user: User, groupId: string): Promise<GroupAccess> {
  const { rows } = await db.query(
    `SELECT g.id, g.leader_id,
            (g.support_access_until IS NOT NULL AND g.support_access_until > now()) AS support_open,
            EXISTS (SELECT 1 FROM users l WHERE l.id = g.leader_id AND l.role <> 'super_admin' AND l.expires_at IS NOT NULL AND l.expires_at < now()) AS leader_plan_ended,
            EXISTS (SELECT 1 FROM group_members m WHERE m.group_id = g.id AND m.user_id = $2) AS is_member
       FROM groups g WHERE g.id = $1 AND g.is_active = 1`,
    [groupId, user.id]
  );
  const row = rows[0];
  if (!row) throw notFound('Group not found.');

  const isMember: boolean = row.is_member;
  // The Super Admin sees a group's content only as a member, or while its leader allows support access
  if (!isMember && !(isSuperAdmin(user) && row.support_open)) throw notFound('Group not found.');

  // Once the leader's plan has ended the whole group is view-only, whatever the members' own accounts say
  const frozen = row.leader_plan_ended === true && !isSuperAdmin(user);
  const canLead =
    !frozen && (isSuperAdmin(user) || (isMember && (user.role === 'team_lead' || row.leader_id === user.id)));

  return {
    groupId,
    leaderId: row.leader_id,
    isMember,
    canLead,
    canContribute: !frozen && (isSuperAdmin(user) || (isMember && user.role !== 'viewer')),
  };
}

export function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) throw forbidden(message);
}

export function requireSuperAdmin(user: User) {
  assert(isSuperAdmin(user), 'Only a Super Admin can do that.');
}

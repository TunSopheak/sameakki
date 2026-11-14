import { randomInt } from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { getDb } from '../db';
import { GROUP_CATEGORIES, GROUP_STATUSES } from '../../shared/types';
import { assert, getGroupAccess, isSuperAdmin, requireSuperAdmin } from '../services/access';
import { logActivity } from '../services/activity';
import { badRequest, conflict, notFound } from '../middleware/errors';
import { USER_COLUMNS } from '../services/mappers';
import { generatePassword, hashPassword } from '../services/password';
import { assertCapacity } from '../services/plan';
import { isoDate } from '../services/validation';

export const groupsRouter = Router();

// No 0/O or 1/I, so codes are easy to read
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateGroupCode = () =>
  'GRP-' + Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');

const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

const optionalText = (max: number) => z.string().trim().max(max).optional();

const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(160),
  nameKm: optionalText(160),
  code: z.string().trim().max(40).optional(),
  courseOrProject: z.string().trim().min(1).max(200),
  description: optionalText(2000),
  deadline: isoDate.optional(),
  category: z.enum(GROUP_CATEGORIES).default('assignment'),
});

groupsRouter.post('/groups', async (req, res) => {
  const user = req.user!;
  assert(isSuperAdmin(user) || user.role === 'team_lead', 'Only a Super Admin or a Team Leader can create a group.');
  const input = createGroupSchema.parse(req.body);
  const code = (input.code || generateGroupCode()).toUpperCase();

  const db = await getDb();
  const group = await db.transaction(async tx => {
    const { rows: dup } = await tx.query('SELECT 1 FROM groups WHERE upper(code) = $1', [code]);
    if (dup[0]) throw conflict(`Group code "${code}" is already in use.`);

    const { rows } = await tx.query(
      `INSERT INTO groups (name, name_km, code, course_or_project, description, deadline, category, leader_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, code`,
      [
        input.name,
        input.nameKm || null,
        code,
        input.courseOrProject,
        input.description || 'Collaborative team workspace.',
        input.deadline || null,
        input.category,
        user.id,
      ]
    );
    const g = rows[0];
    await tx.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [g.id, user.id]);
    await logActivity(tx, user, {
      groupId: g.id,
      type: 'group_created',
      targetId: g.id,
      targetTitle: g.name,
      description: `created new group "${g.name}" (${g.code})`,
      descriptionKm: `បានបង្កើតក្រុមថ្មី "${g.name}" (${g.code})`,
    });
    return g;
  });

  res.status(201).json({ id: group.id });
});

const joinGroupSchema = z.object({ code: z.string().trim().min(1).max(40) });

groupsRouter.post('/groups/join', joinLimiter, async (req, res) => {
  const user = req.user!;
  const input = joinGroupSchema.parse(req.body);
  const db = await getDb();

  const group = await db.transaction(async tx => {
    const { rows } = await tx.query('SELECT id, name, status FROM groups WHERE upper(code) = upper($1) AND is_active = 1', [input.code]);
    const g = rows[0];
    if (!g) throw notFound('No group matches that code.');
    if (g.status === 'archived') throw badRequest('This group is archived and no longer accepts members.');

    const { rows: already } = await tx.query('SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2', [g.id, user.id]);
    if (!already[0]) await assertCapacity(tx, g.id);

    const { rows: inserted } = await tx.query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING user_id`,
      [g.id, user.id]
    );
    if (!inserted[0]) throw conflict('You are already a member of this group.');

    await logActivity(tx, user, {
      groupId: g.id,
      type: 'member_added',
      targetId: user.id,
      targetTitle: user.name,
      description: `joined the group with its group code`,
      descriptionKm: `បានចូលរួមក្រុមដោយប្រើលេខកូដក្រុម`,
    });
    return g;
  });

  res.status(201).json({ id: group.id });
});

const updateGroupSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  nameKm: optionalText(160),
  courseOrProject: z.string().trim().min(1).max(200).optional(),
  description: optionalText(2000),
  deadline: isoDate.nullable().optional(),
  status: z.enum(GROUP_STATUSES).optional(),
  category: z.enum(GROUP_CATEGORIES).optional(),
});

groupsRouter.patch('/groups/:groupId', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  assert(isSuperAdmin(user) || access.leaderId === user.id, 'Only a Super Admin or the group leader can edit the group.');
  const input = updateGroupSchema.parse(req.body);

  await db.transaction(async tx => {
    const { rows } = await tx.query('SELECT * FROM groups WHERE id = $1', [access.groupId]);
    const before = rows[0];

    const fields: Record<string, unknown> = {
      name: input.name,
      name_km: input.nameKm,
      course_or_project: input.courseOrProject,
      description: input.description,
      deadline: input.deadline,
      status: input.status,
      category: input.category,
    };
    const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
    if (entries.length === 0) throw badRequest('Nothing to update.');

    const sets = entries.map(([col], i) => `${col} = $${i + 2}`).join(', ');
    await tx.query(`UPDATE groups SET ${sets} WHERE id = $1`, [access.groupId, ...entries.map(([, v]) => v)]);

    if (input.deadline !== undefined && input.deadline !== before.deadline) {
      const oldValue = before.deadline ?? undefined;
      const newValue = input.deadline ?? undefined;
      await logActivity(tx, user, {
        groupId: access.groupId,
        type: 'group_deadline_changed',
        targetId: access.groupId,
        targetTitle: before.name,
        description: `changed group deadline from ${oldValue || 'none'} to ${newValue || 'none'}`,
        descriptionKm: `បានកែប្រែកាលបរិច្ឆេទកំណត់របស់ក្រុមពី ${oldValue || 'គ្មាន'} ទៅ ${newValue || 'គ្មាន'}`,
        metadata: { oldValue, newValue },
      });
    }
  });

  res.status(204).end();
});

groupsRouter.delete('/groups/:groupId', async (req, res) => {
  const user = req.user!;
  requireSuperAdmin(user);
  const db = await getDb();
  const { rows } = await db.query('UPDATE groups SET is_active = 0 WHERE id = $1 AND is_active = 1 RETURNING id', [req.params.groupId]);
  if (!rows[0]) throw notFound('Group not found.');
  res.status(204).end();
});

const addMemberSchema = z.object({
  name: z.string().trim().min(1).max(120),
  nameKm: optionalText(120),
  email: z.string().trim().toLowerCase().email().max(200),
  role: z.enum(['team_lead', 'member', 'viewer']).default('member'),
  specialty: optionalText(200),
  department: optionalText(120),
  password: z.string().min(1).max(200).optional(),
});

groupsRouter.get('/groups/:groupId/member-candidates', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  const admin = isSuperAdmin(user);
  assert(admin || access.leaderId === user.id, 'Only a Super Admin or the group leader can add members.');

  const q = String(req.query.q ?? '').trim().toLowerCase().slice(0, 100);
  const like = `%${q.replace(/[\\%_]/g, m => '\\' + m)}%`;
  const { rows } = await db.query(
    `SELECT id, name, name_km, email, username, avatar, role
       FROM users u
      WHERE u.is_active = 1 AND u.role <> 'super_admin' AND u.id <> $1
        AND ($2 OR u.created_by = $1)
        AND NOT EXISTS (SELECT 1 FROM group_members m WHERE m.group_id = $3 AND m.user_id = u.id)
        AND ($4 = '' OR lower(u.name) LIKE $5 OR lower(u.email) LIKE $5 OR lower(coalesce(u.username, '')) LIKE $5)
      ORDER BY u.name
      LIMIT 8`,
    [user.id, admin, access.groupId, q, like]
  );
  res.json(
    rows.map(r => ({
      id: r.id,
      name: r.name,
      nameKm: r.name_km ?? undefined,
      email: r.email,
      avatar: r.avatar ?? undefined,
      role: r.role,
    }))
  );
});

groupsRouter.post('/groups/:groupId/members', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  const admin = isSuperAdmin(user);
  assert(admin || access.leaderId === user.id, 'Only a Super Admin or the group leader can add members.');
  const input = addMemberSchema.parse(req.body);
  if (!admin && input.role === 'team_lead') throw badRequest('Only a Super Admin can create a Team Leader.');
  const plainPassword = input.password ?? generatePassword();
  const passwordHash = await hashPassword(plainPassword);
  let issuedPassword: string | undefined;

  const member = await db.transaction(async tx => {
    const { rows: matches } = await tx.query(
      `SELECT ${USER_COLUMNS}, created_by FROM users WHERE lower(email) = $1 AND is_active = 1`,
      [input.email]
    );

    let target = matches[0];
    if (target && !admin) {
      if (target.created_by !== user.id) throw conflict('That email already has an account that you cannot add.');
    } else if (target) {
      if (target.id === user.id && input.role !== target.role) {
        throw badRequest('You cannot change your own role.');
      }
      const { rows } = await tx.query(
        `UPDATE users SET role = $2, specialty = COALESCE($3, specialty) WHERE id = $1 RETURNING ${USER_COLUMNS}`,
        [target.id, input.role, input.specialty || null]
      );
      target = rows[0];
    } else {
      if (!input.password) issuedPassword = plainPassword;
      // A new account follows the leader's plan expiry
      const { rows: plan } = access.leaderId
        ? await tx.query('SELECT expires_at FROM users WHERE id = $1', [access.leaderId])
        : { rows: [] as any[] };
      const { rows } = await tx.query(
        `INSERT INTO users (name, name_km, email, password_hash, role, specialty, department, expires_at, created_by, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING ${USER_COLUMNS}`,
        [
          input.name,
          input.nameKm || null,
          input.email,
          passwordHash,
          input.role,
          input.specialty || null,
          input.department || 'Member',
          plan[0]?.expires_at ?? null,
          access.leaderId ?? user.id,
        ]
      );
      target = rows[0];
    }

    const { rows: already } = await tx.query('SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2', [access.groupId, target.id]);
    if (!already[0]) await assertCapacity(tx, access.groupId);

    const { rows: inserted } = await tx.query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING user_id`,
      [access.groupId, target.id]
    );
    if (inserted[0]) {
      await logActivity(tx, user, {
        groupId: access.groupId,
        type: 'member_added',
        targetId: target.id,
        targetTitle: target.name,
        description: `added ${target.name} as ${input.role.replace('_', ' ')}`,
        descriptionKm: `បានបញ្ចូល ${target.name} ក្នុងក្រុម (តួនាទី៖ ${input.role})`,
        metadata: { role: input.role },
      });
    }
    return target;
  });

  res.status(201).json({ id: member.id, password: issuedPassword });
});

const supportSchema = z.object({ hours: z.number().int().min(0).max(168) });

groupsRouter.post('/groups/:groupId/support-access', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  assert(access.leaderId === user.id, 'Only the group leader can allow Admin support access.');
  const { hours } = supportSchema.parse(req.body);

  await db.transaction(async tx => {
    await tx.query(
      `UPDATE groups SET support_access_until = CASE WHEN $2::int > 0 THEN now() + make_interval(hours => $2::int) ELSE NULL END
        WHERE id = $1`,
      [access.groupId, hours]
    );
    await logActivity(tx, user, {
      groupId: access.groupId,
      type: 'support_access_changed',
      targetTitle: '',
      description: hours > 0 ? `allowed Admin support access for ${hours} hours` : 'turned off Admin support access',
      descriptionKm: hours > 0 ? `បានអនុញ្ញាតឱ្យ Admin ជួយក្រុមរយៈពេល ${hours} ម៉ោង` : 'បានបិទការអនុញ្ញាតឱ្យ Admin ជួយក្រុម',
      metadata: { newValue: String(hours) },
    });
  });
  res.status(204).end();
});

groupsRouter.delete('/groups/:groupId/members/:userId', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  const targetId = req.params.userId;
  const isSelf = targetId === user.id;
  assert(isSelf || isSuperAdmin(user) || access.leaderId === user.id, 'Only a Super Admin or the group leader can remove other members.');

  await db.transaction(async tx => {
    const { rows } = await tx.query(
      `DELETE FROM group_members m USING users u
        WHERE m.group_id = $1 AND m.user_id = $2 AND u.id = m.user_id
        RETURNING u.name`,
      [access.groupId, targetId]
    );
    if (!rows[0]) throw notFound('That user is not a member of this group.');
    await logActivity(tx, user, {
      groupId: access.groupId,
      type: 'member_removed',
      targetId,
      targetTitle: rows[0].name,
      description: isSelf ? 'left the group' : `removed ${rows[0].name} from the group`,
      descriptionKm: isSelf ? 'បានចាកចេញពីក្រុម' : `បានដក ${rows[0].name} ចេញពីក្រុម`,
    });
  });

  res.status(204).end();
});

groupsRouter.delete('/groups/:groupId/activity', async (req, res) => {
  const user = req.user!;
  requireSuperAdmin(user);
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  await db.query('DELETE FROM activity_events WHERE group_id = $1', [access.groupId]);
  res.status(204).end();
});

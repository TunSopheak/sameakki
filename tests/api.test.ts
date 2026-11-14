// End-to-end tests of the API rules: who may do what, plan limits, privacy, notifications and comments.
// They run the real Express app against a throw-away embedded database in a temp folder.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

// These must be set before the app reads its settings. An empty (but defined) DATABASE_URL also stops
// dotenv from filling it in from a real .env file.
process.env.DATABASE_URL = '';
process.env.PGLITE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'leadersync-test-'));
process.env.NODE_ENV = 'test';

type Json = any;
interface Reply {
  status: number;
  body: Json;
}

/** A tiny HTTP client that remembers cookies, like a browser tab. */
class Client {
  private cookies = new Map<string, string>();
  constructor(private base: string) {}

  async request(method: string, url: string, body?: unknown): Promise<Reply> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.cookies.size) headers.Cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
    const res = await fetch(this.base + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    for (const line of res.headers.getSetCookie()) {
      const [pair] = line.split(';');
      const eq = pair.indexOf('=');
      const name = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      if (value) this.cookies.set(name, value);
      else this.cookies.delete(name);
    }
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : undefined };
  }
  get = (url: string) => this.request('GET', url);
  post = (url: string, body: unknown = {}) => this.request('POST', url, body);
  put = (url: string, body: unknown) => this.request('PUT', url, body);
  patch = (url: string, body: unknown) => this.request('PATCH', url, body);
  del = (url: string) => this.request('DELETE', url);
}

let server: Server;
let base: string;
let query: (sql: string, params?: unknown[]) => Promise<any[]>;
let closeDb: () => Promise<void>;
const sessions: Record<string, Client> = {};

const newClient = () => new Client(base);
const loginAs = async (who: string, email: string, password: string) => {
  const c = newClient();
  const r = await c.post('/api/auth/login', { email, password });
  assert.equal(r.status, 200, `${who} should sign in: ${JSON.stringify(r.body)}`);
  sessions[who] = c;
  return c;
};

/** Today in Phnom Penh, shifted by a number of days. The server works out reminders in that time zone. */
const day = (offset: number) => new Date(Date.now() + 7 * 3_600_000 + offset * 86_400_000).toISOString().slice(0, 10);

before(async () => {
  const { getDb, closeDb: close } = await import('../server/db');
  const { runMigrations } = await import('../server/db/migrate');
  const { hashPassword } = await import('../server/services/password');
  const { createApp } = await import('../server/app');

  const db = await getDb();
  // A safety net: never run these tests, which create and change data, against a real server database.
  assert.equal(db.kind, 'pglite', 'The tests must use the temporary embedded database');
  await runMigrations(db);
  query = async (sql, params) => (await db.query(sql, params as any[])).rows;
  closeDb = close;

  await query(
    `INSERT INTO users (name, email, username, password_hash, role, department)
     VALUES ('Super Admin', 'root@test.local', 'root', $1, 'super_admin', 'Team Leader')`,
    [await hashPassword('rootpass')]
  );

  server = createApp().listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
  await closeDb();
  fs.rmSync(process.env.PGLITE_DIR!, { recursive: true, force: true });
});

// ---------------------------------------------------------------- shared state, filled in order
const ids: Record<string, string> = {};
const temp: Record<string, string> = {};

test('there is no public sign-up', async () => {
  const r = await newClient().post('/api/auth/register', { name: 'x', email: 'x@x.com', password: 'abcdef' });
  assert.ok(r.status === 401 || r.status === 404, `register must not work, got ${r.status}`);
  const users = await query("SELECT 1 FROM users WHERE email = 'x@x.com'");
  assert.equal(users.length, 0);
});

test('the Super Admin creates a leader with a generated password, who must change it', async () => {
  const admin = await loginAs('admin', 'root', 'rootpass');

  const made = await admin.post('/api/admin/users', { name: 'Lead', email: 'lead@test.local', username: 'lead', maxMembers: 3 });
  assert.equal(made.status, 201);
  assert.match(made.body.password, /^[A-Za-z0-9]{10}$/, 'a password is generated and returned once');
  ids.lead = made.body.id;
  temp.lead = made.body.password;

  const typed = await admin.post('/api/admin/users', { name: 'Other', email: 'other@test.local', username: 'other', password: '1' });
  assert.equal(typed.status, 201);
  assert.equal(typed.body.password, undefined, 'a typed password is not echoed back');
  ids.other = typed.body.id;

  assert.equal((await admin.post('/api/admin/users', { name: 'Dup', email: 'LEAD@test.local', password: '1' })).status, 409, 'email is unique, ignoring case');
  assert.equal((await admin.post('/api/admin/users', { name: 'Dup', email: 'd@test.local', username: 'lead', password: '1' })).status, 409, 'username is unique');

  const lead = await loginAs('lead', 'lead', temp.lead);
  assert.equal((await lead.get('/api/auth/me')).body.user.mustChangePassword, true);
  assert.equal((await lead.post('/api/auth/change-password', { currentPassword: temp.lead, newPassword: temp.lead })).status, 400, 'a new password must differ');
  assert.equal((await lead.post('/api/auth/change-password', { currentPassword: 'wrong', newPassword: 'abc' })).status, 400);
  assert.equal((await lead.post('/api/auth/change-password', { currentPassword: temp.lead, newPassword: '1' })).status, 204, 'any password is allowed');
  assert.equal((await lead.get('/api/auth/me')).body.user.mustChangePassword, false);
  assert.equal((await lead.get('/api/auth/me')).status, 200, 'the same browser stays signed in after changing its own password');
});

test('only the Super Admin can create accounts or change plans', async () => {
  const lead = sessions.lead;
  assert.equal((await lead.post('/api/admin/users', { name: 'X', email: 'x@test.local', password: '1' })).status, 403);
  assert.equal((await lead.post(`/api/admin/users/${ids.other}/plan`, { maxMembers: 99 })).status, 403);
  assert.equal((await lead.get('/api/admin/overview')).status, 403);
  assert.equal((await newClient().get('/api/admin/overview')).status, 401);
});

test('leaders can create groups and add members with generated passwords', async () => {
  const lead = sessions.lead;
  const g = await lead.post('/api/groups', { name: 'G1', courseOrProject: 'P' });
  assert.equal(g.status, 201);
  ids.g1 = g.body.id;

  const m1 = await lead.post(`/api/groups/${ids.g1}/members`, { name: 'Mem One', email: 'm1@test.local' });
  assert.equal(m1.status, 201);
  assert.match(m1.body.password, /^[A-Za-z0-9]{10}$/);
  ids.m1 = m1.body.id;
  temp.m1 = m1.body.password;

  const typed = await lead.post(`/api/groups/${ids.g1}/members`, { name: 'Mem Two', email: 'm2@test.local', password: '123' });
  assert.equal(typed.body.password, undefined);
  ids.m2 = typed.body.id;

  assert.equal((await lead.post(`/api/groups/${ids.g1}/members`, { name: 'X', email: 'm3@test.local', role: 'team_lead' })).status, 400, 'a leader cannot create another Team Leader');

  const row = (await query('SELECT must_change_password, created_by FROM users WHERE id = $1', [ids.m1]))[0];
  assert.equal(row.must_change_password, true);
  assert.equal(row.created_by, ids.lead);
});

test('the member limit stops adding and joining (leader counts as one)', async () => {
  const lead = sessions.lead;
  // max_members = 3: the leader and two members fill the group
  const full = await lead.post(`/api/groups/${ids.g1}/members`, { name: 'Late', email: 'late@test.local' });
  assert.equal(full.status, 400);
  assert.match(full.body.error, /limit of 3/);
  assert.equal((await query("SELECT 1 FROM users WHERE email = 'late@test.local'")).length, 0, 'nothing is left behind when the add is refused');

  const code = (await query('SELECT code FROM groups WHERE id = $1', [ids.g1]))[0].code;
  const other = await loginAs('other', 'other', '1');
  assert.equal((await other.post('/api/groups/join', { code })).status, 400, 'joining by code respects the limit too');

  // Raising the limit makes room again
  assert.equal((await sessions.admin.post(`/api/admin/users/${ids.lead}/plan`, { maxMembers: 5 })).status, 204);
  assert.equal((await other.post('/api/groups/join', { code })).status, 201);
  assert.equal((await other.post('/api/groups/join', { code })).status, 409, 'cannot join twice');
});

test('a leader can only reuse accounts they created, and search shows only those', async () => {
  const lead = sessions.lead;
  const g2 = await lead.post('/api/groups', { name: 'G2', courseOrProject: 'P' });
  ids.g2 = g2.body.id;

  const found = await lead.get(`/api/groups/${ids.g2}/member-candidates?q=m1`);
  assert.deepEqual(found.body.map((u: Json) => u.email), ['m1@test.local']);
  const all = await lead.get(`/api/groups/${ids.g2}/member-candidates?q=`);
  assert.ok(!all.body.some((u: Json) => u.email === 'other@test.local'), 'another customer’s account is never listed');
  assert.deepEqual((await lead.get(`/api/groups/${ids.g2}/member-candidates?q=%25`)).body, [], 'wildcards are matched literally');

  assert.equal((await lead.post(`/api/groups/${ids.g2}/members`, { name: 'x', email: 'm1@test.local' })).status, 201, 'own account can join a second group');
  assert.equal((await lead.post(`/api/groups/${ids.g2}/members`, { name: 'x', email: 'other@test.local' })).status, 409, 'someone else’s account cannot be pulled in');

  // Members cannot manage the group
  const m1 = await loginAs('m1', 'm1@test.local', temp.m1);
  assert.equal((await m1.post(`/api/groups/${ids.g1}/members`, { name: 'x', email: 'zz@test.local' })).status, 403);
  assert.equal((await m1.get(`/api/groups/${ids.g1}/member-candidates?q=`)).status, 403);
  assert.equal((await m1.post(`/api/groups/${ids.g1}/support-access`, { hours: 24 })).status, 403, 'only the leader can open the group to the Admin');
});

test('viewers can read but not write', async () => {
  await sessions.admin.post(`/api/admin/users/${ids.lead}/plan`, { maxMembers: 10 });
  const v = await sessions.lead.post(`/api/groups/${ids.g1}/members`, { name: 'Viewer', email: 'v@test.local', password: '1', role: 'viewer' });
  assert.equal(v.status, 201);
  ids.viewer = v.body.id;
  const viewer = await loginAs('viewer', 'v@test.local', '1');

  const t = await sessions.lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Viewer test', assignedTo: ids.m1, dueDate: day(30) });
  ids.tView = t.body.id;
  assert.equal((await viewer.get(`/api/tasks/${ids.tView}/comments`)).status, 200);
  assert.equal((await viewer.post(`/api/tasks/${ids.tView}/comments`, { body: 'hi' })).status, 403);
  assert.equal((await viewer.post(`/api/groups/${ids.g1}/daily-logs`, { rawContent: 'x\n- y' })).status, 403);
});

test('tasks notify the right people, once', async () => {
  const lead = sessions.lead;
  const m1 = sessions.m1;
  const types = async (c: Client) => (await c.get('/api/notifications')).body.items.map((i: Json) => `${i.type}:${i.params.title ?? ''}`);

  const late = await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Late', assignedTo: ids.m1, dueDate: day(-1) });
  const soon = await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Soon', assignedTo: ids.m1, dueDate: day(1) });
  const far = await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Far', assignedTo: ids.m1, dueDate: day(20) });
  const ancient = await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Ancient', assignedTo: ids.m1, dueDate: day(-60) });
  ids.tSoon = soon.body.id;
  ids.tLate = late.body.id;
  void far;
  void ancient;

  const first = await types(m1);
  assert.ok(first.includes('task_assigned:Late') && first.includes('task_assigned:Soon') && first.includes('task_assigned:Far'));
  assert.ok(first.includes('task_overdue:Late'), 'late task reminds');
  assert.ok(first.includes('task_due_soon:Soon'), 'task due tomorrow reminds');
  assert.ok(!first.includes('task_due_soon:Far'), 'a far task does not remind');
  assert.ok(!first.includes('task_overdue:Ancient'), 'very old overdue tasks do not flood the bell');
  assert.equal((await types(m1)).length, first.length, 'fetching again adds nothing');

  assert.equal((await lead.get('/api/notifications')).body.items.some((i: Json) => i.type === 'task_assigned'), false, 'the leader is not told about their own assignments');

  // Submitting twice tells the leader once; a submitted task stops reminding
  await m1.patch(`/api/tasks/${ids.tSoon}/status`, { status: 'ready_for_review' });
  await m1.patch(`/api/tasks/${ids.tSoon}/status`, { status: 'ready_for_review' });
  const ready = (await lead.get('/api/notifications')).body.items.filter((i: Json) => i.type === 'task_ready_for_review');
  assert.equal(ready.length, 1);
  assert.equal(ready[0].actorName, 'Mem One');

  // Only the assignee or a leader may change a task
  const m2 = await loginAs('m2', 'm2@test.local', '123');
  assert.equal((await m2.patch(`/api/tasks/${ids.tSoon}/status`, { status: 'todo' })).status, 403);
  assert.equal((await m2.post(`/api/tasks/${ids.tSoon}/approve`, {})).status, 403);

  assert.equal((await lead.post(`/api/tasks/${ids.tSoon}/approve`, { feedback: 'Nice' })).status, 204);
  const approved = (await m1.get('/api/notifications')).body.items.find((i: Json) => i.type === 'task_approved');
  assert.equal(approved.params.feedback, 'Nice');
});

test('reactions notify once and never the author themselves', async () => {
  const m1 = sessions.m1;
  const log = await m1.post(`/api/groups/${ids.g1}/daily-logs`, { rawContent: 'Proj\n- a\n- b' });
  assert.equal(log.status, 201);
  ids.log = log.body.id;
  const thumb = '\u{1F44D}';
  for (let i = 0; i < 3; i++) await sessions.lead.post(`/api/daily-logs/${ids.log}/reactions`, { emoji: thumb });
  await m1.post(`/api/daily-logs/${ids.log}/reactions`, { emoji: '\u{1F525}' });
  const n = (await m1.get('/api/notifications')).body.items.filter((i: Json) => i.type === 'daily_reaction');
  assert.equal(n.length, 1, 'toggling on and off and on again gives one notification, and own reaction gives none');
  assert.equal((await sessions.lead.post(`/api/daily-logs/${ids.log}/reactions`, { emoji: 'x' })).status, 400, 'only known emoji');
});

test('comments: permissions, counts, and one bell entry per thread', async () => {
  const { lead, m1, m2 } = sessions;
  const url = `/api/tasks/${ids.tLate}/comments`;
  // Someone with an account who is in none of these groups
  await sessions.admin.post('/api/admin/users', { name: 'Outsider', email: 'out@test.local', username: 'out', password: '1' });
  const other = await loginAs('outsider', 'out', '1');
  assert.equal((await m1.post(url, { body: '   ' })).status, 400);
  assert.equal((await m1.post(url, { body: 'x'.repeat(2001) })).status, 400);
  assert.equal((await m1.post(url, { body: 'Where is the file?' })).status, 201);
  assert.equal((await m1.post(url, { body: 'Also the logo' })).status, 201);

  const leadBell = (await lead.get('/api/notifications')).body.items.filter((i: Json) => i.type === 'comment_added');
  assert.equal(leadBell.length, 1, 'two comments, one bell entry');
  assert.equal(leadBell[0].params.snippet, 'Also the logo');
  assert.equal(leadBell[0].actorName, 'Mem One');

  // A group member who is not involved is not pinged
  const m2Bell = (await m2.get('/api/notifications')).body.items.filter((i: Json) => i.type === 'comment_added');
  assert.equal(m2Bell.length, 0);

  assert.equal((await lead.post(url, { body: 'In Drive' })).status, 201);
  assert.equal((await m1.get('/api/notifications')).body.items.filter((i: Json) => i.type === 'comment_added').length, 1);

  const counts = (await m1.get('/api/bootstrap')).body.tasks.find((t: Json) => t.id === ids.tLate).commentCount;
  assert.equal(counts, 3);

  // People outside the group cannot see or write
  assert.equal((await other.get(url)).status, 404);
  assert.equal((await other.post(url, { body: 'hi' })).status, 404);

  // Deleting: own comment, or any comment as a leader, but not someone else's as a member
  const list = (await m1.get(url)).body as Json[];
  const leadComment = list.find(c => c.userName === 'Lead')!;
  const m1Comment = list.find(c => c.userName === 'Mem One')!;
  assert.equal((await m1.del(`/api/comments/${leadComment.id}`)).status, 403);
  assert.equal((await m1.del(`/api/comments/${m1Comment.id}`)).status, 204);
  assert.equal((await lead.del(`/api/comments/${list.filter(c => c.userName === 'Mem One')[1].id}`)).status, 204);
  assert.equal((await m1.get(url)).body.length, 1);
});

test('the Super Admin cannot read group content unless the leader allows it', async () => {
  const admin = sessions.admin;
  const url = `/api/tasks/${ids.tLate}/comments`;
  const boot = (await admin.get('/api/bootstrap')).body;
  assert.equal(boot.groups.length, 0);
  assert.equal(boot.tasks.length, 0);
  assert.equal(boot.dailyLogs.length, 0);
  assert.equal((await admin.get(url)).status, 404);
  assert.equal((await admin.post(url, { body: 'peek' })).status, 404);
  assert.equal((await admin.get(`/api/groups/${ids.g1}/member-candidates`)).status, 404);
  assert.equal((await admin.post(`/api/groups/${ids.g1}/members`, { name: 'x', email: 'zz@test.local' })).status, 404);
  assert.equal((await admin.post(`/api/groups/${ids.g1}/support-access`, { hours: 24 })).status, 404, 'the Admin cannot allow themselves in');

  const overview = (await admin.get('/api/admin/overview')).body;
  const g = overview.groups.find((x: Json) => x.id === ids.g1);
  assert.ok(g && g.memberCount >= 3 && g.taskCount >= 1, 'the Admin still sees counts');
  assert.equal(g.supportAccessUntil, undefined);

  assert.equal((await sessions.lead.post(`/api/groups/${ids.g1}/support-access`, { hours: 999 })).status, 400);
  assert.equal((await sessions.lead.post(`/api/groups/${ids.g1}/support-access`, { hours: 24 })).status, 204);
  assert.equal((await admin.get(url)).status, 200);
  assert.equal((await admin.get('/api/bootstrap')).body.groups.length, 1);
  assert.ok((await admin.get('/api/admin/overview')).body.groups.find((x: Json) => x.id === ids.g1).supportAccessUntil);
  assert.ok((await sessions.m1.get('/api/bootstrap')).body.activityEvents.some((e: Json) => e.type === 'support_access_changed'), 'members can see it was switched on');

  // The window closes by itself
  await query("UPDATE groups SET support_access_until = now() - interval '1 minute' WHERE id = $1", [ids.g1]);
  assert.equal((await admin.get(url)).status, 404);

  // And the leader can turn it off early
  await sessions.lead.post(`/api/groups/${ids.g1}/support-access`, { hours: 24 });
  await sessions.lead.post(`/api/groups/${ids.g1}/support-access`, { hours: 0 });
  assert.equal((await admin.get(url)).status, 404);
});

test('an expired plan is view-only for 30 days, then locked, and renewing restores both leaders and members', async () => {
  const admin = sessions.admin;
  assert.equal((await admin.post(`/api/admin/users/${ids.lead}/plan`, { expiresAt: day(-3) })).status, 204);

  // Within the 30 days: can log in and look, cannot change anything
  for (const who of ['lead', 'm1']) {
    const me = await sessions[who].get('/api/auth/me');
    assert.equal(me.status, 200, `${who} can still look`);
    assert.equal(me.body.user.plan.status, 'read_only');
    assert.ok(me.body.user.plan.locksAt);
    assert.equal((await sessions[who].get('/api/bootstrap')).status, 200);
  }
  const create = await sessions.lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Late', assignedTo: ids.m1, dueDate: day(10) });
  assert.equal(create.status, 403);
  assert.match(create.body.error, /view-only/);
  assert.equal((await sessions.m1.post(`/api/groups/${ids.g1}/daily-logs`, { rawContent: 'x' })).status, 403);
  assert.equal((await sessions.lead.post('/api/notifications/read-all', {})).status < 400, true, 'notifications can still be marked read');
  const login = await newClient().post('/api/auth/login', { email: 'm1@test.local', password: temp.m1 });
  assert.equal(login.status, 200, 'logging in still works while view-only');
  assert.equal(login.body.user.plan.status, 'read_only');

  // A member whose own account never expires is still held by the leader's plan: the group is view-only
  await query('UPDATE users SET expires_at = NULL WHERE id = $1', [ids.m1]);
  assert.equal((await sessions.m1.get('/api/auth/me')).body.user.plan.status, 'active');
  const frozen = await sessions.m1.post(`/api/groups/${ids.g1}/daily-logs`, { rawContent: 'x\n- y' });
  assert.equal(frozen.status, 403, 'the group is frozen for its members');
  assert.equal((await sessions.m1.get('/api/bootstrap')).body.groups.find((g: Json) => g.id === ids.g1).planEnded, true);

  // After the 30 days: locked
  assert.equal((await admin.post(`/api/admin/users/${ids.lead}/plan`, { expiresAt: day(-40) })).status, 204);
  for (const who of ['lead', 'm1']) {
    const me = await sessions[who].get('/api/auth/me');
    assert.equal(me.status, 401, `${who} is blocked on an existing session`);
    assert.match(me.body.error, /expired/);
  }
  assert.equal((await newClient().post('/api/auth/login', { email: 'm1@test.local', password: temp.m1 })).status, 401);
  assert.equal((await newClient().post('/api/auth/login', { email: 'lead', password: '1' })).status, 401);
  assert.equal((await sessions.admin.get('/api/auth/me')).status, 200, 'the Super Admin never expires');

  const future = day(40);
  assert.equal((await admin.post(`/api/admin/users/${ids.lead}/plan`, { expiresAt: future })).status, 204);
  assert.equal((await sessions.lead.get('/api/auth/me')).status, 200);
  assert.equal((await sessions.m1.get('/api/auth/me')).status, 200, 'renewing reaches the members the leader added');
  assert.equal((await sessions.m1.post(`/api/groups/${ids.g1}/daily-logs`, { rawContent: 'Back\n- again' })).status < 400, true, 'renewing unfreezes the group');

  // A date 5 days away makes the leader see a reminder, once
  await admin.post(`/api/admin/users/${ids.lead}/plan`, { expiresAt: day(5) });
  const n1 = (await sessions.lead.get('/api/notifications')).body.items.filter((i: Json) => i.type === 'plan_expiring');
  const n2 = (await sessions.lead.get('/api/notifications')).body.items.filter((i: Json) => i.type === 'plan_expiring');
  assert.equal(n1.length, 1);
  assert.equal(n2.length, 1);
  await admin.post(`/api/admin/users/${ids.lead}/plan`, { expiresAt: null });
  assert.equal((await admin.post(`/api/admin/users/${ids.lead}/plan`, { expiresAt: '2020-13-45' })).status, 400, 'bad dates are refused');
});

test('dates and times must be real', async () => {
  const lead = sessions.lead;
  const task = (extra: object) => lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Dates', assignedTo: ids.m1, dueDate: day(10), ...extra });
  assert.equal((await task({ dueDate: '2025-02-30' })).status, 400, 'no 30th of February');
  assert.equal((await task({ dueDate: '2020-13-45' })).status, 400, 'no 13th month');
  assert.equal((await task({ dueTime: '99:99' })).status, 400);
  assert.equal((await task({ dueTime: '24:00' })).status, 400);
  assert.equal((await task({ dueDate: '2024-02-29', dueTime: '23:59' })).status, 201, 'a real leap day is fine');
  assert.equal((await sessions.m1.post(`/api/groups/${ids.g1}/daily-logs`, { rawContent: 'x\n- y', date: '2025-02-30' })).status, 400);
  assert.equal((await lead.patch(`/api/groups/${ids.g1}`, { deadline: '2025-04-31' })).status, 400);
  assert.equal((await lead.patch(`/api/groups/${ids.g1}`, { deadline: '2030-04-30' })).status, 204);
});

test('tasks have a start date, and leaders can reschedule them', async () => {
  const lead = sessions.lead;
  const boot = async () => (await lead.get('/api/bootstrap')).body;
  const create = (extra: object) => lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Sched', assignedTo: ids.m1, ...extra });
  const startOf = async (id: string) => (await boot()).tasks.find((t: Json) => t.id === id).startDate;

  // No start date means today; an earlier due date pulls the start back so they never cross
  const a = await create({ dueDate: day(10) });
  assert.equal(await startOf(a.body.id), day(0), 'the start date defaults to today');
  const b = await create({ startDate: day(2), dueDate: day(5) });
  assert.equal(await startOf(b.body.id), day(2));
  const past = await create({ dueDate: day(-3) });
  assert.equal(await startOf(past.body.id), day(-3), 'a past due date keeps the start from landing after it');
  assert.equal((await create({ startDate: day(6), dueDate: day(5) })).status, 400, 'a task cannot start after it is due');

  // The database refuses a bad pair even if some code forgets to check
  await assert.rejects(query('UPDATE tasks SET start_date = due_date + 1 WHERE id = $1', [b.body.id]));

  // Rescheduling is for leaders, and the assignee hears about it once
  const url = `/api/tasks/${b.body.id}/schedule`;
  const heard = async () => (await sessions.m1.get('/api/notifications')).body.items.filter((i: Json) => i.type === 'task_rescheduled');
  const before = (await heard()).length;
  assert.equal((await lead.patch(url, { startDate: day(3), dueDate: day(8) })).status, 204);
  assert.equal(await startOf(b.body.id), day(3));
  const after = await heard();
  assert.equal(after.length, before + 1);
  assert.equal(after[0].params.startDate, day(3));
  assert.equal(after[0].params.dueDate, day(8));
  assert.equal(after[0].actorName, 'Lead');
  assert.equal((await lead.patch(url, { startDate: day(3), dueDate: day(8) })).status, 204);
  assert.equal((await heard()).length, before + 1, 'saving the same dates again says nothing');

  assert.equal((await sessions.m2.patch(url, { startDate: day(3), dueDate: day(9) })).status, 403, 'a member cannot reschedule');
  assert.equal((await sessions.m1.patch(url, { startDate: day(3), dueDate: day(9) })).status, 403, 'not even their own task');
  assert.equal((await sessions.outsider.patch(url, { startDate: day(3), dueDate: day(9) })).status, 404);
  assert.equal((await lead.patch(url, { startDate: day(9), dueDate: day(8) })).status, 400);
  assert.equal((await lead.patch(url, { startDate: '2025-02-30', dueDate: day(8) })).status, 400);
  assert.equal((await lead.patch(url, { dueDate: day(8) })).status, 400, 'both dates are needed');
  assert.equal((await lead.patch(`/api/tasks/00000000-0000-0000-0000-000000000000/schedule`, { startDate: day(1), dueDate: day(2) })).status, 404);
  assert.ok((await boot()).activityEvents.some((e: Json) => e.type === 'task_deadline_changed' && e.description.includes('→')), 'the change is in the group log');

  // The older "change due date" call keeps working, and moves the start back when it has to
  assert.equal((await lead.patch(`/api/tasks/${b.body.id}/deadline`, { dueDate: day(1) })).status, 204);
  assert.equal(await startOf(b.body.id), day(1));
  assert.equal((await boot()).tasks.find((t: Json) => t.id === b.body.id).dueDate, day(1));
});

test('resetting a password ends old sessions and leaves a trace', async () => {
  const lead = sessions.lead;
  const m2Old = sessions.m2;
  assert.equal((await lead.post(`/api/users/${ids.lead}/reset-password`)).status, 400, 'not for yourself');
  assert.equal((await lead.post(`/api/users/${ids.other}/reset-password`)).status, 403, 'not for someone else’s account');
  const adminSelf = (await sessions.admin.get('/api/auth/me')).body.user.id;
  assert.equal((await sessions.admin.post(`/api/users/${adminSelf}/reset-password`)).status, 400);

  const r = await lead.post(`/api/users/${ids.m2}/reset-password`);
  assert.equal(r.status, 200);
  assert.match(r.body.password, /^[A-Za-z0-9]{10}$/);

  assert.equal((await newClient().post('/api/auth/login', { email: 'm2@test.local', password: '123' })).status, 401, 'the old password stops working');
  assert.equal((await m2Old.get('/api/auth/me')).status, 401, 'a session opened with the old password is ended too');

  const fresh = await loginAs('m2', 'm2@test.local', r.body.password);
  const me = (await fresh.get('/api/auth/me')).body.user;
  assert.equal(me.mustChangePassword, true);
  const bell = (await fresh.get('/api/notifications')).body.items.find((i: Json) => i.type === 'password_reset');
  assert.equal(bell.actorName, 'Lead', 'the owner is told who reset it');
});

test('the Super Admin can delete and restore an account', async () => {
  const admin = sessions.admin;
  assert.equal((await admin.post(`/api/admin/users/${ids.viewer}/active`, { active: false })).status, 204);
  assert.equal((await sessions.viewer.get('/api/auth/me')).status, 401);
  assert.equal((await newClient().post('/api/auth/login', { email: 'v@test.local', password: '1' })).status, 401);
  assert.equal((await query('SELECT count(*)::int AS n FROM group_members WHERE user_id = $1', [ids.viewer]))[0].n, 0, 'a deleted person leaves their groups');
  assert.equal((await admin.post(`/api/admin/users/${ids.viewer}/active`, { active: true })).status, 204);
  assert.equal((await newClient().post('/api/auth/login', { email: 'v@test.local', password: '1' })).status, 200);

  const adminSelf = (await admin.get('/api/auth/me')).body.user.id;
  assert.equal((await admin.post(`/api/admin/users/${adminSelf}/active`, { active: false })).status, 400, 'the Super Admin cannot be deleted');
});

test('roles: only the Super Admin changes them, and never to Super Admin or for themselves', async () => {
  const admin = sessions.admin;
  assert.equal((await sessions.lead.patch(`/api/users/${ids.m1}/role`, { role: 'viewer' })).status, 403);
  assert.equal((await admin.patch(`/api/users/${ids.m1}/role`, { role: 'super_admin' })).status, 400);
  const adminSelf = (await admin.get('/api/auth/me')).body.user.id;
  assert.equal((await admin.patch(`/api/users/${adminSelf}/role`, { role: 'member' })).status, 400);
  assert.equal((await admin.patch(`/api/users/${ids.m1}/role`, { role: 'viewer' })).status, 204);
  assert.equal((await admin.patch(`/api/users/${ids.m1}/role`, { role: 'member' })).status, 204);
});

test('landing settings: anyone reads, only the Super Admin saves, bad input is refused', async () => {
  const anon = newClient();
  const first = await anon.get('/api/public/landing');
  assert.equal(first.status, 200);
  assert.equal(first.body.studentPrice, '$4');

  const good = {
    studentPrice: '$3', studentTerm: 'month', studentNoteKm: 'ក', studentNoteEn: 'note', maxMembers: 8, pilotOffer: true,
    sponsors: [{ name: 'ACME', url: 'https://acme.example' }, { name: 'No link', url: '' }],
  };
  assert.equal((await anon.put('/api/admin/landing', good)).status, 401);
  assert.equal((await sessions.lead.put('/api/admin/landing', good)).status, 403);
  assert.equal((await sessions.admin.put('/api/admin/landing', good)).status, 200);
  const saved = (await anon.get('/api/public/landing')).body;
  assert.equal(saved.studentPrice, '$3');
  assert.deepEqual(saved.sponsors, [{ name: 'ACME', url: 'https://acme.example' }, { name: 'No link' }]);

  const bad: Json[] = [
    { ...good, sponsors: [{ name: 'X', url: 'javascript:alert(1)' }] },
    { ...good, studentPrice: 'x'.repeat(25) },
    { ...good, maxMembers: 0 },
    { ...good, studentTerm: 'week' },
    { ...good, sponsors: [{ name: '  ' }] },
    { ...good, sponsors: Array.from({ length: 21 }, (_, i) => ({ name: `s${i}` })) },
    { studentPrice: '$1' },
  ];
  for (const body of bad) assert.equal((await sessions.admin.put('/api/admin/landing', body)).status, 400, JSON.stringify(body).slice(0, 60));
  assert.equal((await anon.get('/api/public/landing')).body.studentPrice, '$3', 'refused changes leave the saved page alone');

  // A damaged row falls back to the defaults instead of breaking the page
  await query("UPDATE site_settings SET value = '\"nonsense\"'::jsonb WHERE key = 'landing'");
  assert.equal((await anon.get('/api/public/landing')).body.studentPrice, '$4');
});

test('the notification list belongs to its owner', async () => {
  const m1 = sessions.m1;
  const items = (await m1.get('/api/notifications')).body.items;
  assert.ok(items.length > 0);
  assert.equal((await sessions.lead.post(`/api/notifications/${items[0].id}/read`)).status, 404, 'cannot mark someone else’s as read');
  assert.equal((await m1.post(`/api/notifications/${items[0].id}/read`)).status, 204);
  assert.equal((await m1.post('/api/notifications/read-all')).status, 204);
  assert.equal((await m1.get('/api/notifications')).body.unread, 0);
});

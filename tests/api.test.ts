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
process.env.PGLITE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'sameakki-test-'));
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
  // Only the author edits
  const edited = await m1.patch(`/api/comments/${m1Comment.id}`, { body: 'Where is the new file?' });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.body, 'Where is the new file?');
  assert.ok(edited.body.editedAt, 'marked as edited');
  assert.equal(edited.body.userRole, 'member');
  assert.equal((await m1.patch(`/api/comments/${leadComment.id}`, { body: 'hacked' })).status, 403);
  assert.equal((await lead.patch(`/api/comments/${m1Comment.id}`, { body: 'hacked' })).status, 403, 'a lead can delete but not rewrite');
  assert.equal((await m1.patch(`/api/comments/${m1Comment.id}`, { body: '   ' })).status, 400);
  assert.equal((await m1.del(`/api/comments/${leadComment.id}`)).status, 403);
  assert.equal((await m1.del(`/api/comments/${m1Comment.id}`)).status, 204);
  assert.equal((await lead.del(`/api/comments/${list.filter(c => c.userName === 'Mem One')[1].id}`)).status, 204);
  assert.equal((await m1.get(url)).body.length, 1);
});

test('approvals follow the flow, and viewers and the leader keep to their parts', async () => {
  const { lead, m1, viewer } = sessions;

  // A task is approved only after it is submitted, and only once
  const task = (await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Flow', assignedTo: ids.m1, dueDate: day(10) })).body.id;
  assert.equal((await lead.post(`/api/tasks/${task}/approve`, {})).status, 400);
  await m1.patch(`/api/tasks/${task}/status`, { status: 'ready_for_review' });
  assert.equal((await lead.post(`/api/tasks/${task}/approve`, {})).status, 204);
  assert.equal((await lead.post(`/api/tasks/${task}/approve`, {})).status, 409);

  // Assign to all, never the viewer
  const all = await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Everyone', assignToAll: true, dueDate: day(10) });
  assert.equal(all.status, 201);
  assert.ok(all.body.ids.length >= 2, 'one task each');
  assert.equal(new Set(all.body.ids).size, all.body.ids.length);
  assert.equal((await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Nobody', dueDate: day(10) })).status, 400);

  // Chosen people share a batch, one person has none
  const some = await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Two of us', assigneeIds: [ids.m1, ids.m2], dueDate: day(10) });
  assert.equal(some.status, 201);
  assert.equal(some.body.ids.length, 2);
  const solo = await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Just one', assigneeIds: [ids.m1], dueDate: day(10) });
  assert.equal(solo.body.ids.length, 1);
  const boot = (await lead.get('/api/bootstrap')).body;
  const picked = boot.tasks.filter((x: Json) => some.body.ids.includes(x.id));
  assert.equal(picked.length, 2);
  assert.ok(picked[0].batchId && picked[0].batchId === picked[1].batchId, 'shared batch');
  assert.equal(boot.tasks.find((x: Json) => x.id === solo.body.id).batchId, undefined);
  // Cannot move a team task onto someone who has it
  assert.equal((await lead.patch(`/api/tasks/${some.body.ids[0]}/assignee`, { assignedTo: ids.m2 })).status, 400);
  assert.equal((await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Bad', assigneeIds: [ids.m1, ids.viewer], dueDate: day(10) })).status, 400);

  // A viewer cannot work on a task, so they cannot be given one
  assert.equal((await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Nope', assignedTo: ids.viewer, dueDate: day(10) })).status, 400);

  // A daily update is approved after the author marks it done, and the author cannot change it after that
  assert.equal((await lead.post(`/api/daily-logs/${ids.log}/approve`, {})).status, 400);
  assert.equal((await viewer.post(`/api/daily-logs/${ids.log}/reactions`, { emoji: '\u{1F44D}' })).status, 403, 'viewers cannot react');
  assert.equal((await m1.post(`/api/daily-logs/${ids.log}/complete`)).status, 204);
  assert.equal((await lead.post(`/api/daily-logs/${ids.log}/approve`, {})).status, 204);
  assert.equal((await lead.post(`/api/daily-logs/${ids.log}/approve`, {})).status, 409);
  const itemId = (await m1.get('/api/bootstrap')).body.dailyLogs.find((l: Json) => l.id === ids.log).items[0].id;
  assert.equal((await m1.post(`/api/daily-logs/${ids.log}/items/${itemId}/toggle`)).status, 400);
  assert.equal((await m1.post(`/api/daily-logs/${ids.log}/complete`)).status, 400);

  // The leader cannot leave their own group
  assert.equal((await lead.del(`/api/groups/${ids.g1}/members/${ids.lead}`)).status, 400);
});

test('a task can be given to someone else, and an archived group is view-only', async () => {
  const { lead, m1, m2 } = sessions;
  const m2Id = (await m2.get('/api/bootstrap')).body.currentUser.id;
  const task = (await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Pass it on', assignedTo: ids.m1, dueDate: day(10) })).body.id;
  await m1.patch(`/api/tasks/${task}/status`, { status: 'in_progress', memberNotes: 'Half way' });

  // Only a leader can reassign, and only to someone who can work on it
  assert.equal((await m1.patch(`/api/tasks/${task}/assignee`, { assignedTo: m2Id })).status, 403);
  assert.equal((await lead.patch(`/api/tasks/${task}/assignee`, { assignedTo: ids.viewer })).status, 400);
  assert.equal((await lead.patch(`/api/tasks/${task}/assignee`, { assignedTo: m2Id })).status, 204);

  // The new person starts fresh and is told about it
  const moved = (await m2.get('/api/bootstrap')).body.tasks.find((t: Json) => t.id === task);
  assert.equal(moved.assignedTo, m2Id);
  assert.equal(moved.status, 'todo');
  assert.equal(moved.memberNotes, undefined);
  const told = (await m2.get('/api/notifications')).body.items.filter((i: Json) => i.type === 'task_assigned' && i.params.title === 'Pass it on');
  assert.equal(told.length, 1);

  // An approved task stays with the person who did it
  await m2.patch(`/api/tasks/${task}/status`, { status: 'ready_for_review' });
  await lead.post(`/api/tasks/${task}/approve`, {});
  assert.equal((await lead.patch(`/api/tasks/${task}/assignee`, { assignedTo: ids.m1 })).status, 400);
  assert.equal((await lead.patch(`/api/tasks/${task}/status`, { status: 'in_progress' })).status, 400, 'approved means locked');
  assert.equal((await m2.post(`/api/tasks/${task}/reopen`)).status, 403, 'only a lead can reopen');
  assert.equal((await lead.post(`/api/tasks/${task}/reopen`)).status, 204);
  assert.equal((await lead.post(`/api/tasks/${task}/reopen`)).status, 400, 'only an approved task can be reopened');
  assert.equal((await lead.patch(`/api/tasks/${task}/status`, { status: 'in_progress' })).status, 204, 'editable again after reopening');
  await m2.patch(`/api/tasks/${task}/status`, { status: 'ready_for_review' });
  await lead.post(`/api/tasks/${task}/approve`, {});

  // Archiving makes the group read-only for everyone, and opening it again undoes that
  assert.equal((await lead.patch(`/api/groups/${ids.g1}`, { status: 'archived' })).status, 204);
  assert.equal((await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Late', assignedTo: ids.m1, dueDate: day(10) })).status, 403);
  assert.equal((await m1.post(`/api/tasks/${task}/comments`, { body: 'hi' })).status, 403);
  assert.equal((await m1.post(`/api/daily-logs/${ids.log}/reactions`, { emoji: '\u{1F44D}' })).status, 403);
  assert.equal((await m1.get(`/api/tasks/${task}/comments`)).status, 200, 'reading still works');
  assert.equal((await lead.patch(`/api/groups/${ids.g1}`, { status: 'active' })).status, 204);
  assert.equal((await m1.post(`/api/tasks/${task}/comments`, { body: 'hi' })).status, 201);
});

test('the Super Admin must type to find accounts, and adding one keeps its role', async () => {
  const admin = sessions.admin;
  const group = (await admin.post('/api/groups', { name: 'Admin group', courseOrProject: 'Test' })).body.id;

  const browse = await admin.get(`/api/groups/${group}/member-candidates?q=`);
  assert.deepEqual(browse.body, [], 'no list of every account');
  assert.equal((await admin.get(`/api/groups/${group}/member-candidates?q=m`)).body.length, 0, 'one letter is not enough');
  assert.ok((await admin.get(`/api/groups/${group}/member-candidates?q=Lead`)).body.length > 0, 'a name finds the account');

  // The leader is a Team Leader; adding them without a role must not turn them into a member
  assert.equal((await admin.post(`/api/groups/${group}/members`, { name: 'Lead', email: 'lead@test.local' })).status, 201);
  const [row] = await query('SELECT role FROM users WHERE id = $1', [ids.lead]);
  assert.equal(row.role, 'team_lead');
  assert.equal((await admin.del(`/api/groups/${group}`)).status, 204, 'tidy up for the next tests');
});

test('guessing which emails have accounts stops after ten failed tries', async () => {
  const { addMemberLimiter } = await import('../server/routes/groups');
  const lead = sessions.lead;
  const url = `/api/groups/${ids.g1}/members`;

  // Earlier tests already had a few refusals, so count from zero
  await addMemberLimiter.resetKey(ids.lead);
  for (let i = 0; i < 10; i++) {
    assert.equal((await lead.post(url, { name: 'x', email: 'other@test.local' })).status, 409);
  }
  assert.equal((await lead.post(url, { name: 'x', email: 'other@test.local' })).status, 429);

  await addMemberLimiter.resetKey(ids.lead);
  assert.equal((await lead.post(url, { name: 'x', email: 'other@test.local' })).status, 409, 'allowed again after the wait');
  await addMemberLimiter.resetKey(ids.lead);
});

test('changing a group status is kept in its activity', async () => {
  const changes = () => query(`SELECT description FROM activity_events WHERE group_id = $1 AND type = 'group_status_changed' ORDER BY created_at`, [ids.g1]);
  const before = (await changes()).length;
  assert.equal((await sessions.lead.patch(`/api/groups/${ids.g1}`, { status: 'completed' })).status, 204);
  assert.equal((await sessions.lead.patch(`/api/groups/${ids.g1}`, { status: 'completed' })).status, 204, 'the same status again');
  const after = await changes();
  assert.equal(after.length, before + 1, 'only a real change is kept');
  assert.match(after[after.length - 1].description, /to completed$/);
  assert.equal((await sessions.lead.patch(`/api/groups/${ids.g1}`, { status: 'active' })).status, 204);
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
  const after = (await m1.get('/api/notifications')).body;
  assert.ok(!after.items.some((i: Json) => i.id === items[0].id), 'a read notification is gone from the list');
  assert.ok(after.items.every((i: Json) => i.read === false), 'only unread ones are listed');
  assert.equal(after.unread, after.items.length, 'the number matches the list');
  assert.equal((await m1.post('/api/notifications/read-all')).status, 204);
  const empty = (await m1.get('/api/notifications')).body;
  assert.equal(empty.unread, 0);
  assert.deepEqual(empty.items, [], 'nothing is left once everything is read');
});

test('progress drives the status, and only the assignee or a lead may change it', async () => {
  const { lead, m1 } = sessions;
  const read = async (id: string) => (await lead.get('/api/bootstrap')).body.tasks.find((x: Json) => x.id === id);

  const task = (await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Progress', assignedTo: ids.m1, dueDate: day(10) })).body.id;
  assert.equal((await read(task)).progress, 0);

  // 0 is to do, 1-99 in progress, 100 for review
  assert.equal((await m1.patch(`/api/tasks/${task}/progress`, { progress: 40 })).status, 204);
  assert.deepEqual([(await read(task)).status, (await read(task)).progress], ['in_progress', 40]);
  assert.equal((await m1.patch(`/api/tasks/${task}/progress`, { progress: 0 })).status, 204);
  assert.equal((await read(task)).status, 'todo');
  assert.equal((await m1.patch(`/api/tasks/${task}/progress`, { progress: 100 })).status, 204);
  assert.deepEqual([(await read(task)).status, (await read(task)).progress], ['ready_for_review', 100]);

  // Back to work stays below 100
  await m1.patch(`/api/tasks/${task}/status`, { status: 'in_progress' });
  assert.deepEqual([(await read(task)).status, (await read(task)).progress], ['in_progress', 99]);
  await m1.patch(`/api/tasks/${task}/status`, { status: 'todo' });
  assert.equal((await read(task)).progress, 0);

  // A lead can update anyone's task
  assert.equal((await lead.patch(`/api/tasks/${task}/progress`, { progress: 60 })).status, 204);
  const theirs = (await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Not yours', assignedTo: ids.m2, dueDate: day(10) })).body.id;
  assert.equal((await m1.patch(`/api/tasks/${theirs}/progress`, { progress: 10 })).status, 403, 'another member');
  assert.equal((await m1.patch(`/api/tasks/${task}/progress`, { progress: 101 })).status, 400);
  assert.equal((await m1.patch(`/api/tasks/${task}/progress`, { progress: 12.5 })).status, 400);

  // Approved is closed, a new assignee starts at 0
  await m1.patch(`/api/tasks/${task}/progress`, { progress: 100 });
  assert.equal((await lead.post(`/api/tasks/${task}/approve`, {})).status, 204);
  assert.equal((await m1.patch(`/api/tasks/${task}/progress`, { progress: 50 })).status, 400);
  const open = (await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Move me', assignedTo: ids.m1, dueDate: day(10) })).body.id;
  await m1.patch(`/api/tasks/${open}/progress`, { progress: 70 });
  await lead.patch(`/api/tasks/${open}/assignee`, { assignedTo: ids.m2 });
  assert.deepEqual([(await read(open)).status, (await read(open)).progress], ['todo', 0]);
});

test('a team task is deleted for everyone at once, by a lead only', async () => {
  const { lead, m1 } = sessions;
  const team = await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Delete together', assigneeIds: [ids.m1, ids.m2], dueDate: day(10) });
  const batchId = (await lead.get('/api/bootstrap')).body.tasks.find((x: Json) => x.id === team.body.ids[0]).batchId;
  assert.equal((await m1.del(`/api/groups/${ids.g1}/task-batches/${batchId}`)).status, 403);
  assert.equal((await lead.del(`/api/groups/${ids.g1}/task-batches/${batchId}`)).status, 204);
  const left = (await lead.get('/api/bootstrap')).body.tasks.filter((x: Json) => team.body.ids.includes(x.id));
  assert.equal(left.length, 0, 'both copies are gone');
  assert.equal((await lead.del(`/api/groups/${ids.g1}/task-batches/${batchId}`)).status, 404);
});

test('a specialty belongs to the group, set by the member or a lead', async () => {
  const { lead, m1 } = sessions;
  const g = (await lead.get('/api/bootstrap')).body.groups.find((x: Json) => x.id === ids.g1);
  const url = (userId: string) => `/api/groups/${ids.g1}/members/${userId}/specialty`;
  const specialtyOf = async (userId: string) => (await lead.get('/api/bootstrap')).body.groups.find((x: Json) => x.id === ids.g1).memberSpecialties?.[userId];
  assert.ok(g, 'the group is listed');

  // Members set their own, leads set anyone's
  assert.equal((await m1.patch(url(ids.m1), { specialty: '  Project Manager ' })).status, 204);
  assert.equal(await specialtyOf(ids.m1), 'Project Manager');
  assert.equal((await lead.patch(url(ids.m1), { specialty: 'Backend Developer' })).status, 204);
  assert.equal(await specialtyOf(ids.m1), 'Backend Developer');

  // Not someone else's, not an unknown person
  assert.equal((await m1.patch(url(ids.m2), { specialty: 'Boss' })).status, 403);
  assert.equal((await lead.patch(url('00000000-0000-4000-8000-000000000000'), { specialty: 'x' })).status, 404);
  assert.equal((await m1.patch(url(ids.m1), { specialty: 'x'.repeat(201) })).status, 400);

  // Empty clears it
  assert.equal((await m1.patch('/api/users/me', { name: 'Mem One' })).status, 204);
  assert.equal((await m1.patch(url(ids.m1), { specialty: '' })).status, 204);
  assert.equal(await specialtyOf(ids.m1), undefined);
});

test('the old cookie name still signs people in, and logging out clears both', async () => {
  const login = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'root', password: 'rootpass' }),
  });
  const cookies = login.headers.getSetCookie().map(line => line.split(';')[0]);
  const token = cookies.find(c => c.startsWith('sameakki_token='))?.split('=')[1];
  assert.ok(token, 'the new cookie name is set');
  assert.ok(!cookies.some(c => c.startsWith('leadersync_token=') && c.split('=')[1]), 'no value is set under the old name');

  const withOld = await fetch(base + '/api/auth/me', { headers: { Cookie: `leadersync_token=${token}` } });
  assert.equal(withOld.status, 200, 'a session made before the rename keeps working');
  const withNew = await fetch(base + '/api/auth/me', { headers: { Cookie: `sameakki_token=${token}` } });
  assert.equal(withNew.status, 200);
});

test('a posted ToDo can be edited by its author or a lead, until it is approved and locked', async () => {
  const { lead, m1 } = sessions;
  const url = (id: string) => `/api/daily-logs/${id}`;
  const post = await m1.post(`/api/groups/${ids.g1}/daily-logs`, { rawContent: 'Login\n- Wireframe\n- Colors' });
  const id = post.body.id;
  const read = async () => (await m1.get('/api/bootstrap')).body.dailyLogs.find((l: Json) => l.id === id);

  await m1.post(`${url(id)}/items/${(await read()).items[0].id}/toggle`);
  assert.equal((await m1.patch(url(id), { rawContent: 'Login screen\n- Wireframe\n- Colors - 80%\n- Icons' })).status, 204);
  const log = await read();
  assert.equal(log.title, 'Login screen');
  assert.deepEqual(log.items.map((i: Json) => [i.text, i.done]), [['Wireframe', true], ['Colors', false], ['Icons', false]], 'the tick on Wireframe stays');
  assert.ok(log.editedAt, 'marked as edited');
  assert.equal(log.status, 'in_progress');

  assert.equal((await m1.patch(url(id), { rawContent: '   ' })).status, 400);
  assert.equal((await lead.patch(url(id), { rawContent: 'Login screen\n- Wireframe' })).status, 204, 'a lead can edit');
  assert.equal((await read()).status, 'completed', 'every item is ticked now');

  await lead.post(`${url(id)}/approve`, { note: 'ok' });
  assert.equal((await m1.patch(url(id), { rawContent: 'Changed' })).status, 400, 'the author cannot edit after approval');
  assert.equal((await lead.patch(url(id), { rawContent: 'Changed\n- one' })).status, 400, 'approved means locked, even for the lead');
  assert.equal((await m1.post(`${url(id)}/reopen`)).status, 403, 'only a lead can reopen');
  assert.equal((await lead.post(`${url(id)}/reopen`)).status, 204);
  assert.equal((await read()).status, 'completed');
  assert.equal((await lead.post(`${url(id)}/reopen`)).status, 400, 'only an approved update can be reopened');
  assert.equal((await m1.patch(url(id), { rawContent: 'Changed\n- one' })).status, 204, 'editable again after reopening');
  assert.equal((await read()).status, 'in_progress');
});

test('importing tasks: leads only, and all rows are created or none', async () => {
  const { lead, m1, m2 } = sessions;
  const url = `/api/groups/${ids.g1}/tasks/import`;
  const rows = [
    { title: 'Import A', module: 'Team', assignToAll: true, dueDate: day(8) },
    { title: 'Import B', assigneeIds: [ids.m1, ids.m2], dueDate: day(9), priority: 'high' },
    { title: 'Import C', assignedTo: ids.m1, dueDate: day(10), dueTime: '18:00' },
  ];
  const count = async () => (await lead.get('/api/bootstrap')).body.tasks.filter((x: Json) => x.title.startsWith('Import ')).length;

  assert.equal((await m1.post(url, { tasks: rows })).status, 403, 'members cannot import');
  assert.equal((await lead.post(url, { tasks: [] })).status, 400, 'at least one task');
  assert.equal((await lead.post(url, { tasks: [...rows, { title: 'Bad', assigneeIds: [ids.viewer], dueDate: day(8) }] })).status, 400);
  assert.equal(await count(), 0, 'one bad row creates nothing');

  const ok = await lead.post(url, { tasks: rows });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.count, 3);
  assert.ok((await count()) >= 3, 'Everyone makes one copy per member, so there are more than 3 tasks');
  const told = (await m2.get('/api/notifications')).body.items.filter((i: Json) => i.type === 'task_assigned' && String(i.params.title).startsWith('Import '));
  assert.ok(told.length >= 2, 'the people who got tasks are told');
});

test('the task flow: send back with a reason, edit details, approve many at once', async () => {
  const { lead, m1, m2 } = sessions;
  const read = async (id: string) => (await lead.get('/api/bootstrap')).body.tasks.find((x: Json) => x.id === id);
  const make = async (title: string, assignee = ids.m1) => (await lead.post(`/api/groups/${ids.g1}/tasks`, { title, assignedTo: assignee, dueDate: day(10) })).body.id as string;
  const submit = (id: string, who = m1) => who.patch(`/api/tasks/${id}/status`, { status: 'ready_for_review' });

  // Sending back needs a reason, a lead, and work that is waiting for review
  const a = await make('Flow back');
  assert.equal((await lead.post(`/api/tasks/${a}/request-changes`, { feedback: 'Fix it' })).status, 400, 'not submitted yet');
  await submit(a);
  assert.equal((await m1.post(`/api/tasks/${a}/request-changes`, { feedback: 'Fix it' })).status, 403, 'members cannot');
  assert.equal((await lead.post(`/api/tasks/${a}/request-changes`, { feedback: '  ' })).status, 400, 'a reason is required');
  assert.equal((await lead.post(`/api/tasks/${a}/request-changes`, { feedback: 'Add the footer' })).status, 204);
  const back = await read(a);
  assert.equal(back.status, 'in_progress');
  assert.ok(back.progress < 100, 'it is no longer 100%');
  assert.equal(back.leaderFeedback, 'Add the footer');
  const told = (await m1.get('/api/notifications')).body.items.find((i: Json) => i.type === 'task_changes_requested');
  assert.equal(told.params.feedback, 'Add the footer', 'the person is told why');
  assert.equal((await lead.post(`/api/tasks/${a}/request-changes`, { feedback: 'again' })).status, 400, 'only while waiting for review');

  // After fixing, it can be sent again and approved
  await submit(a);
  assert.equal((await lead.post(`/api/tasks/${a}/approve`, {})).status, 204);

  // Editing: leads only, never when approved, and a team task changes for everyone
  const b = await make('Flow edit');
  assert.equal((await m1.patch(`/api/tasks/${b}`, { title: 'Hacked' })).status, 403);
  assert.equal((await lead.patch(`/api/tasks/${b}`, {})).status, 400, 'nothing to change');
  assert.equal((await lead.patch(`/api/tasks/${b}`, { title: '  ' })).status, 400, 'a title cannot be empty');
  assert.equal((await lead.patch(`/api/tasks/${b}`, { title: 'Flow edited', description: 'Line 1\nLine 2', priority: 'urgent', module: 'Docs' })).status, 204);
  const edited = await read(b);
  assert.deepEqual([edited.title, edited.description, edited.priority, edited.module, edited.assignedTo], ['Flow edited', 'Line 1\nLine 2', 'urgent', 'Docs', ids.m1]);
  assert.equal((await lead.patch(`/api/tasks/${a}`, { title: 'Late change' })).status, 400, 'approved tasks are locked');

  const team = (await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Flow team', assigneeIds: [ids.m1, ids.m2], dueDate: day(10) })).body.ids as string[];
  assert.equal((await lead.patch(`/api/tasks/${team[0]}`, { title: 'Flow team renamed' })).status, 204);
  assert.deepEqual([(await read(team[0])).title, (await read(team[1])).title], ['Flow team renamed', 'Flow team renamed']);

  // Approve many: only the ones waiting for review, only in this group, leads only
  const c = await make('Flow bulk 1');
  const d = await make('Flow bulk 2', ids.m2);
  const e = await make('Flow bulk 3 (not submitted)');
  await submit(c);
  await submit(d, m2);
  const bulk = `/api/groups/${ids.g1}/tasks/approve`;
  assert.equal((await m1.post(bulk, { taskIds: [c, d] })).status, 403);
  assert.equal((await lead.post(bulk, { taskIds: [] })).status, 400);
  const done = await lead.post(bulk, { taskIds: [c, d, e] });
  assert.equal(done.status, 200);
  assert.equal(done.body.count, 2, 'the task that was not submitted is skipped');
  assert.deepEqual([(await read(c)).status, (await read(d)).status, (await read(e)).status], ['approved', 'approved', 'todo']);
  assert.equal((await lead.post(bulk, { taskIds: [c, d] })).body.count, 0, 'nothing is approved twice');
});

test('streaks and pokes: ranked, one poke per person per day, and an optional Telegram message', async () => {
  const { lead, m1, m2, viewer } = sessions;
  const streaks = async (who = lead) => (await who.get(`/api/groups/${ids.g1}/streaks`)).body;

  // Telegram is off until the server is given a bot
  assert.equal((await m1.get('/api/telegram')).body.available, false);
  assert.equal((await m1.get('/api/telegram')).body.linked, false);
  assert.equal((await m1.post('/api/telegram/link')).status, 400);
  assert.equal((await newClient().post('/api/telegram/webhook', { message: {} })).status, 404, 'no webhook without a bot');

  // The ranking has people who can post, never viewers
  const before = await streaks();
  assert.ok(!before.members.some((m: Json) => m.userId === ids.viewer), 'viewers are not ranked');
  assert.deepEqual(before.members.map((m: Json) => m.current), [...before.members.map((m: Json) => m.current)].sort((a: number, b: number) => b - a), 'longest streak first');
  const target = before.members.find((m: Json) => (m.userId === ids.m1 || m.userId === ids.m2) && !m.postedToday);
  assert.ok(target, 'someone has not posted today');
  const [targetSession, otherSession, targetId] = target.userId === ids.m1 ? [m1, m2, ids.m1] : [m2, m1, ids.m2];

  // Connect the target's Telegram, with a fake Telegram so no network is used
  const sent: { chat: string; text: string }[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init?: any) => {
    if (String(input).startsWith('https://api.telegram.org/')) {
      const body = JSON.parse(init.body);
      sent.push({ chat: String(body.chat_id), text: body.text });
      return new Response('{"ok":true}', { status: 200 });
    }
    return realFetch(input, init);
  }) as typeof fetch;
  Object.assign(process.env, { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_BOT_USERNAME: '@SameakkiBot', TELEGRAM_WEBHOOK_SECRET: 's3cret' });
  try {
    const status = (await targetSession.get('/api/telegram')).body;
    assert.deepEqual([status.available, status.linked, status.all], [true, false, true], 'everything is sent unless they turn it off');
    const link = (await targetSession.post('/api/telegram/link', { language: 'en' })).body;
    assert.match(link.url, /^https:\/\/t\.me\/SameakkiBot\?start=[A-Za-z0-9_-]{16,}$/);
    const token = link.url.split('start=')[1];
    const hookWith = async (secret: string | undefined, text: string, type = 'private') => {
      const res = await fetch(`${base}/api/telegram/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(secret ? { 'x-telegram-bot-api-secret-token': secret } : {}) },
        body: JSON.stringify({ message: { text, chat: { id: 4242, type } } }),
      });
      return res.status;
    };
    assert.equal(await hookWith(undefined, `/start ${token}`), 401, 'Telegram must send our secret');
    assert.equal(await hookWith('wrong', `/start ${token}`), 401);
    assert.equal(await hookWith('s3cret', `/start ${token}`, 'group'), 200);
    assert.equal((await targetSession.get('/api/telegram')).body.linked, false, 'a group chat never connects');
    assert.equal(await hookWith('s3cret', '/start not-a-real-token-123456'), 200);
    assert.equal((await targetSession.get('/api/telegram')).body.linked, false, 'a wrong link does nothing');
    assert.equal(await hookWith('s3cret', `/start ${token}`), 200);
    assert.equal((await targetSession.get('/api/telegram')).body.linked, true);
    assert.equal((await streaks()).members.find((m: Json) => m.userId === targetId).telegram, true, 'others can see who is on Telegram');
    assert.ok(!JSON.stringify(await streaks()).includes('4242'), 'but never the chat id');
    assert.ok(sent.some(m => m.chat === '4242' && m.text.includes('Connected')), 'Telegram confirms');
    assert.equal(await hookWith('s3cret', `/start ${token}`), 200, 'the link works once');

    // Poking: not yourself, not a viewer, not someone who already posted
    assert.equal((await targetSession.post(`/api/groups/${ids.g1}/pokes`, { userId: targetId })).status, 400, 'not yourself');
    assert.ok([403, 404].includes((await viewer.post(`/api/groups/${ids.g1}/pokes`, { userId: targetId })).status), 'viewers cannot poke');
    assert.equal((await lead.post(`/api/groups/${ids.g1}/pokes`, { userId: ids.viewer })).status, 404, 'viewers are not in the ranking');

    // A poke to someone who has not connected Telegram is only in the app, and the answer says so
    const stranger = before.members.find((m: Json) => (m.userId === ids.m1 || m.userId === ids.m2) && m.userId !== targetId && !m.postedToday);
    if (stranger) {
      const reply = await lead.post(`/api/groups/${ids.g1}/pokes`, { userId: stranger.userId });
      assert.equal(reply.status, 201);
      assert.equal(reply.body.telegram, 'none');
    }

    sent.length = 0;
    const first = await lead.post(`/api/groups/${ids.g1}/pokes`, { userId: targetId });
    assert.equal(first.status, 201);
    assert.equal(first.body.telegram, 'sent', 'it reached their Telegram');
    assert.equal((await lead.post(`/api/groups/${ids.g1}/pokes`, { userId: targetId })).status, 409, 'one poke to the same person per day');
    assert.equal((await otherSession.post(`/api/groups/${ids.g1}/pokes`, { userId: targetId })).status, 201, 'someone else can still poke them');
    assert.ok((await streaks()).pokedToday.includes(targetId), 'my own pokes today');
    assert.deepEqual((await streaks(otherSession)).pokedToday, [targetId]);

    const note = (await targetSession.get('/api/notifications')).body.items.find((i: Json) => i.type === 'poke');
    assert.ok(note, 'the bell shows the poke');
    assert.equal(note.params.streak, String(target.current));
    assert.equal(sent.filter(m => m.chat === '4242' && m.text.includes('poked you')).length, 2, 'Telegram got both pokes');

    // Other notifications go to Telegram too, in the chosen language, until the person turns that off
    const until = async (check: () => boolean) => {
      for (let i = 0; i < 40 && !check(); i++) await new Promise(r => setTimeout(r, 50));
      return check();
    };
    const assign = (title: string) => lead.post(`/api/groups/${ids.g1}/tasks`, { title, assignedTo: targetId, dueDate: day(9) });
    sent.length = 0;
    await assign('Telegram task one');
    assert.ok(await until(() => sent.some(m => m.text.includes('Telegram task one'))), 'a new task reaches Telegram');
    assert.match(sent.find(m => m.text.includes('Telegram task one'))!.text, /assigned you/, 'in English, as chosen');

    assert.equal((await targetSession.patch('/api/telegram', { language: 'km' })).status, 204);
    await assign('Telegram task two');
    assert.ok(await until(() => sent.some(m => m.text.includes('Telegram task two'))));
    assert.match(sent.find(m => m.text.includes('Telegram task two'))!.text, /បានចាត់កិច្ចការ/, 'now in Khmer');

    assert.equal((await targetSession.patch('/api/telegram', { all: false })).status, 204);
    assert.equal((await targetSession.patch('/api/telegram', {})).status, 400, 'nothing to change');
    await assign('Telegram task three');
    await new Promise(r => setTimeout(r, 300));
    assert.ok(!sent.some(m => m.text.includes('Telegram task three')), 'turned off: only pokes are sent');
    assert.ok((await targetSession.get('/api/notifications')).body.items.some((i: Json) => i.params.title === 'Telegram task three'), 'the bell still has it');
    assert.deepEqual([(await targetSession.get('/api/telegram')).body.language, (await targetSession.get('/api/telegram')).body.all], ['km', false]);
    assert.equal((await targetSession.patch('/api/telegram', { all: true })).status, 204);

    // After posting, the streak starts and nobody can poke them any more
    assert.equal((await targetSession.post(`/api/groups/${ids.g1}/daily-logs`, { rawContent: 'Streak day\n- one' })).status, 201);
    const after = (await streaks()).members.find((m: Json) => m.userId === targetId);
    assert.equal(after.postedToday, true);
    assert.ok(after.current >= 1 && after.best >= after.current && after.total >= 1);
    assert.equal((await otherSession.post(`/api/groups/${ids.g1}/pokes`, { userId: targetId })).status, 400, 'already posted today');

    // Disconnect
    assert.equal((await targetSession.del('/api/telegram/link')).status, 204);
    assert.equal((await targetSession.get('/api/telegram')).body.linked, false);

    // One Telegram chat belongs to one account at a time: connecting it to another account moves it
    const connect = async (who: Client) => {
      const url = (await who.post('/api/telegram/link')).body.url as string;
      return hookWith('s3cret', `/start ${url.split('start=')[1]}`);
    };
    assert.equal(await connect(otherSession), 200);
    assert.equal((await otherSession.get('/api/telegram')).body.linked, true);
    assert.equal(await connect(targetSession), 200, 'the same chat can be used by another account');
    assert.equal((await targetSession.get('/api/telegram')).body.linked, true);
    assert.equal((await otherSession.get('/api/telegram')).body.linked, false, 'the older account lets go of it');
    assert.equal((await targetSession.del('/api/telegram/link')).status, 204);
  } finally {
    globalThis.fetch = realFetch;
    for (const key of ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_BOT_USERNAME', 'TELEGRAM_WEBHOOK_SECRET']) delete process.env[key];
  }
});

test('a person can choose their own username to sign in with', async () => {
  const { m1, m2 } = sessions;
  const profile = (who: Client, name: string, username?: string) => who.patch('/api/users/me', { name, ...(username !== undefined ? { username } : {}) });
  const me = async (who: Client) => (await who.get('/api/bootstrap')).body;

  assert.equal((await profile(m1, 'Mem One', 'Bad Name!')).status, 400, 'letters, numbers, . _ - only');
  assert.equal((await profile(m1, 'Mem One', 'ab')).status, 400, 'at least 3 characters');
  assert.equal((await profile(m1, 'Mem One', 'lead')).status, 409, 'taken by someone else');
  assert.equal((await profile(m1, 'Mem One', 'LEAD')).status, 409, 'upper and lower case are the same name');
  assert.equal((await profile(m1, 'Mem One', 'mem.one')).status, 204);
  assert.equal((await profile(m1, 'Mem One', 'MEM.ONE')).status, 204, 'keeping your own name is fine');
  assert.equal((await profile(m2, 'Mem Two', 'mem.one')).status, 409, 'now it is taken');

  // It is shown to its owner only
  const own = await me(m1);
  assert.equal(own.currentUser.username, 'mem.one');
  assert.ok(own.users.every((u: Json) => u.id === own.currentUser.id || u.username === undefined), 'nobody else sees login names');
  const other = await me(m2);
  assert.ok(other.users.every((u: Json) => u.username === undefined || u.id === other.currentUser.id));

  // It works for signing in, in any letter case, and the email still works
  assert.equal((await newClient().post('/api/auth/login', { email: 'mem.one', password: temp.m1 })).status, 200);
  assert.equal((await newClient().post('/api/auth/login', { email: 'Mem.One', password: temp.m1 })).status, 200);
  assert.equal((await newClient().post('/api/auth/login', { email: 'm1@test.local', password: temp.m1 })).status, 200);

  // Saving without a username leaves it alone; an empty one removes it
  assert.equal((await profile(m1, 'Mem One')).status, 204);
  assert.equal((await me(m1)).currentUser.username, 'mem.one');
  assert.equal((await profile(m1, 'Mem One', '')).status, 204);
  assert.equal((await me(m1)).currentUser.username, undefined);
  assert.equal((await newClient().post('/api/auth/login', { email: 'mem.one', password: temp.m1 })).status, 401);
  assert.equal((await profile(m2, 'Mem Two', 'mem.one')).status, 204, 'a removed name can be used again');
  assert.equal((await profile(m2, 'Mem Two', '')).status, 204);
});

test('a new due date on a team task changes it for everyone, except approved copies', async () => {
  const { lead, m1, m2 } = sessions;
  const read = async (id: string) => (await lead.get('/api/bootstrap')).body.tasks.find((x: Json) => x.id === id);
  const ids3 = (await lead.post(`/api/groups/${ids.g1}/tasks`, { title: 'Team date', assigneeIds: [ids.m1, ids.m2], dueDate: day(12) })).body.ids as string[];

  assert.equal((await m1.patch(`/api/tasks/${ids3[0]}/deadline`, { dueDate: day(20) })).status, 403, 'members cannot move a date');
  assert.equal((await lead.patch(`/api/tasks/${ids3[0]}/deadline`, { dueDate: day(20), dueTime: '17:00' })).status, 204);
  for (const id of ids3) {
    const task = await read(id);
    assert.deepEqual([task.dueDate, task.dueTime], [day(20), '17:00'], 'both copies moved');
  }

  // A copy that is already approved keeps its date
  await m2.patch(`/api/tasks/${ids3[1]}/status`, { status: 'ready_for_review' });
  await lead.post(`/api/tasks/${ids3[1]}/approve`, {});
  assert.equal((await lead.patch(`/api/tasks/${ids3[0]}/deadline`, { dueDate: day(25) })).status, 204);
  assert.equal((await read(ids3[0])).dueDate, day(25));
  assert.equal((await read(ids3[1])).dueDate, day(20), 'approved work keeps its date');
});

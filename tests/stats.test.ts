import assert from 'node:assert/strict';
import { test } from 'node:test';
import { averageProgress, dailyLogPercent, standupToday, taskTotals } from '../client/src/lib/stats';
import { dateInAppZone, localDateOf } from '../client/src/lib/dates';
import { endOfDay } from '../server/services/plan';

const user = (id: string, role = 'member') => ({ id, name: id, email: `${id}@x`, role }) as any;
const log = (userId: string, date: string) => ({ id: `${userId}${date}`, userId, date }) as any;
const task = (status: string, progress = 0) => ({ status, progress }) as any;

test('the standup count leaves viewers out and ignores people who left', () => {
  const members = [user('a'), user('b'), user('lead', 'team_lead'), user('v', 'viewer')];
  const logs = [log('a', '2026-11-17'), log('lead', '2026-11-17'), log('gone', '2026-11-17'), log('b', '2026-11-16'), log('v', '2026-11-17')];
  const s = standupToday(members, logs, '2026-11-17');
  assert.equal(s.total, 3, 'the viewer cannot post, so is not counted');
  assert.equal(s.posted, 2, 'a post by someone no longer in the group, and an old post, do not count');
  assert.equal(s.percent, 67);
  assert.deepEqual([...s.postedIds].sort(), ['a', 'lead']);
  assert.equal(standupToday([], [], '2026-11-17').percent, 0, 'no members is 0%, not a division by zero');
});

test('task completion counts approved tasks only', () => {
  const totals = taskTotals([task('approved'), task('ready_for_review'), task('in_progress'), task('todo'), task('approved')]);
  assert.deepEqual([totals.total, totals.approved, totals.review, totals.percent], [5, 2, 1, 40]);
  const mixed = taskTotals([task('approved', 100), task('in_progress', 50), task('todo', 0), task('ready_for_review', 100)]);
  assert.equal(mixed.progress, 63, 'progress averages everyone\'s own progress (250/4)');
  assert.equal(mixed.percent, 25, 'while completion counts only the approved');
  assert.equal(taskTotals([]).percent, 0);
});

test('a daily update counts partial progress and invents nothing', () => {
  const item = (done: boolean, progressTag?: string) => ({ id: 'i', text: 't', done, progressTag }) as any;
  assert.equal(dailyLogPercent([]), null, 'no items, no figure');
  assert.equal(dailyLogPercent([item(true), item(false)]), 50);
  assert.equal(dailyLogPercent([item(true), item(false, '80%')]), 90);
  assert.equal(dailyLogPercent([item(false, '40%'), item(false, '60%')]), 50);
  assert.equal(dailyLogPercent([item(false, '250%')]), 100, 'more than 100% is capped');
  assert.equal(dailyLogPercent([item(true, '30%')]), 100, 'done wins over a stale tag');
});

test('a team task averages everyone\'s own progress', () => {
  assert.equal(averageProgress([task('todo', 0), task('in_progress', 50), task('ready_for_review', 100)]), 50);
  assert.equal(averageProgress([task('in_progress', 1), task('todo', 0), task('todo', 0)]), 0);
  assert.equal(averageProgress([]), 0);
});

test('days are those of the app time zone', () => {
  assert.equal(dateInAppZone(new Date('2026-12-31T16:59:59.999Z')), '2026-12-31');
  assert.equal(dateInAppZone(new Date('2026-12-31T17:00:00.000Z')), '2027-01-01', 'midnight in Phnom Penh is 17:00 UTC');
  assert.equal(localDateOf('2026-12-31T17:30:00Z'), '2027-01-01');
});

test('a plan ends at the end of its last day in the app time zone', () => {
  assert.equal(endOfDay('2026-12-31')!.toISOString(), '2026-12-31T16:59:59.999Z');
  assert.equal(dateInAppZone(endOfDay('2026-12-31')!), '2026-12-31', 'the date entered is the date shown');
  assert.equal(endOfDay(null), null);
});

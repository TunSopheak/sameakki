import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_DAYS, buildRows, chartRange, clipSpan, dragSpan, fromDay, isLate, isWeekend, monthSegments, packLanes, pixelsToDays, spanDays, toDay, weekday } from '../client/src/components/timeline/ganttModel';

const task = (over: Record<string, unknown> = {}) =>
  ({ id: 't', title: 'T', assignedTo: 'u1', status: 'todo', startDate: '2026-03-02', dueDate: '2026-03-06', ...over }) as any;
const user = (id: string) => ({ id, name: id, email: `${id}@x`, role: 'member' }) as any;

test('days convert both ways, across months, years and leap days', () => {
  for (const iso of ['1970-01-01', '2024-02-29', '2025-02-28', '2025-12-31', '2026-01-01', '2026-10-31']) assert.equal(fromDay(toDay(iso)), iso);
  assert.equal(toDay('2026-01-01') - toDay('2025-12-31'), 1);
  assert.equal(toDay('2024-03-01') - toDay('2024-02-28'), 2, '2024 has a 29th of February');
  assert.equal(toDay('2025-03-01') - toDay('2025-02-28'), 1);
});

test('weekdays are right, including before 1970', () => {
  assert.equal(weekday(toDay('2026-01-01')), 4, 'a Thursday');
  assert.equal(weekday(toDay('2026-01-04')), 0, 'a Sunday');
  assert.equal(weekday(toDay('1969-12-31')), 3, 'a Wednesday');
  assert.equal(isWeekend(toDay('2026-01-03')), true);
  assert.equal(isWeekend(toDay('2026-01-05')), false);
});

test('the visible range pads the tasks, includes today, and is never too short', () => {
  const today = toDay('2026-03-10');
  const r = chartRange([{ start: toDay('2026-03-02'), end: toDay('2026-03-06') }], today);
  assert.equal(r.from, toDay('2026-03-02') - 2);
  assert.ok(r.to >= today + 5 || r.to - r.from + 1 >= 28);
  assert.ok(r.to - r.from + 1 >= 28, 'at least 28 days');
  assert.ok(r.from <= today && r.to >= today, 'today is always in view');

  const late = chartRange([{ start: toDay('2026-06-01'), end: toDay('2026-06-30') }], today);
  assert.equal(late.from, today - 2, 'today before every task still shows, with padding');
  assert.equal(late.to, toDay('2026-06-30') + 5);

  const none = chartRange([], today);
  assert.deepEqual([none.from, none.to], [today - 7, today + 21]);
  assert.equal(chartRange([], today, [today + 60]).to, today + 21, 'with nothing to show, extra days are not added');
  assert.equal(chartRange([{ start: today, end: today }], today, [today + 60]).to, today + 65, 'a marked day such as a team deadline stays in view');
});

test('lanes: tasks that overlap, or touch, go on separate lines', () => {
  const s = (start: number, end: number) => ({ start, end });
  assert.equal(packLanes([s(1, 3), s(5, 7)]).length, 1, 'a gap lets them share a line');
  assert.equal(packLanes([s(1, 3), s(4, 6)]).length, 1, 'ending one day and starting the next is fine');
  assert.equal(packLanes([s(1, 3), s(3, 6)]).length, 2, 'sharing a day is an overlap');
  const lanes = packLanes([s(5, 9), s(1, 6), s(7, 8), s(2, 3)]);
  assert.equal(lanes.length, 2);
  for (const lane of lanes) for (let i = 1; i < lane.length; i++) assert.ok(lane[i].start > lane[i - 1].end, 'no overlap inside a line');
  assert.equal(lanes.flat().length, 4, 'nothing is lost');
  assert.deepEqual(packLanes([]), []);
});

test('dragging moves or resizes, never below one day, and stays inside the range', () => {
  const span = { start: 10, end: 14 };
  assert.deepEqual(dragSpan(span, 'move', 3), { start: 13, end: 17 });
  assert.deepEqual(dragSpan(span, 'move', -20, { from: 5, to: 30 }), { start: 5, end: 9 }, 'a move stops at the left edge and keeps its length');
  assert.deepEqual(dragSpan(span, 'move', 40, { from: 5, to: 30 }), { start: 26, end: 30 });
  assert.deepEqual(dragSpan(span, 'start', 2), { start: 12, end: 14 });
  assert.deepEqual(dragSpan(span, 'start', 99), { start: 14, end: 14 }, 'the start cannot pass the end');
  assert.deepEqual(dragSpan(span, 'end', -99), { start: 10, end: 10 }, 'the end cannot pass the start');
  assert.deepEqual(dragSpan(span, 'end', 3), { start: 10, end: 17 });
  assert.equal(spanDays(dragSpan(span, 'end', -99)), 1);
  assert.equal(pixelsToDays(100, 44), 2);
  assert.equal(pixelsToDays(21, 44), 0);
  assert.equal(pixelsToDays(-23, 44), -1);
});

test('month segments cover every day once', () => {
  const from = toDay('2025-12-20');
  const to = toDay('2026-03-05');
  const segs = monthSegments(from, to);
  assert.deepEqual(segs.map(s => s.key), ['2025-12', '2026-01', '2026-02', '2026-03']);
  assert.deepEqual(segs.map(s => s.days), [12, 31, 28, 5]);
  assert.equal(segs.reduce((n, s) => n + s.days, 0), to - from + 1);
  assert.equal(monthSegments(5, 5).length, 1);
});

test('late means open and past due, not waiting for review', () => {
  const today = toDay('2026-03-10');
  assert.equal(isLate(task({ dueDate: '2026-03-09' }), today), true);
  assert.equal(isLate(task({ dueDate: '2026-03-10' }), today), false, 'due today is not late yet');
  assert.equal(isLate(task({ dueDate: '2026-03-09', status: 'in_progress' }), today), true);
  assert.equal(isLate(task({ dueDate: '2026-03-09', status: 'ready_for_review' }), today), false);
  assert.equal(isLate(task({ dueDate: '2026-03-09', status: 'approved' }), today), false);
});

test('rows: one per task in date order, or a block per person with packed lines', () => {
  const tasks = [
    task({ id: 'b', title: 'B', startDate: '2026-03-05', dueDate: '2026-03-08' }),
    task({ id: 'a', title: 'A', startDate: '2026-03-01', dueDate: '2026-03-03' }),
    task({ id: 'c', title: 'C', assignedTo: 'u2', startDate: '2026-03-01', dueDate: '2026-03-09' }),
    task({ id: 'd', title: 'D', assignedTo: 'gone', startDate: '2026-03-01', dueDate: '2026-03-02' }),
  ];
  const members = [user('u1'), user('u2'), user('u3')];

  assert.deepEqual(buildRows(tasks, members, 'task').map(r => r.id), ['d', 'a', 'c', 'b'], 'by start, then by which ends first');

  const rows = buildRows(tasks, members, 'member');
  assert.deepEqual(rows.map(r => `${r.kind}:${r.id}`), [
    'header:h-u1', 'lane:l-u1-0', // u1's two tasks do not overlap, so one line
    'header:h-u2', 'lane:l-u2-0',
    'header:h-u3', // a member with no tasks is still listed
    'header:h-nobody', 'lane:l-nobody-0', // a task whose person is no longer in the group
  ]);
  assert.equal(rows[0].count, 2);
  assert.equal(rows[4].count, 0);
  assert.deepEqual(rows[1].items.map(i => i.task.id), ['a', 'b']);

  const noStray = buildRows([tasks[0]], members, 'member');
  assert.ok(!noStray.some(r => r.id === 'h-nobody'), 'no "nobody" block when every task has a person');
});

test('an old task without a start date still draws, as a one-day bar on its due date', () => {
  const rows = buildRows([task({ startDate: undefined, dueDate: '2026-03-06' })], [user('u1')], 'task');
  assert.equal(rows[0].items[0].start, rows[0].items[0].end);
  const odd = buildRows([task({ startDate: '2026-03-09', dueDate: '2026-03-06' })], [user('u1')], 'task');
  assert.ok(odd[0].items[0].start <= odd[0].items[0].end, 'a start after the due date is clamped, never a negative bar');
});

test('a mistyped far-away date cannot make the chart draw tens of thousands of days', () => {
  const today = toDay('2026-03-10');
  const wild = [{ start: today, end: toDay('2099-01-02') }];
  const r = chartRange(wild, today);
  assert.equal(r.to - r.from + 1, MAX_DAYS);
  assert.ok(r.from <= today && r.to >= today, 'today is still in view');

  const past = chartRange([{ start: toDay('1999-01-01'), end: today }], today);
  assert.equal(past.from, today - 60, 'the window starts a little before today, not in 1999');
  assert.equal(past.to, today + 5);
  assert.ok(past.to - past.from + 1 <= MAX_DAYS);

  // Normal spreads are untouched
  const normal = chartRange([{ start: today - 30, end: today + 90 }], today);
  assert.equal(normal.from, today - 32);
  assert.equal(normal.to, today + 95);
});

test('clipping keeps the part of a bar that is in the window', () => {
  assert.deepEqual(clipSpan({ start: 5, end: 8 }, 0, 20), { start: 5, end: 8, clipped: false });
  assert.deepEqual(clipSpan({ start: -5, end: 8 }, 0, 20), { start: 0, end: 8, clipped: true });
  assert.deepEqual(clipSpan({ start: 15, end: 99 }, 0, 20), { start: 15, end: 20, clipped: true });
  assert.equal(clipSpan({ start: 30, end: 40 }, 0, 20), null, 'wholly outside');
  assert.equal(clipSpan({ start: -9, end: -1 }, 0, 20), null);
  assert.deepEqual(clipSpan({ start: 20, end: 20 }, 0, 20), { start: 20, end: 20, clipped: false }, 'the last day counts');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cardCount, isOverdue, matchesDay, matchesScope, matchesWhen, myBatches } from '../client/src/lib/taskFilters';
import { peekPagePreset, setPagePreset } from '../client/src/lib/pagePreset';
import type { Task } from '../shared/types';

const TODAY = '2026-11-18';
const make = (over: Partial<Task>): Task =>
  ({ id: 'x', title: 'T', module: 'M', description: '', assignedTo: 'me', status: 'todo', priority: 'medium', startDate: '2026-11-10', dueDate: '2026-11-20', progress: 0, ...over }) as Task;
const none = { from: '', to: '' };

test('scope: just me means my own tasks, with my team means the team tasks that include me', () => {
  const tasks = [
    make({ id: 'alone', assignedTo: 'me' }),
    make({ id: 'other', assignedTo: 'you' }),
    make({ id: 't1-me', assignedTo: 'me', batchId: 'b1' }),
    make({ id: 't1-you', assignedTo: 'you', batchId: 'b1' }),
    make({ id: 't2-you', assignedTo: 'you', batchId: 'b2' }),
  ];
  const mine = myBatches(tasks, 'me');
  const pick = (scope: 'all' | 'mine' | 'team') => tasks.filter(t => matchesScope(t, scope, 'me', mine)).map(t => t.id);

  assert.deepEqual([...mine], ['b1']);
  assert.deepEqual(pick('mine'), ['alone'], 'my copy of a team task is not "just me"');
  assert.deepEqual(pick('team'), ['t1-me', 't1-you'], 'the whole team task, not only my part');
  assert.equal(pick('all').length, 5);
});

test('today: it has started, it is not over, and it is not approved', () => {
  const when = (over: Partial<Task>) => matchesWhen(make(over), 'today', TODAY, none);
  assert.equal(when({ startDate: '2026-11-18', dueDate: '2026-11-18' }), true, 'due today');
  assert.equal(when({ startDate: '2026-11-10', dueDate: '2026-11-25' }), true, 'running now');
  assert.equal(when({ startDate: '2026-11-19', dueDate: '2026-11-25' }), false, 'starts tomorrow');
  assert.equal(when({ startDate: '2026-11-01', dueDate: '2026-11-17' }), false, 'ended yesterday');
  assert.equal(when({ status: 'approved' }), false, 'finished work is not for today');
  assert.equal(when({ status: 'ready_for_review' }), true, 'waiting for review is still in view');
});

test('next 7 days covers today and the six days after', () => {
  const when = (startDate: string, dueDate: string) => matchesWhen(make({ startDate, dueDate }), 'week', TODAY, none);
  assert.equal(when('2026-11-24', '2026-11-24'), true, 'the 7th day');
  assert.equal(when('2026-11-25', '2026-11-26'), false, 'the 8th day');
  assert.equal(when('2026-11-01', '2026-11-18'), true);
  assert.equal(when('2026-11-01', '2026-11-17'), false);
});

test('overdue: past the due date and still being worked on', () => {
  assert.equal(isOverdue(make({ dueDate: '2026-11-17' }), TODAY), true);
  assert.equal(isOverdue(make({ dueDate: '2026-11-18' }), TODAY), false, 'due today is not late yet');
  assert.equal(isOverdue(make({ dueDate: '2026-11-17', status: 'in_progress' }), TODAY), true);
  assert.equal(isOverdue(make({ dueDate: '2026-11-17', status: 'ready_for_review' }), TODAY), false, 'handed in on time');
  assert.equal(isOverdue(make({ dueDate: '2026-11-17', status: 'approved' }), TODAY), false);
});

test('a range of dates may be open at one end, and keeps finished work', () => {
  const task = make({ startDate: '2026-11-10', dueDate: '2026-11-20', status: 'approved' });
  const range = (from: string, to: string) => matchesWhen(task, 'range', TODAY, { from, to });
  assert.equal(range('2026-11-15', '2026-11-16'), true, 'inside');
  assert.equal(range('2026-11-20', ''), true, 'from the due date on');
  assert.equal(range('2026-11-21', ''), false);
  assert.equal(range('', '2026-11-09'), false, 'up to before it starts');
  assert.equal(range('', '2026-11-10'), true);
  assert.equal(range('', ''), true, 'no dates means everything');
});

test('a team task counts as one card', () => {
  assert.equal(cardCount([make({ id: 'a', batchId: 'b' }), make({ id: 'b', batchId: 'b' }), make({ id: 'c' })]), 2);
});

test('a daily ToDo has one date: any day, today, or a range', () => {
  const day = (date: string, when: 'any' | 'today' | 'range', range = none) => matchesDay(date, when, TODAY, range);
  assert.equal(day('2026-01-01', 'any'), true);
  assert.equal(day(TODAY, 'today'), true);
  assert.equal(day('2026-11-17', 'today'), false);
  assert.equal(day('2026-11-10', 'range', { from: '2026-11-10', to: '2026-11-12' }), true, 'both ends count');
  assert.equal(day('2026-11-13', 'range', { from: '2026-11-10', to: '2026-11-12' }), false);
  assert.equal(day('2026-11-13', 'range', { from: '2026-11-10', to: '' }), true, 'open at the end');
});

test('a page preset is seen by the page it is for until the next page change', () => {
  assert.equal(peekPagePreset('tasks'), null);
  setPagePreset({ page: 'tasks', scope: 'mine', when: 'today' });
  assert.deepEqual(peekPagePreset('tasks'), { page: 'tasks', scope: 'mine', when: 'today' });
  assert.deepEqual(peekPagePreset('tasks'), peekPagePreset('tasks'), 'a page that renders twice sees it both times');
  assert.equal(peekPagePreset('daily'), null, 'not for another page');
  setPagePreset(null);
  assert.equal(peekPagePreset('tasks'), null);
});

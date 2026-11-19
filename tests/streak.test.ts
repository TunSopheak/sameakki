import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeStreak, milestoneReached, previousDay, rankMembers } from '../shared/streak';

const TODAY = '2026-11-18';

test('days in a row up to today', () => {
  const info = computeStreak(['2026-11-16', '2026-11-17', '2026-11-18'], TODAY);
  assert.deepEqual(info, { current: 3, best: 3, total: 3, postedToday: true });
});

test('the streak is still alive today until the day ends, and breaks after a missed day', () => {
  assert.equal(computeStreak(['2026-11-16', '2026-11-17'], TODAY).current, 2, 'posted yesterday, today is still open');
  assert.equal(computeStreak(['2026-11-16', '2026-11-17'], TODAY).postedToday, false);
  assert.equal(computeStreak(['2026-11-15', '2026-11-16'], TODAY).current, 0, 'a whole day was missed');
  assert.equal(computeStreak([], TODAY).current, 0);
});

test('a gap starts a new streak, and the best run is kept', () => {
  const info = computeStreak(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-17', '2026-11-18'], TODAY);
  assert.equal(info.current, 2);
  assert.equal(info.best, 4);
  assert.equal(info.total, 6);
});

test('several posts on one day count once, and future days never count', () => {
  const info = computeStreak(['2026-11-18', '2026-11-18', '2026-11-18', '2026-11-19', '2026-11-25'], TODAY);
  assert.equal(info.current, 1);
  assert.equal(info.total, 1);
});

test('months and years roll over', () => {
  assert.equal(previousDay('2026-03-01'), '2026-02-28');
  assert.equal(previousDay('2024-03-01'), '2024-02-29');
  assert.equal(previousDay('2026-01-01'), '2025-12-31');
  assert.equal(computeStreak(['2025-12-30', '2025-12-31', '2026-01-01'], '2026-01-01').current, 3);
});

test('ranking: longest streak first, then best run, then days, then name', () => {
  const make = (name: string, current: number, best: number, total: number) => ({ userId: name, name, current, best, total, postedToday: false });
  const ranked = rankMembers([make('Dara', 2, 5, 9), make('Bopha', 5, 5, 5), make('Chan', 2, 5, 12), make('Ann', 2, 5, 12), make('Zed', 0, 0, 0)]);
  assert.deepEqual(ranked.map(m => m.name), ['Bopha', 'Ann', 'Chan', 'Dara', 'Zed']);
});

test('milestones are celebrated once, and the biggest one reached wins', () => {
  assert.equal(milestoneReached(2, 3), 3);
  assert.equal(milestoneReached(3, 4), null);
  assert.equal(milestoneReached(6, 7), 7);
  assert.equal(milestoneReached(0, 8), 7, 'skipping ahead still gives the biggest milestone passed');
  assert.equal(milestoneReached(5, 2), null, 'a lower number is not a milestone');
});

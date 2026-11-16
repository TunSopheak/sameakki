import assert from 'node:assert/strict';
import { test } from 'node:test';
import { monthGrid, shiftDate, weekdayNames } from '../client/src/lib/dates';

test('shiftDate moves across month and year ends', () => {
  assert.equal(shiftDate('2026-11-30', 1), '2026-12-01');
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDate('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftDate('2028-03-01', -1), '2028-02-29', 'leap year');
});

test('monthGrid fills six Monday-first weeks around the month', () => {
  const days = monthGrid(2026, 10); // November 2026 starts on a Sunday
  assert.equal(days.length, 42);
  assert.equal(days[0], '2026-10-26', 'the grid starts on the Monday before the 1st');
  assert.equal(days[6], '2026-11-01');
  assert.equal(days.filter(d => d.startsWith('2026-11')).length, 30);
  assert.equal(new Set(days).size, 42);
  // A month that starts on a Monday has no days from the month before
  assert.equal(monthGrid(2026, 5)[0], '2026-06-01');
});

test('weekday names are seven, Monday first, in both languages', () => {
  assert.equal(weekdayNames('en').length, 7);
  assert.match(weekdayNames('en')[0], /Mon/);
  assert.equal(new Set(weekdayNames('km')).size, 7);
});

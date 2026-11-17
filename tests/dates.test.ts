import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDateLong, formatMonthYear, monthBounds, monthGrid, monthShortNames, shiftDate, shiftMonth, weekdayNames } from '../client/src/lib/dates';

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
  // A month starting on Monday has no days before it
  assert.equal(monthGrid(2026, 5)[0], '2026-06-01');
});

test('weekday names are seven, Monday first, in both languages', () => {
  assert.equal(weekdayNames('en').length, 7);
  assert.match(weekdayNames('en')[0], /Mon/);
  assert.equal(new Set(weekdayNames('km')).size, 7);
});

test('Khmer dates are written out, so they never fall back to English', () => {
  assert.equal(formatDateLong('2026-11-17', 'km'), 'អង្គារ 17 វិច្ឆិកា 2026');
  assert.equal(formatDateLong('2026-11-16', 'km'), 'ច័ន្ទ 16 វិច្ឆិកា 2026');
  assert.equal(formatDateLong('2026-11-22', 'km'), 'អាទិត្យ 22 វិច្ឆិកា 2026');
  assert.equal(formatMonthYear(2026, 0, 'km'), 'មករា 2026');
  assert.equal(monthShortNames('km').length, 12);
  assert.equal(new Set(monthShortNames('km')).size, 12);
});

test('shiftMonth keeps the day inside the new month', () => {
  assert.equal(shiftMonth('2026-03-31', -1), '2026-02-28');
  assert.equal(shiftMonth('2026-01-15', 1), '2026-02-15');
  assert.equal(shiftMonth('2026-12-10', 1), '2027-01-10');
});

test('monthBounds gives the first and last day', () => {
  assert.deepEqual(monthBounds(2026, 1), { first: '2026-02-01', last: '2026-02-28' });
  assert.deepEqual(monthBounds(2028, 1), { first: '2028-02-01', last: '2028-02-29' });
});

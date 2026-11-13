import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRawLogContent } from '../shared/dailyLogParser';

test('first line is the title, other lines are items', () => {
  const { title, items } = parseRawLogContent('Website\n- fix header\n- add footer');
  assert.equal(title, 'Website');
  assert.deepEqual(items.map(i => i.text), ['fix header', 'add footer']);
});

test('reads progress tags', () => {
  const { items } = parseRawLogContent('Web\n- charts - 80%\n- login (40%)');
  assert.deepEqual(items.map(i => i.progressTag), ['80%', '40%']);
  assert.deepEqual(items.map(i => i.text), ['charts', 'login']);
});

test('[x] and 100% mark an item as done', () => {
  const { items } = parseRawLogContent('Web\n- [x] fix bug\n- deploy - 100%\n- write docs');
  assert.deepEqual(items.map(i => i.done), [true, true, false]);
});

test('numbered and bulleted lines are cleaned', () => {
  const { items } = parseRawLogContent('Web\n1. first\n* second');
  assert.deepEqual(items.map(i => i.text), ['first', 'second']);
});

test('empty text gives a default title and no items', () => {
  assert.deepEqual(parseRawLogContent('  \n '), { title: 'Daily Update', items: [] });
});

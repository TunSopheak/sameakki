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

test('the heading is optional: only "-" lines are tasks', () => {
  const { title, items } = parseRawLogContent('- fix header\n- add footer');
  assert.equal(title, 'Daily Update');
  assert.deepEqual(items.map(i => i.text), ['fix header', 'add footer']);
});

test('more headings group the tasks below them', () => {
  const { title, items } = parseRawLogContent('Final project\nWebsite\n- login\n- footer\nMobile app\n- home');
  assert.equal(title, 'Final project');
  assert.deepEqual(items.map(i => i.group), ['Website', 'Website', 'Mobile app']);
  assert.deepEqual(items.map(i => i.text), ['login', 'footer', 'home']);
});

test('plain lines with no "-" after the title are still tasks', () => {
  const { items } = parseRawLogContent('Web\nfix bug\nadd footer');
  assert.deepEqual(items.map(i => i.text), ['fix bug', 'add footer']);
});

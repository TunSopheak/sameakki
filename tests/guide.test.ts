import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRawLogContent } from '../shared/dailyLogParser';
import { guide } from '../client/src/locales/guide';

// How much of a text the app understands
const understood = (text: string) => {
  const { items } = parseRawLogContent(text);
  return items.length + items.filter(i => i.progressTag).length + items.filter(i => i.done).length;
};

for (const language of ['km', 'en'] as const) {
  test(`guide (${language}): the ToDo examples work as the text says`, () => {
    const sections = guide[language].sections;
    const daily = sections.find(s => s.id === 'daily')!;

    const { title, items } = parseRawLogContent(daily.example!);
    assert.ok(title.length > 0);
    assert.equal(items.length, 3);
    assert.equal(items[0].progressTag, '80%');
    assert.equal(items[1].done, true, '[x] marks a task as done');
    assert.notEqual(items[2].group, items[0].group, 'a second main point starts a new group');

    for (const mistake of daily.mistakes!) {
      assert.ok(understood(mistake.right) > understood(mistake.wrong), `"${mistake.right.split('\n')[0]}" is read better than "${mistake.wrong.split('\n')[0]}"`);
    }
  });

  test(`guide (${language}): both languages have the same sections`, () => {
    assert.deepEqual(
      guide[language].sections.map(s => s.id),
      guide.en.sections.map(s => s.id)
    );
  });
}

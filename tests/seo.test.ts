import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { landing } from '../client/src/locales/landing';

const html = readFileSync(new URL('../client/index.html', import.meta.url), 'utf8');

for (const language of ['km', 'en'] as const) {
  test(`SEO (${language}): title and description are a good length and name the product`, () => {
    const { title, description } = landing[language].meta;
    assert.ok(title.length >= 20 && title.length <= 80, `title is ${title.length} characters`);
    assert.ok(description.length >= 70 && description.length <= 200, `description is ${description.length} characters`);
    assert.match(title, /Sameakki/);
    assert.match(title + description, /ToDo/);
    assert.match(title, /សាមគ្គី/);
  });
}

test('SEO: the page has the tags search and sharing need', () => {
  for (const tag of ['<title>', 'name="description"', 'rel="canonical"', 'property="og:title"', 'property="og:image"', 'name="twitter:card"', 'rel="manifest"', 'application/ld+json']) {
    assert.ok(html.includes(tag), `index.html has ${tag}`);
  }
  assert.ok(html.includes('<h1>'), 'the no-script text has a heading');
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(blocks.length >= 2);
  for (const [, json] of blocks) assert.doesNotThrow(() => JSON.parse(json.replaceAll('__ORIGIN__', 'https://example.com')));
});

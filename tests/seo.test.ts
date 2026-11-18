import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { landing } from '../client/src/locales/landing';
import { GUIDE_PATHS, escapeHtml, jsonLd, renderGuidePage, renderSitemap } from '../server/seo/guidePage';

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

for (const language of ['km', 'en'] as const) {
  test(`SEO guide page (${language}): readable without scripts and complete for search engines`, () => {
    const page = renderGuidePage(language, 'https://example.com');
    assert.ok(page.includes(`<html lang="${language}">`));
    assert.ok(page.includes(`<link rel="canonical" href="https://example.com${GUIDE_PATHS[language]}">`));
    for (const hreflang of ['km', 'en', 'x-default']) assert.ok(page.includes(`hreflang="${hreflang}"`), `has hreflang ${hreflang}`);
    assert.equal((page.match(/<h1>/g) ?? []).length, 1, 'exactly one h1');
    assert.ok(!page.includes('<script src'), 'no script files needed');
    assert.ok(page.includes('ToDo'));

    const blocks = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    assert.deepEqual(blocks.map(b => b['@type']).sort(), ['BreadcrumbList', 'FAQPage', 'HowTo', 'TechArticle']);
  });
}

test('SEO: text is escaped so a page can never break out of its tags', () => {
  assert.equal(escapeHtml(`<b onclick="x">&'`), '&lt;b onclick=&quot;x&quot;&gt;&amp;&#39;');
  assert.ok(!jsonLd({ a: '</script><script>alert(1)</script>' }).includes('</script>'));
});

test('SEO: the sitemap lists the home page and both guides with their translations', () => {
  const xml = renderSitemap('https://example.com', '2026-01-01');
  for (const loc of ['https://example.com/', 'https://example.com/guide', 'https://example.com/en/guide']) assert.ok(xml.includes(`<loc>${loc}</loc>`), loc);
  assert.ok(xml.includes('hreflang="x-default"'));
  assert.ok(xml.includes('<lastmod>2026-01-01</lastmod>'));
});

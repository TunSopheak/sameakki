import assert from 'node:assert/strict';
import { test } from 'node:test';
import { guide } from '../client/src/locales/guide';
import { translations } from '../client/src/locales/translations';

// Words the guide quotes that are not a button or page in translations.ts
const OTHER = {
  km: ['ខ្មែរ', 'English', 'ចំណុចគោល', 'ម្នាក់', 'ជ្រើសរើស', 'ទាំងអស់គ្នា', 'Poke', 'ភ្ជាប់ Telegram', 'ដំឡើងកម្មវិធី'],
  en: ['ខ្មែរ', 'English', 'main point', 'Poke', 'Install the software'],
};

const clean = (text: string) => text.replace(/\s+/g, ' ').trim().toLowerCase();

for (const language of ['km', 'en'] as const) {
  test(`guide (${language}): every button or page it names is written as the app shows it`, () => {
    const known = [...Object.values(translations[language]), ...OTHER[language]].map(value => clean(String(value)));
    const quote = language === 'km' ? /«([^»]+)»/g : /"([^"\n]+)"/g;

    const texts: string[] = [];
    for (const section of guide[language].sections) {
      texts.push(section.title, section.intro ?? '', ...(section.steps ?? []), ...(section.tips ?? []));
      for (const item of section.faq ?? []) texts.push(item.q, item.a);
      for (const item of section.mistakes ?? []) texts.push(item.why);
    }

    const unknown = new Set<string>();
    for (const text of texts) {
      for (const [, name] of text.matchAll(quote)) {
        const term = clean(name);
        // Things people type (such as "- 80%" or "1.") are not labels
        if (/^[-\d%()[\]x. +]+$/.test(term)) continue;
        if (!known.some(value => value === term || value.includes(term))) unknown.add(name);
      }
    }
    assert.deepEqual([...unknown], [], 'these names are not in translations.ts');
  });

  test(`guide (${language}): sentences end with a full stop`, () => {
    const stop = language === 'km' ? /[។?!)]$/ : /[.?!)]$/;
    for (const section of guide[language].sections) {
      for (const text of [section.intro ?? '', ...(section.steps ?? []), ...(section.tips ?? []), ...(section.faq ?? []).flatMap(f => [f.a]), ...(section.mistakes ?? []).map(m => m.why)]) {
        if (text) assert.ok(stop.test(text.trim()), `"${text.slice(0, 50)}" has no full stop`);
      }
    }
  });
}

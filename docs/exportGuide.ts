// Writes docs/user-guide.km.md and docs/user-guide.en.md from client/src/locales/guide.ts
import { writeFileSync } from 'node:fs';
import { guide, type GuideCopy } from '../client/src/locales/guide';

const quote = (text: string) => text.split('\n').map(line => `> ${line}`).join('\n');

const toMarkdown = (copy: GuideCopy) => {
  const lines: string[] = [`# ${copy.title}`, '', copy.subtitle, '', `**${copy.onThisPage}**`, ''];
  copy.sections.forEach((section, i) => lines.push(`${i + 1}. [${section.title}](#${section.id})`));

  copy.sections.forEach((section, i) => {
    lines.push('', `<a id="${section.id}"></a>`, `## ${i + 1}. ${section.title}`, '');
    if (section.intro) lines.push(section.intro, '');
    section.steps?.forEach((step, n) => lines.push(`${n + 1}. ${step}`));
    if (section.steps) lines.push('');
    if (section.example) lines.push(`**${copy.exampleLabel}**`, '', '```', section.example, '```', '');
    section.mistakes?.forEach(item => {
      lines.push(`**${copy.wrong}**`, '', '```', item.wrong, '```', '', `**${copy.right}**`, '', '```', item.right, '```', '', item.why, '');
    });
    section.faq?.forEach(item => lines.push(`**${item.q}**`, '', item.a, ''));
    section.tips?.forEach(tip => lines.push(quote(`**${copy.tipLabel}:** ${tip}`), ''));
  });

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
};

for (const language of ['km', 'en'] as const) {
  writeFileSync(new URL(`./user-guide.${language}.md`, import.meta.url), toMarkdown(guide[language]));
}
console.log('Wrote docs/user-guide.km.md and docs/user-guide.en.md');

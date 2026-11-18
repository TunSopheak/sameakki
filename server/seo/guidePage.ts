// Public, search-friendly pages. The app itself is a single-page app, so these are plain HTML
// that search engines can read without running any script. The text comes from the same
// guide file as the in-app Guide, so the two can never disagree.
import { guide, type GuideCopy, type GuideSection } from '../../client/src/locales/guide';

export type SeoLanguage = 'km' | 'en';

export const GUIDE_PATHS: Record<SeoLanguage, string> = { km: '/guide', en: '/en/guide' };

const BRAND = '#840015';

const TEXT = {
  km: {
    title: 'របៀបសរសេរ ToDo ប្រចាំថ្ងៃ និងប្រើ សាមគ្គី (Sameakki) - ការណែនាំជាជំហានៗ',
    description:
      'ការណែនាំជាភាសាខ្មែរ៖ របៀបសរសេរ ToDo ប្រចាំថ្ងៃ ចាត់កិច្ចការ តាមដានវឌ្ឍនភាព និងអនុម័តការងារក្នុងសាមគ្គី។ មានឧទាហរណ៍ និងកំហុសដែលត្រូវជៀសវាង។',
    open: 'បើកសាមគ្គី',
    home: 'ទំព័រដើម',
    switchTo: 'English',
    lang: 'km',
    locale: 'km_KH',
    other: 'en_US',
    howToName: 'របៀបសរសេរ ToDo ប្រចាំថ្ងៃ',
    cta: 'ត្រៀមខ្លួនរួចហើយ? សាកល្បងមើលដោយមិនចាំបាច់ចុះឈ្មោះ។',
  },
  en: {
    title: 'How to write a daily ToDo and use Sameakki - Step-by-step guide',
    description:
      'Step-by-step guide to Sameakki: write a daily ToDo with tasks and progress, assign tasks, track deadlines and approve work. With examples and common mistakes.',
    open: 'Open Sameakki',
    home: 'Home',
    switchTo: 'ខ្មែរ',
    lang: 'en',
    locale: 'en_US',
    other: 'km_KH',
    howToName: 'How to write a daily ToDo',
    cta: 'Ready? Try it without signing up.',
  },
} as const;

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, ch => ESCAPES[ch]);

/** JSON for a <script> tag: "<" is escaped so the text can never close the tag. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

const paragraphs = (value: string) => escapeHtml(value).replace(/\n/g, '<br>');

const sectionHtml = (section: GuideSection, number: number, copy: GuideCopy) => {
  const parts: string[] = [`<section id="${section.id}">`, `<h2><span class="num">${number}</span>${escapeHtml(section.title)}</h2>`];
  if (section.intro) parts.push(`<p>${escapeHtml(section.intro)}</p>`);
  if (section.steps) parts.push(`<ol class="steps">${section.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol>`);
  if (section.example) parts.push(`<h3>${escapeHtml(copy.exampleLabel)}</h3><pre>${paragraphs(section.example)}</pre>`);
  section.mistakes?.forEach(item => {
    parts.push(
      `<div class="pair"><div class="bad"><b>${escapeHtml(copy.wrong)}</b><pre>${paragraphs(item.wrong)}</pre></div>` +
        `<div class="good"><b>${escapeHtml(copy.right)}</b><pre>${paragraphs(item.right)}</pre></div></div><p class="why">${escapeHtml(item.why)}</p>`
    );
  });
  section.faq?.forEach(item => parts.push(`<h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p>`));
  section.tips?.forEach(tip => parts.push(`<p class="tip"><b>${escapeHtml(copy.tipLabel)}:</b> ${escapeHtml(tip)}</p>`));
  parts.push('</section>');
  return parts.join('');
};

const CSS = `
:root{color-scheme:light dark;--bg:#fafafa;--card:#fff;--text:#111;--muted:#525252;--line:#e5e5e5;--brand:${BRAND};--soft:#fdf0f2;--link:${BRAND}}
@media (prefers-color-scheme:dark){:root{--bg:#120b0c;--card:#1b1213;--text:#f5f5f5;--muted:#b4a9aa;--line:#33282a;--soft:#2a1519;--link:#ff8fa3}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.7 "Kantumruy Pro",Inter,system-ui,sans-serif}
a{color:var(--link)}
.wrap{max-width:46rem;margin:0 auto;padding:0 16px 56px}
header.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 0}
.brand{font-weight:700;text-decoration:none;color:var(--text)}
.lang{border:1px solid var(--line);border-radius:10px;padding:6px 12px;text-decoration:none;font-size:14px;background:var(--card)}
h1{font-size:1.75rem;line-height:1.3;margin:8px 0}
.sub{color:var(--muted);margin:0 0 20px}
nav.toc{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
nav.toc a{border:1px solid var(--line);background:var(--card);border-radius:999px;padding:4px 12px;font-size:14px;text-decoration:none;color:var(--text)}
section{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;margin-bottom:20px}
h2{font-size:1.25rem;margin:0 0 8px;display:flex;align-items:center;gap:10px}
h3{font-size:1rem;margin:18px 0 4px}
.num{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:var(--brand);color:#fff;font-size:14px;flex:none}
.steps{padding-left:22px}.steps li{margin:6px 0}
pre{margin:6px 0;white-space:pre-wrap;word-break:break-word;font:inherit;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px 12px}
.pair{display:grid;gap:8px;grid-template-columns:1fr 1fr;margin-top:12px}
@media (max-width:560px){.pair{grid-template-columns:1fr}}
.good pre{background:var(--soft);border-color:var(--brand)}
.why{color:var(--muted);font-size:14px;margin:4px 0 0}
.tip{background:var(--soft);border-radius:10px;padding:8px 12px;font-size:14px}
.cta{text-align:center;margin:32px 0}
.cta a.btn{display:inline-block;background:var(--brand);color:#fff;text-decoration:none;font-weight:600;border-radius:10px;padding:12px 24px}
footer{color:var(--muted);font-size:13px;text-align:center}
`;

/** The full HTML of the guide in one language. `origin` is the site address, such as https://example.com */
export const renderGuidePage = (language: SeoLanguage, origin: string): string => {
  const text = TEXT[language];
  const copy = guide[language];
  const url = `${origin}${GUIDE_PATHS[language]}`;
  const other: SeoLanguage = language === 'km' ? 'en' : 'km';
  const image = `${origin}/og-image.png`;

  const daily = copy.sections.find(s => s.id === 'daily');
  const help = copy.sections.find(s => s.id === 'help');

  const structured: unknown[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: text.title,
      description: text.description,
      inLanguage: text.lang,
      url,
      image,
      author: { '@type': 'Person', name: 'Tun Sopheak' },
      publisher: { '@type': 'Organization', name: 'Sameakki', url: `${origin}/` },
      mainEntityOfPage: url,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Sameakki', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: copy.title, item: url },
      ],
    },
  ];
  if (daily?.steps) {
    structured.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: text.howToName,
      inLanguage: text.lang,
      step: daily.steps.map((step, i) => ({ '@type': 'HowToStep', position: i + 1, text: step })),
    });
  }
  if (help?.faq) {
    structured.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: text.lang,
      mainEntity: help.faq.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
    });
  }

  return `<!doctype html>
<html lang="${text.lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(text.title)}</title>
<meta name="description" content="${escapeHtml(text.description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="${BRAND}">
<link rel="canonical" href="${escapeHtml(url)}">
<link rel="alternate" hreflang="km" href="${escapeHtml(origin + GUIDE_PATHS.km)}">
<link rel="alternate" hreflang="en" href="${escapeHtml(origin + GUIDE_PATHS.en)}">
<link rel="alternate" hreflang="x-default" href="${escapeHtml(origin + GUIDE_PATHS.km)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3">
<link rel="manifest" href="/manifest.webmanifest">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Sameakki">
<meta property="og:title" content="${escapeHtml(text.title)}">
<meta property="og:description" content="${escapeHtml(text.description)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:locale" content="${text.locale}">
<meta property="og:locale:alternate" content="${text.other}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(text.title)}">
<meta name="twitter:description" content="${escapeHtml(text.description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
${structured.map(data => `<script type="application/ld+json">${jsonLd(data)}</script>`).join('\n')}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Kantumruy+Pro:wght@300..700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<header class="top">
<a class="brand" href="/">Sameakki សាមគ្គី</a>
<a class="lang" href="${GUIDE_PATHS[other]}" hreflang="${other}" lang="${other}">${text.switchTo}</a>
</header>
<main>
<h1>${escapeHtml(copy.title)}</h1>
<p class="sub">${escapeHtml(copy.subtitle)}</p>
<nav class="toc" aria-label="${escapeHtml(copy.onThisPage)}">${copy.sections.map((s, i) => `<a href="#${s.id}">${i + 1}. ${escapeHtml(s.title)}</a>`).join('')}</nav>
${copy.sections.map((s, i) => sectionHtml(s, i + 1, copy)).join('\n')}
<div class="cta"><p>${escapeHtml(text.cta)}</p><a class="btn" href="/">${escapeHtml(text.open)}</a></div>
</main>
<footer><a href="/">${escapeHtml(text.home)}</a> · <a href="${GUIDE_PATHS[other]}" hreflang="${other}">${text.switchTo}</a> · © ${new Date().getFullYear()} Sameakki</footer>
</div>
</body>
</html>
`;
};

/** sitemap.xml with the home page and both guides, each pointing to its translation. */
export const renderSitemap = (origin: string, lastmod: string): string => {
  const guideLinks = (['km', 'en'] as const)
    .map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${origin}${GUIDE_PATHS[l]}"/>`)
    .concat(`<xhtml:link rel="alternate" hreflang="x-default" href="${origin}${GUIDE_PATHS.km}"/>`)
    .join('');
  const entry = (loc: string, priority: string, extra = '') =>
    `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority>${extra}</url>`;

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">` +
    entry(`${origin}/`, '1.0') +
    entry(`${origin}${GUIDE_PATHS.km}`, '0.8', guideLinks) +
    entry(`${origin}${GUIDE_PATHS.en}`, '0.8', guideLinks) +
    `</urlset>`
  );
};

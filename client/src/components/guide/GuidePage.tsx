import React from 'react';
import { useApp } from '../../context/AppContext';
import { guide } from '../../locales/guide';
import { GuideSectionCard } from './GuideSectionCard';

const jumpTo = (id: string) => document.getElementById(`guide-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** Step by step guide for new people. */
export const GuidePage: React.FC = () => {
  const { language } = useApp();
  const copy = guide[language];

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-black">{copy.title}</h1>
        <p className="mt-1.5 text-sm text-neutral-600">{copy.subtitle}</p>
      </header>

      <nav aria-label={copy.onThisPage} className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto bg-white px-1 py-2.5 [scrollbar-width:none]">
        {copy.sections.map((section, i) => (
          <button
            key={section.id}
            type="button"
            onClick={() => jumpTo(section.id)}
            className="shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:border-brand hover:text-brand-ink"
          >
            {i + 1}. {section.title}
          </button>
        ))}
      </nav>

      {copy.sections.map((section, i) => (
        <GuideSectionCard key={section.id} section={section} number={i + 1} copy={copy} />
      ))}
    </div>
  );
};

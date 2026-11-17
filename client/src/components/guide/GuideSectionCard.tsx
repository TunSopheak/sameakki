import React from 'react';
import type { GuideCopy, GuideSection } from '../../locales/guide';
import { Icons } from '../icons';
import { GuideExample } from './GuideExample';
import { GuideMistakes } from './GuideMistakes';

interface GuideSectionCardProps {
  section: GuideSection;
  number: number;
  copy: GuideCopy;
}

export const GuideSectionCard: React.FC<GuideSectionCardProps> = ({ section, number, copy }) => (
  <section id={`guide-${section.id}`} className="scroll-mt-24 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs sm:p-6">
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{number}</span>
      <h2 className="text-lg font-bold tracking-tight text-black">{section.title}</h2>
    </div>
    {section.intro && <p className="mt-3 text-sm leading-relaxed text-neutral-700">{section.intro}</p>}

    {section.steps && (
      <ol className="mt-4 space-y-2.5">
        {section.steps.map((step, i) => (
          <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-black">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-bold text-neutral-700">{i + 1}</span>
            <span className="min-w-0 flex-1">{step}</span>
          </li>
        ))}
      </ol>
    )}

    {section.example && (
      <div className="mt-5">
        <p className="mb-2 text-xs font-bold text-neutral-600">{copy.exampleLabel}</p>
        <GuideExample text={section.example} />
      </div>
    )}

    {section.mistakes && (
      <div className="mt-5">
        <GuideMistakes items={section.mistakes} wrongLabel={copy.wrong} rightLabel={copy.right} />
      </div>
    )}

    {section.faq && (
      <div className="mt-4 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {section.faq.map(item => (
          <details key={item.q} className="group px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-black">
              {item.q}
              <Icons.expand className="size-4 shrink-0 text-neutral-500 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">{item.a}</p>
          </details>
        ))}
      </div>
    )}

    {section.tips?.map(tip => (
      <p key={tip} className="mt-4 flex items-start gap-2 rounded-lg bg-neutral-100 px-3 py-2.5 text-xs leading-relaxed text-neutral-800">
        <Icons.tip className="mt-0.5 size-3.5 shrink-0 text-brand-ink" />
        <span>
          <span className="font-bold">{copy.tipLabel}: </span>
          {tip}
        </span>
      </p>
    ))}
  </section>
);

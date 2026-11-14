import React from 'react';
import { Bell, FileText, Users } from 'lucide-react';
import { useLanding } from './hooks';
import { Reveal, Section, SectionTitle } from './ui';

const ICONS = [Users, Bell, FileText];

/** The three problems every student knows, in one panel. */
export const ProblemsSection: React.FC = () => {
  const { copy } = useLanding();
  return (
    <Section>
      <SectionTitle>{copy.problems.title}</SectionTitle>
      <Reveal delay={120} className="mt-12">
        <div className="grid divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white md:grid-cols-3 md:divide-x md:divide-y-0">
          {copy.problems.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <div key={item.title} className="group p-7 transition-colors duration-300 hover:bg-brand-soft/60">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-base font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      </Reveal>
    </Section>
  );
};

import React from 'react';
import { Bell, CalendarClock, Check, ClipboardCheck, MessageSquare, Smartphone } from 'lucide-react';
import { useLanding } from './hooks';
import { Reveal, Section, SectionTitle } from './ui';

const ICONS = [ClipboardCheck, CalendarClock, Check, Bell, MessageSquare, Smartphone];

export const FeaturesSection: React.FC = () => {
  const { copy } = useLanding();
  return (
    <Section id="features">
      <SectionTitle>{copy.features.title}</SectionTitle>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {copy.features.items.map((item, i) => {
          const Icon = ICONS[i];
          return (
            <Reveal key={item.title} delay={(i % 3) * 110}>
              <div className="lp-lift group h-full rounded-2xl border border-transparent p-5 hover:border-neutral-200 hover:bg-white">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand transition-all duration-300 group-hover:scale-110 group-hover:bg-brand group-hover:text-white">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-sm font-bold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{item.text}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
};

import React from 'react';
import { BellRing, Heart, QrCode, Rocket, Send, Smartphone, Users } from 'lucide-react';
import type { LandingSettings, Sponsor } from '@shared/landing';
import { telegramLink } from '../../lib/contact';
import { useLanding } from './hooks';
import { Button, Reveal, Section } from './ui';

const ROADMAP_ICONS = [BellRing, QrCode, Smartphone, Users];

const SponsorChip: React.FC<{ sponsor: Sponsor }> = ({ sponsor }) => {
  const className = 'rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold transition-colors';
  return sponsor.url ? (
    <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className={`${className} hover:bg-brand-soft hover:text-brand`}>
      {sponsor.name}
    </a>
  ) : (
    <span className={className}>{sponsor.name}</span>
  );
};

/** An invitation to help the project grow: what is planned next, what sponsors receive, and who already did. */
export const SponsorSection: React.FC<{ settings: LandingSettings; ready: boolean }> = ({ settings, ready }) => {
  const { copy } = useLanding();
  const { sponsor } = copy;

  return (
    <Section>
      <Reveal>
        <div className="rounded-2xl border border-neutral-200 bg-white p-7 sm:p-12">
          <div className="grid gap-10 md:grid-cols-2 md:gap-14">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
                <Rocket className="size-3.5" />
                {sponsor.eyebrow}
              </p>
              <h2 className="mt-3 text-2xl font-bold leading-snug tracking-tight">{sponsor.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">{sponsor.text}</p>

              <ul className="mt-6 space-y-2.5">
                {sponsor.benefits.map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-800">
                    <Heart className="mt-0.5 size-4 shrink-0 text-brand" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button icon={Send} href={telegramLink(sponsor.message)}>
                  {sponsor.cta}
                </Button>
              </div>
            </div>

            <div className="md:border-l md:border-neutral-200 md:pl-14">
              <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">{sponsor.roadmapTitle}</h3>
              <ul className="mt-5 space-y-2">
                {sponsor.roadmap.map((item, i) => {
                  const Icon = ROADMAP_ICONS[i];
                  return (
                    <li key={item.title} className="group flex items-start gap-4 rounded-xl p-3 transition-all duration-300 hover:translate-x-1 hover:bg-neutral-50">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand transition-all duration-300 group-hover:bg-brand group-hover:text-white">
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-neutral-600">{item.text}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {ready && settings.sponsors.length > 0 && (
            <div className="mt-10 border-t border-neutral-200 pt-8 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{sponsor.sponsorsTitle}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {settings.sponsors.map(s => (
                  <SponsorChip key={s.name} sponsor={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      </Reveal>
    </Section>
  );
};

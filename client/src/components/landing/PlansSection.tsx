import React from 'react';
import { Check, Users } from 'lucide-react';
import type { LandingSettings, PriceTerm } from '@shared/landing';
import { useLanding } from './hooks';
import { Button, Reveal, Section, SectionTitle } from './ui';

import { Icons } from '../icons';

interface Plan {
  id: 'demo' | 'student';
  price: string;
  note?: { km: string; en: string };
  term: PriceTerm | 'custom';
  maxMembers?: number;
  highlighted?: boolean;
}

const PlanCard: React.FC<{ plan: Plan }> = ({ plan }) => {
  const { copy, language, enterDemo, contactHref, signedIn } = useLanding();
  const text = copy.pricing.plans[plan.id];
  const isDemo = plan.id === 'demo';
  const term = { semester: copy.pricing.perSemester, month: copy.pricing.perMonth, year: copy.pricing.perYear, custom: '' }[plan.term];
  const note = plan.note?.[language];

  return (
    <div
      className={`lp-lift relative flex flex-col rounded-2xl bg-white p-7 ${
        plan.highlighted ? 'lp-glow border-2 border-brand md:py-10' : 'border border-neutral-200'
      }`}
    >
      {text.badge && (
        <span className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">{text.badge}</span>
      )}
      <h3 className="text-lg font-bold">{text.name}</h3>
      <p className="mt-1 text-sm text-neutral-500">{text.description}</p>

      <div className="mt-6">
        {isDemo ? (
          <span className="text-4xl font-bold tracking-tight">0</span>
        ) : plan.price ? (
          <>
            <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
            <span className="ml-2 text-sm text-neutral-500">{term}</span>
          </>
        ) : (
          <span className="text-base font-semibold text-neutral-600">{copy.pricing.askPrice}</span>
        )}
      </div>
      {note && plan.price && <p className="mt-2 text-xs leading-relaxed text-neutral-500">{note}</p>}
      {plan.maxMembers && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-ink">
          <Users className="size-3.5" />
          {copy.pricing.upTo(plan.maxMembers)}
        </p>
      )}

      <ul className="mt-6 flex-1 space-y-3">
        {text.points.map(point => (
          <li key={point} className="flex items-start gap-2.5 text-sm text-neutral-700">
            <Check className="mt-0.5 size-4 shrink-0 text-brand-ink" />
            {point}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {isDemo ? (
          !signedIn && (
            <Button variant="secondary" icon={Icons.demo} onClick={enterDemo} fullWidth>
              {text.cta}
            </Button>
          )
        ) : (
          <Button icon={Icons.send} href={contactHref} fullWidth>
            {text.cta}
          </Button>
        )}
      </div>
    </div>
  );
};

interface PlansSectionProps {
  settings: LandingSettings;
  ready: boolean;
}

export const PlansSection: React.FC<PlansSectionProps> = ({ settings, ready }) => {
  const { copy } = useLanding();

  const plans: Plan[] = [
    { id: 'demo', price: '', term: 'custom' },
    {
      id: 'student',
      price: settings.studentPrice,
      note: { km: settings.studentNoteKm, en: settings.studentNoteEn },
      term: settings.studentTerm,
      maxMembers: settings.maxMembers,
      highlighted: true,
    },
  ];

  return (
    <Section id="pricing">
      <SectionTitle subtitle={copy.pricing.subtitle}>{copy.pricing.title}</SectionTitle>
      {ready && settings.pilotOffer && (
        <p className="mx-auto mt-5 max-w-xl rounded-lg bg-brand-soft p-3 text-center text-xs font-semibold text-brand-ink">{copy.pricing.pilot}</p>
      )}

      {!ready ? (
        <div className="mx-auto mt-14 h-[30rem] max-w-3xl" />
      ) : (
        <div className="mx-auto mt-14 grid max-w-3xl gap-6 md:grid-cols-2 md:items-center">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 150}>
              <PlanCard plan={plan} />
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
};

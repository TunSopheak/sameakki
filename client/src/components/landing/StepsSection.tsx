import React, { type CSSProperties } from 'react';
import { useInView, useLanding } from './hooks';
import { Reveal, Section, SectionTitle } from './ui';

/** Three numbered steps. The numbers pop in one after another. */
export const StepsSection: React.FC = () => {
  const { copy } = useLanding();
  const [ref, inView] = useInView<HTMLOListElement>(0.3);
  const steps = copy.steps.items;

  return (
    <Section>
      <SectionTitle>{copy.steps.title}</SectionTitle>
      <ol ref={ref} className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
        {steps.map((item, i) => (
          <li key={item.title} className="flex gap-4 md:block">
            <span
              data-in={inView}
              className="lp-pop flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-base font-bold text-white shadow-lg shadow-brand/25"
              style={{ '--d': `${i * 180}ms` } as CSSProperties}
            >
              {i + 1}
            </span>
            <Reveal delay={i * 180 + 120}>
              <h3 className="text-base font-bold md:mt-5">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.text}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
};

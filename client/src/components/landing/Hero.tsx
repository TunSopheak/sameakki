import React from 'react';
import { CtaButtons } from './CtaButtons';
import { useLanding } from './hooks';
import { SampleBoard } from './SampleBoard';
import { Reveal } from './ui';

export const Hero: React.FC = () => {
  const { copy } = useLanding();
  const { hero } = copy;

  return (
    <section className="relative grid items-center gap-14 pt-6 sm:pt-14 lg:grid-cols-2 lg:gap-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-32 -z-10 h-[36rem]">
        <span className="lp-blob -left-10 top-16 size-72 bg-brand/15" />
        <span className="lp-blob lp-blob--slow right-0 top-32 size-80 bg-brand/10" />
      </div>

      <div className="text-center lg:text-left">
        <Reveal>
          <p className="text-xs font-semibold tracking-wide text-brand-ink">{hero.eyebrow}</p>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-6xl sm:leading-tight">
            {hero.title}
            <span className="block text-brand-ink">{hero.highlight}</span>
          </h1>
        </Reveal>
        <Reveal delay={220}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg lg:mx-0">{hero.subtitle}</p>
        </Reveal>
        <Reveal delay={340} className="mt-10">
          <CtaButtons align="start" />
          <p className="mt-4 text-xs text-neutral-500">{hero.exploreHint}</p>
        </Reveal>
      </div>

      <SampleBoard />
    </section>
  );
};

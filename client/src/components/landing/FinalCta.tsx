import React from 'react';
import { CtaButtons } from './CtaButtons';
import { useLanding } from './hooks';
import { Reveal, Section } from './ui';

// Fixed hex colours: the "white" token turns dark in dark mode
export const FinalCta: React.FC = () => {
  const { copy } = useLanding();
  return (
    <Section>
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#840015] to-[#66000f] px-6 py-14 text-center shadow-xl sm:px-12 sm:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <span className="lp-blob -left-10 -top-10 size-64 bg-[#ffffff1a]" />
            <span className="lp-blob lp-blob--slow -bottom-16 right-0 size-72 bg-[#ffffff14]" />
          </div>
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-2xl font-bold leading-snug tracking-tight text-[#ffffff] sm:text-4xl sm:leading-snug">{copy.final.title}</h2>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[#ffffffe6] sm:text-base">{copy.final.text}</p>
            <div className="mt-9">
              <CtaButtons onBrand />
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
};

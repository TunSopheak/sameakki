import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanding } from './hooks';
import { Reveal, Section, SectionTitle } from './ui';

interface FaqItemProps {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer, open, onToggle }) => (
  <div className="group">
    <button
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-sm font-semibold transition-colors hover:bg-neutral-50"
    >
      {question}
      <ChevronDown className={`size-4 shrink-0 text-neutral-400 transition-transform duration-300 ${open ? 'rotate-180 text-brand' : ''}`} />
    </button>
    <div className="lp-accordion" data-open={open}>
      <div>
        <p className="px-6 pb-5 text-sm leading-relaxed text-neutral-600">{answer}</p>
      </div>
    </div>
  </div>
);

export const FaqSection: React.FC = () => {
  const { copy } = useLanding();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section id="faq" className="mx-auto max-w-2xl">
      <SectionTitle>{copy.faq.title}</SectionTitle>
      <Reveal delay={120} className="mt-12">
        <div className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {copy.faq.items.map((item, i) => (
            <FaqItem key={item.q} question={item.q} answer={item.a} open={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)} />
          ))}
        </div>
      </Reveal>
    </Section>
  );
};

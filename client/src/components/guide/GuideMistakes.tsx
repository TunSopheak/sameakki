import React from 'react';
import type { GuideMistake } from '../../locales/guide';
import { Icons } from '../icons';

interface GuideMistakesProps {
  items: GuideMistake[];
  wrongLabel: string;
  rightLabel: string;
}

const Sample: React.FC<{ label: string; text: string; good?: boolean }> = ({ label, text, good }) => (
  <div className={`rounded-lg border p-3 ${good ? 'border-brand/40 bg-brand-soft' : 'border-neutral-200 bg-neutral-50'}`}>
    <p className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-bold ${good ? 'text-brand-ink' : 'text-neutral-600'}`}>
      {good ? <Icons.confirm className="size-3.5" /> : <Icons.close className="size-3.5" />}
      {label}
    </p>
    <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-black font-sans">{text}</pre>
  </div>
);

export const GuideMistakes: React.FC<GuideMistakesProps> = ({ items, wrongLabel, rightLabel }) => (
  <ul className="space-y-3">
    {items.map(item => (
      <li key={item.wrong} className="space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Sample label={wrongLabel} text={item.wrong} />
          <Sample label={rightLabel} text={item.right} good />
        </div>
        <p className="text-xs text-neutral-600">{item.why}</p>
      </li>
    ))}
  </ul>
);

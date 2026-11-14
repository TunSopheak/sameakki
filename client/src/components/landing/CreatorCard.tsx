import React from 'react';
import { Github } from 'lucide-react';
import { CREATOR, telegramLink } from '../../lib/contact';
import { Icons } from '../icons';
import { useLanding } from './hooks';

const pill =
  'inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-brand hover:text-[#ffffff]';

/** Who built the app, with links to reach them. */
export const CreatorCard: React.FC = () => {
  const { copy, language } = useLanding();
  const name = language === 'km' ? CREATOR.nameKm : CREATOR.name;

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 rounded-3xl bg-white px-6 py-7 shadow-xs">
      <img src="/creator.jpg" alt={name} width={72} height={72} className="size-[72px] rounded-full object-cover ring-4 ring-brand-soft" />
      <div className="space-y-1">
        <p className="text-xs text-neutral-500">{copy.creator.label}</p>
        <p className="text-base font-bold text-black">{name}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <a href={CREATOR.github} target="_blank" rel="noopener noreferrer" className={pill}>
          <Github className="size-3.5" />
          GitHub
        </a>
        <a href={telegramLink()} target="_blank" rel="noopener noreferrer" className={pill}>
          <Icons.send className="size-3.5" />
          Telegram
        </a>
      </div>
    </div>
  );
};

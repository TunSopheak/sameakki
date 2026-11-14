import React from 'react';
import { useApp } from '../context/AppContext';
import { Flag } from './Flag';
import { ThemeToggle } from './ThemeToggle';

/** The light/dark and Khmer/English buttons used on the pages shown before signing in. */
export const PreferenceToggles: React.FC<{ variant?: 'bordered' | 'ghost' }> = ({ variant = 'bordered' }) => {
  const { language, setLanguage } = useApp();
  const look = variant === 'bordered' ? 'border border-neutral-200 bg-white hover:bg-neutral-100' : 'hover:bg-neutral-100';
  const base = `inline-flex cursor-pointer items-center justify-center rounded-lg transition-colors ${look}`;

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle className={`${look} size-9 rounded-lg`} />
      <button onClick={() => setLanguage(language === 'km' ? 'en' : 'km')} className={`${base} gap-1.5 px-3 py-2 text-xs font-bold text-black`}>
        <Flag code={language === 'km' ? 'en' : 'km'} className="h-3.5" />
        <span className="hidden sm:inline">{language === 'km' ? 'EN' : 'ខ្មែរ'}</span>
      </button>
    </div>
  );
};

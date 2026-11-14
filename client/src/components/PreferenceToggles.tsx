import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../lib/theme';
import { Flag } from './Flag';

/** The light/dark and Khmer/English buttons used on the pages shown before signing in. */
export const PreferenceToggles: React.FC<{ variant?: 'bordered' | 'ghost' }> = ({ variant = 'bordered' }) => {
  const { language, setLanguage } = useApp();
  const { theme, toggle } = useTheme();
  const look = variant === 'bordered' ? 'border border-neutral-200 bg-white hover:bg-neutral-100' : 'hover:bg-neutral-100';
  const base = `inline-flex cursor-pointer items-center justify-center rounded-lg transition-colors ${look}`;
  const label = theme === 'dark' ? 'Light mode' : 'Dark mode';

  return (
    <div className="flex items-center gap-2">
      <button onClick={toggle} aria-label={label} title={label} className={`${base} size-9 text-neutral-600`}>
        {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
      <button onClick={() => setLanguage(language === 'km' ? 'en' : 'km')} className={`${base} gap-1.5 px-3 py-2 text-xs font-bold text-black`}>
        <Flag code={language === 'km' ? 'en' : 'km'} className="h-3.5" />
        <span className="hidden sm:inline">{language === 'km' ? 'EN' : 'ខ្មែរ'}</span>
      </button>
    </div>
  );
};

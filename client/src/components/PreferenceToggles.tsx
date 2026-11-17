import React from 'react';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';

/** Theme and language buttons for the pages before login. */
export const PreferenceToggles: React.FC<{ variant?: 'bordered' | 'ghost' }> = ({ variant = 'bordered' }) => {
  const look = variant === 'bordered' ? 'border border-neutral-200 bg-white hover:bg-neutral-100' : 'hover:bg-neutral-100';

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle className={`${look} size-9 rounded-lg`} />
      <LanguageToggle compact />
    </div>
  );
};

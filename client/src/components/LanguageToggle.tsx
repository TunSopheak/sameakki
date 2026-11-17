import React from 'react';
import { useApp } from '../context/AppContext';

const OPTIONS = [
  { code: 'km', label: 'ខ្មែរ' },
  { code: 'en', label: 'EN' },
] as const;

/** Both languages side by side, the current one is highlighted. */
export const LanguageToggle: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { language, setLanguage, t } = useApp();

  return (
    <div role="group" aria-label={t.changeLanguage} className={`inline-flex shrink-0 items-center rounded-xl border border-neutral-200 bg-white p-0.5 ${compact ? 'h-9' : 'h-10'}`}>
      {OPTIONS.map(option => (
        <button
          key={option.code}
          type="button"
          lang={option.code}
          aria-pressed={language === option.code}
          onClick={() => setLanguage(option.code)}
          className={`h-full cursor-pointer rounded-[10px] px-3 text-xs font-bold transition-colors ${
            language === option.code ? 'bg-brand text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

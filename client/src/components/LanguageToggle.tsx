import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

const FlagKH: React.FC = () => (
  <svg viewBox="0 0 30 20" className="h-full w-full" aria-hidden="true">
    <rect width="30" height="20" fill="#032EA1" />
    <rect y="5" width="30" height="10" fill="#E00025" />
    <g fill="#fff">
      <rect x="9" y="12" width="12" height="1.4" />
      <rect x="10.5" y="10.6" width="9" height="1.4" />
      <rect x="12" y="9.2" width="6" height="1.4" />
      <rect x="14.2" y="6" width="1.6" height="3.2" />
      <rect x="11" y="7.6" width="1.4" height="1.6" />
      <rect x="17.6" y="7.6" width="1.4" height="1.6" />
    </g>
  </svg>
);

const FlagGB: React.FC = () => (
  <svg viewBox="0 0 60 40" className="h-full w-full" aria-hidden="true">
    <rect width="60" height="40" fill="#012169" />
    <path d="M0 0L60 40M60 0L0 40" stroke="#fff" strokeWidth="8" />
    <path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" strokeWidth="3" />
    <path d="M30 0V40M0 20H60" stroke="#fff" strokeWidth="13" />
    <path d="M30 0V40M0 20H60" stroke="#C8102E" strokeWidth="7" />
  </svg>
);

const LANGS = [
  { code: 'km', label: 'ខ្មែរ', Flag: FlagKH },
  { code: 'en', label: 'English', Flag: FlagGB },
] as const;

/** One button showing the current flag; click opens a menu, pick Khmer or English. */
export const LanguageToggle: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { language, setLanguage, t } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find(l => l.code === language) ?? LANGS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.changeLanguage}
        title={t.changeLanguage}
        onClick={() => setOpen(o => !o)}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-black transition-colors hover:bg-neutral-100 ${compact ? 'h-9' : 'h-10'}`}
      >
        <span className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10"><current.Flag /></span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg viewBox="0 0 20 20" className={`size-3.5 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-1.5 min-w-40 overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 shadow-lg">
          {LANGS.map(({ code, label, Flag }) => {
            const active = code === language;
            return (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                lang={code}
                onClick={() => { setLanguage(code); setOpen(false); }}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors ${active ? 'bg-brand text-white' : 'text-black hover:bg-neutral-100'}`}
              >
                <span className="h-4 w-6 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10"><Flag /></span>
                <span className="flex-1">{label}</span>
                {active && <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

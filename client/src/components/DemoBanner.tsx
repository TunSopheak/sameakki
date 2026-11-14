import React from 'react';
import { Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { telegramLink } from '../lib/contact';
import { navigate } from '../lib/route';

/** Shown on top of the sample workspace so nobody mistakes it for a real account. */
export const DemoBanner: React.FC = () => {
  const { isDemo, t, logout } = useApp();
  if (!isDemo) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-brand bg-brand-soft px-4 py-2 text-xs font-medium text-brand print:hidden">
      <span className="mr-auto">{t.demoBanner}</span>
      <a
        href={telegramLink(t.telegramMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 font-semibold text-white hover:bg-brand-dark"
      >
        <Send className="size-3.5" />
        {t.contactTelegram}
      </a>
      <button
        onClick={() => {
          navigate('/about');
          void logout();
        }} className="cursor-pointer rounded-lg border border-brand px-3 py-1.5 font-semibold hover:bg-white">
        {t.exitDemo}
      </button>
    </div>
  );
};

import React, { useRef } from 'react';
import { Brand } from '../Brand';
import { PreferenceToggles } from '../PreferenceToggles';
import { navigate } from '../../lib/route';
import { useLanding, useScrollProgress } from './hooks';
import { scrollToSection } from './ui';
import { Icons } from '../icons';

export const LandingHeader: React.FC = () => {
  const { copy, signedIn } = useLanding();
  const progressRef = useRef<HTMLSpanElement>(null);
  const scrolled = useScrollProgress(progressRef);

  const links = [
    { id: 'features', label: copy.nav.features },
    { id: 'pricing', label: copy.nav.pricing },
    { id: 'faq', label: copy.nav.faq },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? 'border-b border-neutral-200 bg-neutral-50/80 shadow-xs backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <div className={`mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 transition-all duration-300 sm:px-6 ${scrolled ? 'py-2.5' : 'py-5'}`}>
        <Brand short />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
          {links.map(link => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <PreferenceToggles variant="ghost" />
          <button
            onClick={() => navigate(signedIn ? '/' : '/login')}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-neutral-100 hover:shadow-md active:translate-y-0"
          >
            {signedIn ? <Icons.back className="size-3.5" /> : <Icons.login className="size-3.5" />}
            {signedIn ? copy.nav.backToApp : copy.nav.signIn}
          </button>
        </div>
      </div>

      <span ref={progressRef} aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-brand" />
    </header>
  );
};

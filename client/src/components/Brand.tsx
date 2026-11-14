import React from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';

interface BrandProps {
  short?: boolean;
  iconOnly?: boolean;
}

export const Brand: React.FC<BrandProps> = ({ short = false, iconOnly = false }) => {
  const { t } = useApp();
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Logo className="logo-float size-10 shrink-0 text-black" />
      {!iconOnly && (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-black">LeaderSync</p>
          <p className={`text-xs text-neutral-500 ${short ? 'truncate' : 'leading-snug'}`}>{short ? t.appTagline : t.appSubtitle}</p>
        </div>
      )}
    </div>
  );
};

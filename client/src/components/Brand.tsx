import React from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import { APP_NAME } from '../lib/brand';

interface BrandProps {
  short?: boolean;
  iconOnly?: boolean;
  onClick?: () => void;
  compactMobile?: boolean;
}

export const Brand: React.FC<BrandProps> = ({ short = false, iconOnly = false, onClick, compactMobile = false }) => {
  const { t } = useApp();
  const content = (
    <>
      <Logo className="logo-float size-10 shrink-0 text-black" />
      {!iconOnly && (
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-bold leading-tight text-black">{APP_NAME}</p>
          <p className={`text-xs text-neutral-500 ${compactMobile ? 'hidden sm:block' : ''} ${short ? 'truncate' : 'leading-snug'}`}>{short ? t.appTagline : t.appSubtitle}</p>
        </div>
      )}
    </>
  );

  if (!onClick) return <div className="flex min-w-0 items-center gap-2.5">{content}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={APP_NAME}
      title={APP_NAME}
      className="flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {content}
    </button>
  );
};

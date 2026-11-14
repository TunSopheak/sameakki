import React from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../lib/theme';
import { Icons } from './icons';

/** Switches between light and dark. The look comes from `className`, so every screen shares one button. */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useApp();
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? t.themeLight : t.themeDark;
  const Icon = theme === 'dark' ? Icons.light : Icons.dark;

  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className={`inline-flex shrink-0 cursor-pointer items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 ${className}`}>
      <Icon className="size-4" />
    </button>
  );
};

import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'leadersync-theme';

const saved = (): Theme | null => {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
};

const preferred = (): Theme => saved() ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

const apply = (theme: Theme) => document.documentElement.classList.toggle('dark', theme === 'dark');

export const initTheme = () => apply(preferred());

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(preferred);

  useEffect(() => {
    apply(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(current => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // no storage
      }
      return next;
    });
  }, []);

  return { theme, toggle };
};

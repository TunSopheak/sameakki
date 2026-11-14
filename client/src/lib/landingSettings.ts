import { useEffect, useState } from 'react';
import { DEFAULT_LANDING_SETTINGS, type LandingSettings } from '@shared/landing';
import { api } from './api';

const CACHE_KEY = 'leadersync-landing-settings';

const readCache = (): LandingSettings | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? ({ ...DEFAULT_LANDING_SETTINGS, ...JSON.parse(raw) } as LandingSettings) : null;
  } catch {
    return null;
  }
};

const writeCache = (settings: LandingSettings) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  } catch {
    /* no storage */
  }
};

/** Landing page settings. Prices stay hidden until loaded so a wrong price never shows. */
export function useLandingSettings() {
  const [settings, setSettings] = useState<LandingSettings>(() => readCache() ?? DEFAULT_LANDING_SETTINGS);
  const [ready, setReady] = useState(() => readCache() !== null);

  useEffect(() => {
    let cancelled = false;
    api
      .landingSettings()
      .then(next => {
        if (cancelled) return;
        setSettings(next);
        writeCache(next);
        setReady(true);
      })
      .catch(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, ready };
}

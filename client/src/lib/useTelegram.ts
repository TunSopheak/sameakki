import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from './api';

const POLL_MS = 3000;
const POLL_TRIES = 40;

export interface TelegramStatus {
  /** The server has a bot */
  available: boolean;
  linked: boolean;
}

/** Connect or disconnect my Telegram. The same logic is used in My settings and on the streak card. */
export function useTelegram() {
  const { isDemo } = useApp();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<number | undefined>(undefined);

  const stopWaiting = useCallback(() => {
    window.clearInterval(timer.current);
    setWaiting(false);
  }, []);

  useEffect(() => {
    if (isDemo) return;
    api.telegramStatus().then(setStatus, () => undefined);
    return () => window.clearInterval(timer.current);
  }, [isDemo]);

  /** Opens the bot with a one-time link, then waits for the person to press Start there. */
  const connect = async () => {
    setError('');
    try {
      const { url } = await api.telegramLink();
      window.open(url, '_blank', 'noopener');
      setWaiting(true);
      let tries = 0;
      window.clearInterval(timer.current);
      timer.current = window.setInterval(async () => {
        tries++;
        const next = await api.telegramStatus().catch(() => null);
        if (next?.linked) {
          setStatus(next);
          stopWaiting();
        } else if (tries >= POLL_TRIES) stopWaiting();
      }, POLL_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const disconnect = async () => {
    setError('');
    try {
      await api.telegramUnlink();
      setStatus({ available: true, linked: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return { status: isDemo ? null : status, waiting, error, connect, disconnect };
}

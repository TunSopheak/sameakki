import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';

const POLL_MS = 3000;
const POLL_TRIES = 40;

/** Lets a person get pokes as a Telegram message too. Shown only when the server has a bot. */
export const TelegramConnect: React.FC = () => {
  const { t, isDemo } = useApp();
  const [status, setStatus] = useState<{ available: boolean; linked: boolean } | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<number | undefined>(undefined);

  const stopWaiting = () => {
    window.clearInterval(timer.current);
    setWaiting(false);
  };

  useEffect(() => {
    if (isDemo) return;
    api.telegramStatus().then(setStatus, () => undefined);
    return () => window.clearInterval(timer.current);
  }, [isDemo]);

  if (isDemo || !status?.available) return null;

  const connect = async () => {
    setError('');
    try {
      const { url } = await api.telegramLink();
      window.open(url, '_blank', 'noopener');
      setWaiting(true);
      // Wait for the person to press Start in Telegram
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

  return (
    <div className="rounded-xl border border-neutral-200 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-black">
            {t.telegramTitle}
            {status.linked && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">{t.telegramConnected}</span>}
          </p>
          <p className="text-[11px] text-neutral-500">{status.linked ? t.telegramLinkedHint : waiting ? t.telegramWaiting : t.telegramHint}</p>
        </div>
        {status.linked ? (
          <button type="button" onClick={disconnect} className="shrink-0 cursor-pointer rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100">
            {t.telegramDisconnect}
          </button>
        ) : (
          <button type="button" onClick={connect} className="shrink-0 cursor-pointer rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">
            {waiting ? t.telegramOpenAgain : t.telegramConnect}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-brand-ink">{error}</p>}
    </div>
  );
};

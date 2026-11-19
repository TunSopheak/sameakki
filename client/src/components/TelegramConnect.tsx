import React from 'react';
import { useApp } from '../context/AppContext';
import { useTelegram } from '../lib/useTelegram';

/** Lets a person get pokes as a Telegram message too. Shown only when the server has a bot. */
export const TelegramConnect: React.FC = () => {
  const { t } = useApp();
  const { status, waiting, error, connect, disconnect, setAll } = useTelegram();

  if (!status?.available) return null;

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
      {status.linked && (
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 border-t border-neutral-100 pt-3">
          <input type="checkbox" checked={status.all} onChange={e => setAll(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-brand)]" />
          <span>
            <span className="block text-xs font-semibold text-black">{t.telegramAllLabel}</span>
            <span className="block text-[11px] text-neutral-500">{t.telegramAllHint}</span>
          </span>
        </label>
      )}
      {error && <p className="mt-2 text-xs text-brand-ink">{error}</p>}
    </div>
  );
};

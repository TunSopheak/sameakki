import React, { useRef, useState } from 'react';
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { api } from '../lib/api';
import { useDismiss } from '../lib/useDismiss';
import { useApp } from '../context/AppContext';

const OPTIONS = [24, 72] as const;

/** The group's leader decides whether the Super Admin may open this group, and for how long. */
export const SupportAccessControl: React.FC = () => {
  const { t, language, activeGroup, refresh, showError } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  if (!activeGroup) return null;
  const until = activeGroup.supportAccessUntil ? new Date(activeGroup.supportAccessUntil) : null;
  const on = !!until && until.getTime() > Date.now();
  const hoursLeft = on ? Math.max(1, Math.ceil((until.getTime() - Date.now()) / 3_600_000)) : 0;

  const set = async (hours: number) => {
    setBusy(true);
    try {
      await api.setSupportAccess(activeGroup.id, hours);
      await refresh();
      setOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const hoursText = (h: number) => (language === 'km' ? `${h} ម៉ោង` : `${h} hours`);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        title={t.supportTitle}
        className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          on ? 'border-brand bg-brand-soft text-brand' : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-black'
        }`}
      >
        {on ? <ShieldCheck className="size-3.5" /> : <ShieldOff className="size-3.5 text-neutral-500" />}
        <span className="hidden sm:inline">{on ? `${t.supportOn} · ${hoursText(hoursLeft)}` : t.supportOff}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-2xl">
          <h4 className="text-sm font-bold text-black">{t.supportTitle}</h4>
          <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">{on ? t.supportOnHint : t.supportOffHint}</p>

          <div className="mt-3 space-y-2">
            {on ? (
              <button
                onClick={() => set(0)}
                disabled={busy}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {busy && <Loader2 className="size-3.5 animate-spin" />}
                {t.supportTurnOff}
              </button>
            ) : (
              OPTIONS.map(h => (
                <button
                  key={h}
                  onClick={() => set(h)}
                  disabled={busy}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-neutral-100 disabled:opacity-60"
                >
                  {busy && <Loader2 className="size-3.5 animate-spin" />}
                  {t.supportAllow} {hoursText(h)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

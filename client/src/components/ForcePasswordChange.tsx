import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';

const inputClass =
  'h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-black transition-colors focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40';

/**
 * Blocks the app until a person replaces the password someone else chose for them.
 * It cannot be dismissed; the only other way out is to sign out.
 */
export const ForcePasswordChange: React.FC = () => {
  const { currentUser, isDemo, refresh, logout, t } = useApp();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!currentUser.mustChangePassword || isDemo) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    if (next !== confirm) return setError(t.passwordMismatch);

    setSaving(true);
    try {
      await api.changePassword(current, next);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="modal-overlay fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <form onSubmit={submit} className="modal-panel w-full max-w-md rounded-xl border border-neutral-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand text-white">
            <KeyRound className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-black">{t.forceChangeTitle}</h2>
            <p className="text-xs text-neutral-500">{currentUser.email}</p>
          </div>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-neutral-600">{t.forceChangeHint}</p>

        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-brand bg-brand-soft p-2.5 text-xs font-medium text-brand">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-black">{t.currentPassword}</span>
            <input type="password" required autoFocus autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-black">{t.newPassword}</span>
            <input type="password" required autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} className={inputClass} />
            <span className="mt-1 block text-[11px] text-neutral-500">{t.passwordHint}</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-black">{t.confirmNewPassword}</span>
            <input type="password" required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button type="button" onClick={() => logout()} className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100">
            {t.signOut}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-dark disabled:opacity-60"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {t.save}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};

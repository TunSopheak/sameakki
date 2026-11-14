import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, X } from 'lucide-react';
import type { AdminUserRow } from '@shared/types';
import { api } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { TempPasswordModal } from '../TempPasswordModal';

const fieldClass =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand/40';

interface AccountModalProps {
  /** Set to edit an existing leader's plan; leave out to create a new account. */
  user?: AdminUserRow;
  onClose: () => void;
  onSaved: () => void;
}

/** Super Admin: create a Team Leader account, or change its expiry date and member limit. */
export const AccountModal: React.FC<AccountModalProps> = ({ user, onClose, onSaved }) => {
  const { t } = useApp();
  const editing = !!user;
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    expiresAt: user?.expiresAt ? user.expiresAt.slice(0, 10) : '',
    maxMembers: user?.maxMembers ? String(user.maxMembers) : '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Set after creating an account with a generated password, so it can be shown once
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const plan = {
        expiresAt: form.expiresAt || null,
        maxMembers: form.maxMembers ? Number(form.maxMembers) : null,
      };
      if (user) {
        await api.setUserPlan(user.id, plan);
      } else {
        const result = await api.createLeader({
          name: form.name.trim(),
          email: form.email.trim(),
          username: form.username.trim() || undefined,
          password: form.password || undefined,
          ...plan,
        });
        onSaved();
        if (result.password) {
          setCreated({ name: form.name.trim(), email: form.email.trim(), password: result.password });
          return;
        }
        onClose();
        return;
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (created) return <TempPasswordModal {...created} onClose={onClose} />;

  // Rendered on document.body: an animated parent would otherwise break position: fixed
  return createPortal(
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
      <div className="modal-panel max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between border-b border-neutral-200 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
              <UserPlus className="size-4" />
            </div>
            <h2 className="text-base font-bold text-black">{editing ? `${t.adminEditPlan}: ${user.name}` : t.adminCreateLeader}</h2>
          </div>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1 text-neutral-400 hover:text-black" aria-label={t.cancel}>
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-brand bg-neutral-100 p-3 text-xs font-medium text-black">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!editing && (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-black">{t.accFullName} *</span>
                <input required value={form.name} onChange={update('name')} autoComplete="off" className={fieldClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-black">{t.memberEmail} *</span>
                <input required type="email" value={form.email} onChange={update('email')} autoComplete="off" className={fieldClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-black">{t.adminUsername}</span>
                <input value={form.username} onChange={update('username')} autoComplete="off" placeholder="sokha.leader" className={fieldClass} />
                <span className="mt-1 block text-[11px] text-neutral-500">{t.accUsernameHint}</span>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-black">{t.adminStartPassword}</span>
                <input type="password" value={form.password} onChange={update('password')} autoComplete="new-password" className={fieldClass} />
                <span className="mt-1 block text-[11px] text-neutral-500">{t.accPasswordHint}</span>
              </label>
            </>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-black">{t.adminExpiresOn}</span>
              <input type="date" value={form.expiresAt} onChange={update('expiresAt')} className={fieldClass} />
              <span className="mt-1 block text-[11px] text-neutral-500">{t.accExpiresHint}</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-black">{t.adminMaxMembers}</span>
              <input type="number" min={1} value={form.maxMembers} onChange={update('maxMembers')} placeholder="10" className={fieldClass} />
              <span className="mt-1 block text-[11px] text-neutral-500">{t.accMaxHint}</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-lg px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100">
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-dark disabled:opacity-60"
            >
              {t.adminSave}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

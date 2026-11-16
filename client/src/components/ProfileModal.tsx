import { createPortal } from 'react-dom';
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { Icons } from './icons';
import { PasswordInput } from './PasswordInput';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const input =
  'h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm transition-colors focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40';

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, t } = useApp();
  const [name, setName] = useState('');
  const [nameKm, setNameKm] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(currentUser.name);
    setNameKm(currentUser.nameKm || '');
    setSpecialty(currentUser.specialty || '');
    setCurrentPassword('');
    setNewPassword('');
    setError('');
    setShowPassword(false);
    // Reset only when opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Only a filled-in password section counts; opening it and leaving it empty changes nothing
  const wantsPassword = showPassword && (currentPassword !== '' || newPassword !== '');

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      if (wantsPassword) await api.changePassword(currentPassword, newPassword);
      await updateProfile({ name, nameKm, specialty });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, node: React.ReactNode, hint?: string) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-neutral-600">{label}</span>
      {node}
      {hint && <span className="mt-1 block text-[11px] text-neutral-400">{hint}</span>}
    </label>
  );

  // Shown on <body> so the sidebar does not trap it
  return createPortal(
      <div className="modal-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-2xs sm:items-center sm:p-4">
        <form
          onSubmit={submit}
          className="modal-panel flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-neutral-200 bg-white shadow-2xl sm:rounded-2xl"
        >
          <div className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
            <Avatar name={currentUser.name} avatar={currentUser.avatar} className="size-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-black">{t.mySettings}</h2>
              <p className="truncate text-xs text-neutral-500">{currentUser.email}</p>
            </div>
            <button type="button" onClick={onClose} aria-label={t.cancel} className="-mr-1 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-black">
              <Icons.close className="size-5" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {field(t.memberName, <input required value={name} onChange={e => setName(e.target.value)} className={input} />)}
              {field(t.khmerName, <input value={nameKm} onChange={e => setNameKm(e.target.value)} className={input} />)}
            </div>
            {field(t.memberSpecialty, <input value={specialty} onChange={e => setSpecialty(e.target.value)} className={input} />)}

            <div className="rounded-xl border border-neutral-200">
              <button
                type="button"
                onClick={() => setShowPassword(open => !open)}
                aria-expanded={showPassword}
                className="flex w-full items-center justify-between px-3.5 py-3 text-left text-sm font-semibold text-black"
              >
                <span className="flex items-center gap-2">
                  <Icons.password className="size-4 text-neutral-500" />
                  {t.changePassword}
                </span>
                <Icons.expand className={`size-4 text-neutral-400 transition-transform ${showPassword ? 'rotate-180' : ''}`} />
              </button>
              {showPassword && (
                <div className="animate-rise space-y-4 border-t border-neutral-200 px-3.5 pb-4 pt-4">
                  {field(
                    t.currentPassword,
                    <PasswordInput autoComplete="current-password" required={wantsPassword} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={input} />
                  )}
                  {field(
                    t.newPassword,
                    <PasswordInput autoComplete="new-password" required={wantsPassword} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={input} />,
                    t.passwordHint
                  )}
                </div>
              )}
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-brand bg-brand-soft p-2.5 text-xs font-medium text-brand">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 px-5 pb-5 pt-1">
            <button type="button" onClick={onClose} className="h-10 rounded-lg px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100">
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark disabled:opacity-60"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>,
    document.body
  );
};

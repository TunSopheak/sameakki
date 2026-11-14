import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { Icons } from './icons';

interface TempPasswordModalProps {
  name: string;
  email: string;
  password: string;
  onClose: () => void;
}

/** Shows a reset password once, so the admin or leader can pass it on. */
export const TempPasswordModal: React.FC<TempPasswordModalProps> = ({ name, email, password, onClose }) => {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the password is on screen to copy by hand
    }
  };

  return createPortal(
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
      <div className="modal-panel w-full max-w-md rounded-xl border border-neutral-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
              <Icons.password className="size-4" />
            </div>
            <h2 className="text-base font-bold text-black">{t.tempPasswordTitle}</h2>
          </div>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1 text-neutral-400 hover:text-black" aria-label={t.cancel}>
            <Icons.close className="size-5" />
          </button>
        </div>

        <p className="text-sm font-semibold text-black">{name}</p>
        <p className="mb-4 text-xs text-neutral-500">{email}</p>

        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <code className="flex-1 select-all break-all text-lg font-bold tracking-wider text-black">{password}</code>
          <button
            onClick={copy}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-neutral-100"
          >
            {copied ? <Icons.confirm className="size-3.5" /> : <Icons.copy className="size-3.5" />}
            {copied ? t.copiedText : t.copyText}
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-neutral-500">{t.tempPasswordHint}</p>

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="cursor-pointer rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-dark">
            {t.tempPasswordDone}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

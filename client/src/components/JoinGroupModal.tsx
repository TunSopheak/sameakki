import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, X } from 'lucide-react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({ isOpen, onClose }) => {
  const { joinGroup, t } = useApp();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setCode('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || submitting) return;

    setSubmitting(true);
    try {
      await joinGroup(code.trim());
      onClose();
    } catch {
      // Error is shown as a notice; keep the form open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="modal-panel bg-white rounded-xl max-w-sm w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{t.joinGroup}</h2>
              <p className="text-xs text-neutral-500">{t.joinGroupHint}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-black p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-black mb-1">{t.groupCode} *</label>
            <input
              type="text"
              required
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={t.groupCodePlaceholder}
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40 font-mono uppercase"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-dark disabled:opacity-60 rounded-lg shadow-xs"
            >
              {t.joinGroup}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

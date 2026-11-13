import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { UserPlus, X, Mail } from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose }) => {
  const { addMemberToGroup, t, activeGroup } = useApp();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setEmail('');
    setRole('member');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address || submitting) return;

    setSubmitting(true);
    try {
      // The person fills in their real name when they register with this email.
      await addMemberToGroup({ name: address.split('@')[0], email: address, role, groupId: activeGroup?.id });
      onClose();
    } catch {
      // Error is shown as a notice; keep the form open.
    } finally {
      setSubmitting(false);
    }
  };

  const roles: { role: Role; label: string }[] = [
    { role: 'member', label: t.memberBadge },
    { role: 'team_lead', label: t.teamLeadBadge },
    { role: 'viewer', label: t.viewerBadge },
  ];

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="modal-panel bg-white rounded-xl max-w-lg w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{t.addMember}</h2>
              <p className="text-xs text-neutral-500">
                {t.addMemberByEmailOrId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-bold text-black">
              <Mail className="size-3.5 text-neutral-400" />
              {t.memberEmail}
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@email.com"
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-black">{t.memberRole}</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map(item => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => setRole(item.role)}
                  className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
                    role === item.role ? 'border-brand bg-brand text-white' : 'border-neutral-200 bg-white text-black hover:bg-neutral-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
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
              {t.btnSaveMember}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

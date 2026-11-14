import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { Role } from '../types';
import { Avatar } from './Avatar';
import { UserPlus, X, Mail, Search } from 'lucide-react';

const fieldClass =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand/40';

type Candidate = Awaited<ReturnType<typeof api.memberCandidates>>[number];

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose }) => {
  const { addMemberToGroup, t, language, activeGroup, isSuperAdmin, isDemo } = useApp();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Candidate[]>([]);
  const [searched, setSearched] = useState(false);
  // An existing account picked from the search. When set, no new account is created.
  const [selected, setSelected] = useState<Candidate | null>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setResults([]);
    setSearched(false);
    setSelected(null);
    setName('');
    setPassword('');
    setEmail('');
    setRole('member');
  }, [isOpen]);

  // Search existing accounts while typing (waits a moment after the last key)
  useEffect(() => {
    if (!isOpen || selected || isDemo || !activeGroup) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const found = await api.memberCandidates(activeGroup.id, query.trim());
        if (!cancelled) {
          setResults(found);
          setSearched(true);
        }
      } catch {
        if (!cancelled) setResults([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOpen, query, selected, isDemo, activeGroup]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = (selected ? selected.email : email).trim();
    if (!address || submitting) return;

    setSubmitting(true);
    try {
      await addMemberToGroup({
        name: selected ? selected.name : name.trim() || address.split('@')[0],
        email: address,
        role,
        password: selected ? undefined : password || undefined,
        groupId: activeGroup?.id,
      });
      onClose();
    } catch {
      // Error is shown as a notice; keep the form open.
    } finally {
      setSubmitting(false);
    }
  };

  const roles: { role: Role; label: string }[] = [
    { role: 'member', label: t.memberBadge },
    // Only the Super Admin creates Team Leaders
    ...(isSuperAdmin ? [{ role: 'team_lead' as Role, label: t.teamLeadBadge }] : []),
    { role: 'viewer', label: t.viewerBadge },
  ];
  // A leader adding an existing account cannot change that person's role
  const showRoles = isSuperAdmin || !selected;
  const displayName = (c: Candidate) => (language === 'km' && c.nameKm ? c.nameKm : c.name);

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="modal-panel bg-white rounded-xl max-w-lg w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-black">{t.addMember}</h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-black p-1 rounded-lg" aria-label={t.cancel}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Pick someone who already has an account */}
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-bold text-black">
              <Search className="size-3.5 text-neutral-400" />
              {t.searchExisting}
            </label>

            {selected ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-brand bg-brand-soft p-2.5">
                <Avatar name={selected.name} avatar={selected.avatar} className="size-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-black">{displayName(selected)}</p>
                  <p className="truncate text-xs text-neutral-500">{selected.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="shrink-0 cursor-pointer text-xs font-semibold text-black hover:underline"
                >
                  {t.changeSelection}
                </button>
              </div>
            ) : (
              <>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoFocus
                  autoComplete="off"
                  placeholder={t.searchExistingHint}
                  className={fieldClass}
                />
                {results.length > 0 && (
                  <ul className="mt-1.5 max-h-48 divide-y divide-neutral-100 overflow-y-auto rounded-lg border border-neutral-200">
                    {results.map(c => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(c)}
                          className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left hover:bg-neutral-100"
                        >
                          <Avatar name={c.name} avatar={c.avatar} className="size-7" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-black">{displayName(c)}</span>
                            <span className="block truncate text-xs text-neutral-500">{c.email}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {searched && query.trim() && results.length === 0 && (
                  <p className="mt-1.5 text-xs text-neutral-500">{t.noAccountFound}</p>
                )}
              </>
            )}
          </div>

          {/* 2. Otherwise create a new account */}
          {!selected && (
            <>
              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                <span className="h-px flex-1 bg-neutral-200" />
                {t.orCreateNew}
                <span className="h-px flex-1 bg-neutral-200" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-black">{t.newMemberName}</label>
                <input value={name} onChange={e => setName(e.target.value)} className={fieldClass} />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-bold text-black">
                  <Mail className="size-3.5 text-neutral-400" />
                  {t.memberEmail}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-black">{t.newMemberPassword}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className={fieldClass}
                />
              </div>
            </>
          )}

          {showRoles && (
            <div>
              <label className="mb-1 block text-xs font-bold text-black">{t.memberRole}</label>
              <div className={`grid gap-2 ${roles.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
          )}

          <div className="flex items-center justify-end gap-2 pt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg">
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

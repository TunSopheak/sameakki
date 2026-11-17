import React, { useCallback, useEffect, useState } from 'react';
import { ROLES, type AdminOverview as Overview, type AdminGroupRow, type AdminUserRow, type Role } from '@shared/types';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { AnimatedNumber } from './AnimatedNumber';
import { GroupsTable } from './admin/GroupsTable';
import { UsersTable } from './admin/UsersTable';
import { AccountModal } from './admin/AccountModal';
import { LandingSettingsModal } from './admin/LandingSettingsModal';
import { TempPasswordModal } from './TempPasswordModal';

import { Icons } from './icons';

const ONLINE_MINUTES = 10;
const ACTIVE_DAYS = 7;

const minutesAgo = (iso?: string) => (iso ? (Date.now() - new Date(iso).getTime()) / 60_000 : Infinity);

export const AdminOverview: React.FC = () => {
  const { t, refresh } = useApp();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // "new" creates a leader, a user edits their plan
  const [accountModal, setAccountModal] = useState<'new' | AdminUserRow | null>(null);
  const [landingOpen, setLandingOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<{ name: string; email: string; password: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.adminOverview());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const change = async (action: () => Promise<unknown>) => {
    try {
      await action();
      await Promise.all([load(), refresh()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const deleteUser = (user: AdminUserRow, active: boolean) => {
    if (!active && !confirm(t.adminDeleteUserConfirm)) return;
    change(() => api.setUserActive(user.id, active));
  };
  const deleteGroup = (group: AdminGroupRow, active: boolean) => {
    if (!active && !confirm(t.adminDeleteGroupConfirm)) return;
    change(() => api.setGroupActive(group.id, active));
  };
  const resetPassword = async (user: AdminUserRow) => {
    if (!confirm(t.resetPasswordConfirm)) return;
    try {
      const { password } = await api.resetPassword(user.id);
      setTempPassword({ name: user.name, email: user.email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };
  const changeRole = (user: AdminUserRow, role: Role) => change(() => api.updateUserRole(user.id, role));

  if (!data) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
        {error || t.loading}
      </div>
    );
  }

  const roleLabel: Record<Role, string> = {
    super_admin: t.superAdminBadge,
    team_lead: t.teamLeadBadge,
    member: t.memberBadge,
    viewer: t.viewerBadge,
  };
  const users = data.users.filter(u => u.isActive);
  const stats = [
    { label: t.adminUsers, value: users.length, icon: Icons.members },
    { label: t.adminOnline, value: users.filter(u => minutesAgo(u.lastSeenAt) <= ONLINE_MINUTES).length, icon: Icons.activeUser },
    { label: t.adminActiveWeek, value: users.filter(u => minutesAgo(u.lastSeenAt) <= ACTIVE_DAYS * 24 * 60).length, icon: Icons.admin },
    { label: t.adminGroups, value: data.groups.filter(g => g.isActive).length, icon: Icons.members },
    // Same rule as the table filter
    { label: t.adminNever, value: users.filter(u => !u.lastSeenAt).length, icon: Icons.addMember },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-black">{t.tabAdmin}</h2>
          <p className="hidden text-xs text-neutral-500 sm:block">{t.adminHint}</p>
        </div>
        <div className="flex items-center gap-2">
        <button
          onClick={() => setLandingOpen(true)}
          aria-label={t.adminLandingSettings}
          title={t.adminLandingSettings}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-100"
        >
          <Icons.pageSettings className="size-3.5" />
          <span className="hidden sm:inline">{t.adminLandingSettings}</span>
        </button>
        <button
          onClick={() => setAccountModal('new')}
          aria-label={t.adminCreateLeader}
          title={t.adminCreateLeader}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
        >
          <Icons.add className="size-3.5" />
          <span className="sm:hidden">{t.adminCreateLeaderShort}</span>
          <span className="hidden sm:inline">{t.adminCreateLeader}</span>
        </button>
        <button
          onClick={load}
          aria-label={t.adminRefresh}
          title={t.adminRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-100 disabled:opacity-60"
        >
          <Icons.refresh className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{t.adminRefresh}</span>
        </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-brand bg-brand-soft p-3 text-xs font-medium text-brand-ink">
          {error}
        </div>
      )}

      <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="lift rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-semibold">{label}</span>
              <Icon className="size-4" />
            </div>
            <p className="mt-2 text-3xl font-bold text-black">
              <AnimatedNumber value={value} />
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLES.map(role => (
          <span key={role} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
            {roleLabel[role]} · <span className="text-brand-ink">{users.filter(u => u.role === role).length}</span>
          </span>
        ))}
      </div>

      <UsersTable users={data.users} onDelete={deleteUser} onChangeRole={changeRole} onEditPlan={setAccountModal} onResetPassword={resetPassword} />
      <GroupsTable groups={data.groups} onDelete={deleteGroup} />

      {landingOpen && <LandingSettingsModal onClose={() => setLandingOpen(false)} />}

      {tempPassword && <TempPasswordModal {...tempPassword} onClose={() => setTempPassword(null)} />}

      {accountModal && (
        <AccountModal
          user={accountModal === 'new' ? undefined : accountModal}
          onClose={() => setAccountModal(null)}
          onSaved={() => void Promise.all([load(), refresh()])}
        />
      )}
    </div>
  );
};

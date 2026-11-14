import React, { useMemo, useState } from 'react';
import type { AdminUserRow, Role } from '@shared/types';
import { formatDateTime } from '../../lib/dates';
import { useTableView } from '../../lib/useTableView';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../Avatar';
import { FilterSelect, Pager, RowAction, SearchBox, SortHeader } from '../TableParts';

const ONLINE_MINUTES = 10;
const ACTIVE_DAYS = 7;

type StatusFilter = 'all' | 'online' | 'week' | 'never' | 'pending' | 'deleted';

const minutesAgo = (iso?: string) => (iso ? (Date.now() - new Date(iso).getTime()) / 60_000 : Infinity);

interface UsersTableProps {
  users: AdminUserRow[];
  onDelete: (user: AdminUserRow, active: boolean) => void;
  onChangeRole: (user: AdminUserRow, role: Role) => void;
  onEditPlan: (user: AdminUserRow) => void;
  onResetPassword: (user: AdminUserRow) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({ users, onDelete, onChangeRole, onEditPlan, onResetPassword }) => {
  const { t, language } = useApp();
  const [role, setRole] = useState<'all' | Role>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const roleLabel: Record<Role, string> = {
    super_admin: t.superAdminBadge,
    team_lead: t.teamLeadBadge,
    member: t.memberBadge,
    viewer: t.viewerBadge,
  };
  const deletedCount = users.filter(u => !u.isActive).length;

  const filtered = useMemo(
    () =>
      users.filter(user => {
        if (status === 'deleted') return !user.isActive;
        if (!user.isActive) return false;
        if (role !== 'all' && user.role !== role) return false;
        if (status === 'online') return minutesAgo(user.lastSeenAt) <= ONLINE_MINUTES;
        if (status === 'week') return minutesAgo(user.lastSeenAt) <= ACTIVE_DAYS * 24 * 60;
        if (status === 'never') return user.registered && !user.lastSeenAt;
        if (status === 'pending') return !user.registered;
        return true;
      }),
    [users, role, status]
  );

  const view = useTableView(filtered, {
    searchText: u => `${u.name} ${u.nameKm ?? ''} ${u.email} ${u.username ?? ''}`,
    compare: {
      name: (a, b) => a.name.localeCompare(b.name),
      role: (a, b) => a.role.localeCompare(b.role),
      groups: (a, b) => a.groupCount - b.groupCount,
      created: (a, b) => a.createdAt.localeCompare(b.createdAt),
      seen: (a, b) => (a.lastSeenAt ?? '').localeCompare(b.lastSeenAt ?? ''),
    },
    initialSort: { key: 'created', dir: 'asc' },
  });

  const planLabel = (user: AdminUserRow) => {
    if (user.role === 'super_admin') return '—';
    const limit = user.maxMembers ? `≤ ${user.maxMembers}` : t.adminUnlimited;
    if (!user.expiresAt) return `${t.adminNeverExpires} · ${limit}`;
    const expired = new Date(user.expiresAt).getTime() < Date.now();
    return (
      <span className={expired ? 'font-semibold text-brand' : undefined}>
        {expired ? `${t.adminExpired} ` : ''}
        {user.expiresAt.slice(0, 10)} · {limit}
      </span>
    );
  };

  const lastSeen = (user: AdminUserRow) => {
    if (!user.isActive) return t.adminDeleted;
    if (!user.registered) return t.adminNotRegistered;
    if (!user.lastSeenAt) return t.adminNever;
    return minutesAgo(user.lastSeenAt) <= ONLINE_MINUTES ? t.adminOnline : formatDateTime(user.lastSeenAt);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-4 py-3">
        <h3 className="mr-auto text-sm font-bold text-black">
          {t.adminUsers} ({view.total})
        </h3>
        <SearchBox value={view.query} onChange={view.setQuery} placeholder={t.adminSearchUsers} />
        <FilterSelect
          value={role}
          onChange={v => setRole(v as 'all' | Role)}
          options={[
            { value: 'all', label: t.adminAllRoles },
            { value: 'super_admin', label: roleLabel.super_admin },
            { value: 'team_lead', label: roleLabel.team_lead },
            { value: 'member', label: roleLabel.member },
            { value: 'viewer', label: roleLabel.viewer },
          ]}
        />
        <FilterSelect
          value={status}
          onChange={v => setStatus(v as StatusFilter)}
          options={[
            { value: 'all', label: t.adminAllStatus },
            { value: 'online', label: t.adminOnline },
            { value: 'week', label: t.adminActiveWeek },
            { value: 'never', label: t.adminNever },
            { value: 'pending', label: t.adminNotRegistered },
            { value: 'deleted', label: `${t.adminDeleted} (${deletedCount})` },
          ]}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left text-xs">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <SortHeader label={t.memberName} column="name" sort={view.sort} onSort={view.toggleSort} />
              <SortHeader label={t.memberRole} column="role" sort={view.sort} onSort={view.toggleSort} />
              <SortHeader label={t.adminGroups} column="groups" sort={view.sort} onSort={view.toggleSort} />
              <SortHeader label={t.adminJoined} column="created" sort={view.sort} onSort={view.toggleSort} />
              <SortHeader label={t.adminLastActive} column="seen" sort={view.sort} onSort={view.toggleSort} />
              <th className="px-4 py-2.5 font-semibold">{t.adminPlan}</th>
              <th className="px-4 py-2.5 text-right font-semibold">{t.adminActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {view.pageRows.map(user => {
              const isOnline = user.isActive && minutesAgo(user.lastSeenAt) <= ONLINE_MINUTES;
              const canEdit = user.isActive && user.role !== 'super_admin';
              return (
                <tr key={user.id} className={`hover:bg-neutral-50 ${user.isActive ? '' : 'opacity-60'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={user.name} avatar={user.avatar} className="size-8" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-black">{language === 'km' && user.nameKm ? user.nameKm : user.name}</p>
                        <p className="truncate text-neutral-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <select
                        value={user.role}
                        onChange={e => onChangeRole(user, e.target.value as Role)}
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-black focus:border-brand focus:outline-none"
                      >
                        <option value="team_lead">{roleLabel.team_lead}</option>
                        <option value="member">{roleLabel.member}</option>
                        <option value="viewer">{roleLabel.viewer}</option>
                      </select>
                    ) : (
                      <span className="font-medium text-neutral-700">{roleLabel[user.role]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{user.groupCount}</td>
                  <td className="px-4 py-3 text-neutral-500">{formatDateTime(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-neutral-700">
                      {isOnline && <span className="size-2 rounded-full bg-emerald-500" />}
                      {lastSeen(user)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{planLabel(user)}</td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && (
                      <button
                        onClick={() => onEditPlan(user)}
                        className="mr-3 cursor-pointer text-xs font-semibold text-black hover:underline"
                      >
                        {t.adminEditPlan}
                      </button>
                    )}
                    {canEdit && user.registered && (
                      <button
                        onClick={() => onResetPassword(user)}
                        className="mr-3 cursor-pointer text-xs font-semibold text-black hover:underline"
                      >
                        {t.resetPasswordAction}
                      </button>
                    )}
                    {user.role !== 'super_admin' && (
                      <RowAction
                        active={user.isActive}
                        onClick={() => onDelete(user, !user.isActive)}
                        deleteLabel={t.adminDelete}
                        restoreLabel={t.adminRestore}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
            {view.pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  {t.adminNoResults}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pager page={view.page} pageCount={view.pageCount} total={view.total} onPage={view.setPage} />
    </section>
  );
};

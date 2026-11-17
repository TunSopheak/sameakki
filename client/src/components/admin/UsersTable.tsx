import { SelectMenu, SELECT_COMPACT } from '../pickers/SelectMenu';
import React, { useMemo, useState } from 'react';
import type { AdminUserRow, Role } from '@shared/types';
import { formatDateTime } from '../../lib/dates';
import { useTableView } from '../../lib/useTableView';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../Avatar';
import { FilterSelect, IconAction, Pager, RowAction, SearchBox, SortHeader } from '../TableParts';
import { Icons } from '../icons';

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
        if (status === 'never') return !user.lastSeenAt;
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
    const expired = !!user.expiresAt && new Date(user.expiresAt).getTime() < Date.now();
    return (
      <div className="space-y-0.5">
        <p className={expired ? 'font-semibold text-brand-ink' : undefined}>
          {user.expiresAt ? `${expired ? `${t.adminExpired} · ` : ''}${user.expiresAt.slice(0, 10)}` : t.adminNeverExpires}
        </p>
        {user.role === 'team_lead' && (
          <p className="flex items-center gap-1 text-neutral-500" title={`${t.adminMaxMembers}: ${user.maxMembers ?? t.adminUnlimited}`}>
            <Icons.members className="size-3" />
            {user.maxMembers ?? '∞'}
          </p>
        )}
      </div>
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
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
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
              <th className="sticky right-0 bg-neutral-50 px-4 py-2.5 text-right font-semibold">{t.adminActions}</th>
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
                        <p className="truncate text-[11px] text-neutral-400 md:hidden">{roleLabel[user.role]} · {lastSeen(user)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <SelectMenu
                        value={user.role}
                        label={t.memberRole}
                        className={SELECT_COMPACT}
                        onChange={role => onChangeRole(user, role)}
                        options={[
                          { value: 'team_lead', label: roleLabel.team_lead },
                          { value: 'member', label: roleLabel.member },
                          { value: 'viewer', label: roleLabel.viewer },
                        ]}
                      />
                    ) : (
                      <span className="font-medium text-neutral-700">{roleLabel[user.role]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{user.groupCount}</td>
                  <td className="px-4 py-3 text-neutral-500">{formatDateTime(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-neutral-700">
                      {isOnline && <span className="size-2 shrink-0 rounded-full bg-emerald-500" />}
                      {lastSeen(user)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{planLabel(user)}</td>
                  <td className="sticky right-0 bg-white px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      {canEdit && <IconAction icon={Icons.deadline} label={t.adminEditPlan} onClick={() => onEditPlan(user)} />}
                      {canEdit && user.registered && <IconAction icon={Icons.password} label={t.resetPasswordAction} onClick={() => onResetPassword(user)} />}
                      {user.role !== 'super_admin' && (
                        <RowAction active={user.isActive} onClick={() => onDelete(user, !user.isActive)} deleteLabel={t.adminDelete} restoreLabel={t.adminRestore} />
                      )}
                    </div>
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

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { todayLocal } from '../lib/dates';
import type { Role, User } from '../types';
import { Avatar } from './Avatar';
import { IconAction, Pager, SearchBox, SortHeader } from './TableParts';
import { TempPasswordModal } from './TempPasswordModal';
import { api } from '../lib/api';
import { useTableView } from '../lib/useTableView';
import { Icons } from './icons';

interface MembersListProps {
  onOpenLeaveGroup: (groupId: string) => void;
}

export const MembersList: React.FC<MembersListProps> = () => {
  const {
    activeGroupMembers,
    currentUser,
    isSuperAdmin,
    canManageGroup,
    updateUserRole,
    removeMemberFromGroup,
    activeGroupTasks,
    activeGroupDailyLogs,
    t,
    isDemo,
    showError,
  } = useApp();

  const [tempPassword, setTempPassword] = useState<{ name: string; email: string; password: string } | null>(null);
  const resetPassword = async (member: { id: string; name: string; email: string }) => {
    if (!confirm(t.resetPasswordConfirm)) return;
    try {
      const { password } = await api.resetPassword(member.id);
      setTempPassword({ name: member.name, email: member.email, password });
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    }
  };
  const canReset = (role: Role, isSelf: boolean) => canManageGroup && !isDemo && !isSelf && role !== 'super_admin';

  const memberActions = (member: User, isCurrentUser: boolean) => (
    <>
      {canReset(member.role, isCurrentUser) && <IconAction icon={Icons.password} label={t.resetPasswordAction} onClick={() => resetPassword(member)} />}
      {canManageGroup && !isCurrentUser && (
        <IconAction
          icon={Icons.remove}
          label={t.removeMember}
          onClick={() => {
            if (confirm(t.removeMemberConfirm)) removeMemberFromGroup(member.id);
          }}
        />
      )}
    </>
  );


  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const todayStr = todayLocal();

  const byRole = roleFilter === 'all' ? activeGroupMembers : activeGroupMembers.filter(m => m.role === roleFilter);
  const view = useTableView(byRole, {
    searchText: m => `${m.name} ${m.nameKm ?? ''} ${m.email} ${m.specialty ?? ''} ${m.role}`,
    compare: {
      name: (a, b) => a.name.localeCompare(b.name),
      email: (a, b) => a.email.localeCompare(b.email),
      role: (a, b) => a.role.localeCompare(b.role),
      specialty: (a, b) => (a.specialty ?? '').localeCompare(b.specialty ?? ''),
    },
    initialSort: { key: 'name', dir: 'asc' },
    pageSize: 10,
  });
  const filteredMembers = view.pageRows;

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'super_admin':
        return {
          label: t.superAdminBadge,
          color: 'bg-brand text-white',
          icon: <Icons.admin className="size-3 text-white" />,
        };
      case 'team_lead':
        return {
          label: t.teamLeadBadge,
          color: 'bg-neutral-200 text-black',
          icon: <Icons.role className="size-3 text-black" />,
        };
      case 'member':
        return {
          label: t.memberBadge,
          color: 'bg-neutral-100 text-black',
          icon: <Icons.activeUser className="size-3 text-neutral-500" />,
        };
      default:
        return {
          label: t.viewerBadge,
          color: 'bg-neutral-100 text-neutral-600',
          icon: <Icons.members className="size-3 text-neutral-400" />,
        };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-black tracking-tight">
              {t.manageMembers}
            </h2>
            <span className="text-xs bg-neutral-100 text-black px-2 py-0.5 rounded-lg font-semibold">
              {activeGroupMembers.length} {t.membersUnit}
            </span>
          </div>
          <p className="mt-0.5 hidden text-xs text-neutral-500 sm:block">
            {canManageGroup ? t.onlySuperAdminNotice : t.memberViewDesc}
          </p>
        </div>

      </div>

      {isSuperAdmin && (
        <div className="hidden items-center gap-2 bg-neutral-50 px-4 py-2.5 text-xs text-neutral-700 sm:flex sm:px-6">
          <Icons.admin className="size-4 text-black shrink-0" />
          <span>
            {t.membersAdminNote}
          </span>
        </div>
      )}

      <div className="p-4 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              roleFilter === 'all'
                ? 'bg-brand text-white'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            {t.adminAllStatus}
          </button>
          {([
            ['super_admin', t.roleShortAdmin],
            ['team_lead', t.roleShortLead],
            ['member', t.roleShortMember],
          ] as const).map(([role, label]) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                roleFilter === role ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <SearchBox value={view.query} onChange={view.setQuery} placeholder={t.searchMembers} />
      </div>

      <ul className="md:hidden divide-y divide-neutral-100">
        {filteredMembers.map(member => {
          const isCurrentUser = member.id === currentUser.id;
          const roleBadge = getRoleBadge(member.role);
          const submitted = activeGroupDailyLogs.some(l => l.userId === member.id && l.date === todayStr);
          const assigned = activeGroupTasks.filter(task => task.assignedTo === member.id);
          const approved = assigned.filter(task => task.status === 'approved').length;
          return (
            <li key={member.id} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Avatar name={member.name} avatar={member.avatar} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-black truncate">
                    {member.name}
                    {isCurrentUser && (
                      <span className="ml-1.5 rounded-md bg-brand px-1.5 py-px text-xs font-medium text-white">
                        {t.youLabel}
                      </span>
                    )}
                  </p>
                  {member.nameKm && <p className="text-xs text-neutral-500 truncate">{member.nameKm}</p>}
                  <p className="text-xs text-neutral-500 truncate">{member.email}</p>
                </div>
                {memberActions(member, isCurrentUser)}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {isSuperAdmin && !isCurrentUser ? (
                  <select
                    value={member.role}
                    onChange={e => updateUserRole(member.id, e.target.value as Role)}
                    className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm font-medium text-black"
                  >
                    <option value="team_lead">{t.teamLeadBadge}</option>
                    <option value="member">{t.memberBadge}</option>
                    <option value="viewer">{t.viewerBadge}</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold ${roleBadge.color}`}>
                    {roleBadge.icon}
                    {roleBadge.label}
                  </span>
                )}
                <span className="rounded-lg bg-neutral-100 px-2 py-1 font-medium text-neutral-600">
                  {submitted ? (t.postedLabel) : t.notYet}
                </span>
                <span className="rounded-lg bg-neutral-100 px-2 py-1 font-medium text-neutral-600">
                  {t.navTasks} {approved}/{assigned.length}
                </span>
              </div>
            </li>
          );
        })}
        {filteredMembers.length === 0 && (
          <li className="p-6 text-center text-sm text-neutral-500">
            {t.noMembersFound}
          </li>
        )}
      </ul>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
              <SortHeader label={t.memberName} column="name" sort={view.sort} onSort={view.toggleSort} className="py-3 px-6" />
              <SortHeader label={t.memberEmail} column="email" sort={view.sort} onSort={view.toggleSort} className="py-3 px-4" />
              <SortHeader label={t.memberRole} column="role" sort={view.sort} onSort={view.toggleSort} className="py-3 px-4" />
              <SortHeader label={t.memberSpecialty} column="specialty" sort={view.sort} onSort={view.toggleSort} className="py-3 px-4" />
              <th className="py-3 px-4 text-center">{t.todayStandupShort}</th>
              <th className="py-3 px-4 text-center">{t.navTasks}</th>
              {canManageGroup && <th className="py-3 px-6 text-right">{t.adminActions}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-xs">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                  {t.noMembersMatch}
                </td>
              </tr>
            ) : (
              filteredMembers.map(member => {
                const roleBadge = getRoleBadge(member.role);
                const isCurrentUser = member.id === currentUser.id;
                const hasSubmittedToday = activeGroupDailyLogs.some(
                  l => l.userId === member.id && l.date === todayStr
                );
                const assignedTasksCount = activeGroupTasks.filter(
                  t => t.assignedTo === member.id
                ).length;
                const completedTasksCount = activeGroupTasks.filter(
                  t => t.assignedTo === member.id && t.status === 'approved'
                ).length;

                return (
                  <tr
                    key={member.id}
                    className={`hover:bg-neutral-50 transition-colors ${
                      isCurrentUser ? 'bg-neutral-50/60' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} avatar={member.avatar} className="size-8" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-black">
                              {member.name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[11px] bg-brand text-white font-medium px-1.5 py-0.2 rounded-lg">
                                {t.youLabel}
                              </span>
                            )}
                          </div>
                          {member.nameKm && (
                            <span className="text-[11px] text-neutral-500 block">
                              {member.nameKm}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="text-black font-semibold block">
                          {member.email}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {isSuperAdmin && !isCurrentUser ? (
                        <select
                          value={member.role}
                          onChange={e => updateUserRole(member.id, e.target.value as Role)}
                          className="text-xs bg-white border border-neutral-200 rounded-lg px-2 py-1 text-black font-medium focus:outline-none focus:ring-1 focus:ring-brand/40 cursor-pointer"
                        >
                          <option value="team_lead">{t.teamLeadBadge}</option>
                          <option value="member">{t.memberBadge}</option>
                          <option value="viewer">{t.viewerBadge}</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg ${roleBadge.color}`}
                        >
                          {roleBadge.icon}
                          <span>{roleBadge.label}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-neutral-700">
                      <span>{member.specialty || 'General'}</span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {hasSubmittedToday ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-black bg-neutral-100 px-2 py-0.5 rounded-lg">
                          <Icons.done className="size-3 text-black" />
                          <span>{t.postedLabel}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-lg">
                          <Icons.time className="size-3 text-neutral-400" />
                          <span>{t.notYet}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="font-mono font-bold text-black">
                        {completedTasksCount}/{assignedTasksCount}
                      </span>
                    </td>

                    {canManageGroup && (
                      <td className="py-4 px-6 text-right">
                        {isCurrentUser ? <span className="text-[11px] italic text-neutral-400">{t.youLabel}</span> : memberActions(member, isCurrentUser)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pager page={view.page} pageCount={view.pageCount} total={view.total} onPage={view.setPage} />

      {tempPassword && <TempPasswordModal {...tempPassword} onClose={() => setTempPassword(null)} />}
    </div>
  );
};

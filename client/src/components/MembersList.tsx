import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { todayLocal } from '../lib/dates';
import { Role } from '../types';
import {
  KeyRound,
  Shield,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Clock,
  UserCheck,
  Users,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { Pager, SearchBox, SortHeader } from './TableParts';
import { TempPasswordModal } from './TempPasswordModal';
import { api } from '../lib/api';
import { useTableView } from '../lib/useTableView';

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
    language,
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
          icon: <ShieldCheck className="w-3 h-3 text-white" />,
        };
      case 'team_lead':
        return {
          label: t.teamLeadBadge,
          color: 'bg-neutral-200 text-black border border-neutral-200',
          icon: <Shield className="w-3 h-3 text-black" />,
        };
      case 'member':
        return {
          label: t.memberBadge,
          color: 'bg-white text-black border border-neutral-200',
          icon: <UserCheck className="w-3 h-3 text-neutral-500" />,
        };
      default:
        return {
          label: t.viewerBadge,
          color: 'bg-neutral-50 text-neutral-600 border border-neutral-200',
          icon: <Users className="w-3 h-3 text-neutral-400" />,
        };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
      <div className="p-4 sm:p-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-black tracking-tight">
              {t.manageMembers}
            </h2>
            <span className="text-xs bg-neutral-100 text-black px-2 py-0.5 rounded-lg font-semibold border border-neutral-200">
              {activeGroupMembers.length} {language === 'km' ? 'នាក់' : 'members'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            {canManageGroup ? t.onlySuperAdminNotice : t.memberViewDesc}
          </p>
        </div>

      </div>

      {isSuperAdmin && (
        <div className="bg-neutral-50 border-b border-neutral-200 px-4 sm:px-6 py-2.5 text-xs text-neutral-700 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-black shrink-0" />
          <span>
            {language === 'km'
              ? 'ក្នុងនាមជា Super Admin អ្នកអាចកំណត់តួនាទី ឱ្យសមាជិក បន្ថែមសមាជិកថ្មីតាម Email និងដកសមាជិកចេញបានតាមតម្រូវការ។'
              : 'As Super Admin, you can assign roles, add new members via Email, and remove members as needed.'}
          </span>
        </div>
      )}

      <div className="p-4 border-b border-neutral-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              roleFilter === 'all'
                ? 'bg-brand text-white'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            {language === 'km' ? 'ទាំងអស់' : 'All'}
          </button>
          <button
            onClick={() => setRoleFilter('super_admin')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              roleFilter === 'super_admin'
                ? 'bg-brand text-white'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setRoleFilter('team_lead')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              roleFilter === 'team_lead'
                ? 'bg-brand text-white'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            Lead
          </button>
          <button
            onClick={() => setRoleFilter('member')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              roleFilter === 'member'
                ? 'bg-brand text-white'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            Member
          </button>
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
                        {language === 'km' ? 'អ្នក' : 'You'}
                      </span>
                    )}
                  </p>
                  {member.nameKm && <p className="text-xs text-neutral-500 truncate">{member.nameKm}</p>}
                  <p className="text-xs text-neutral-500 truncate">{member.email}</p>
                </div>
                {canReset(member.role, isCurrentUser) && (
                  <button
                    onClick={() => resetPassword(member)}
                    aria-label={t.resetPasswordAction}
                    title={t.resetPasswordAction}
                    className="shrink-0 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-black"
                  >
                    <KeyRound className="size-4" />
                  </button>
                )}
                {canManageGroup && !isCurrentUser && (
                  <button
                    onClick={() => {
                      if (confirm(t.removeMemberConfirm)) removeMemberFromGroup(member.id);
                    }}
                    aria-label={t.removeMember}
                    className="shrink-0 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-black"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
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
                  {submitted ? (language === 'km' ? 'បានបញ្ចូល' : 'Submitted') : language === 'km' ? 'មិនទាន់' : 'Pending'}
                </span>
                <span className="rounded-lg bg-neutral-100 px-2 py-1 font-medium text-neutral-600">
                  {language === 'km' ? 'កិច្ចការ' : 'Tasks'} {approved}/{assigned.length}
                </span>
              </div>
            </li>
          );
        })}
        {filteredMembers.length === 0 && (
          <li className="p-6 text-center text-sm text-neutral-500">
            {language === 'km' ? 'រកមិនឃើញសមាជិក' : 'No members found.'}
          </li>
        )}
      </ul>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
              <SortHeader label={t.memberName} column="name" sort={view.sort} onSort={view.toggleSort} className="py-3 px-6" />
              <SortHeader label={t.memberEmail} column="email" sort={view.sort} onSort={view.toggleSort} className="py-3 px-4" />
              <SortHeader label={t.memberRole} column="role" sort={view.sort} onSort={view.toggleSort} className="py-3 px-4" />
              <SortHeader label={t.memberSpecialty} column="specialty" sort={view.sort} onSort={view.toggleSort} className="py-3 px-4" />
              <th className="py-3 px-4 text-center">{language === 'km' ? 'ToDo ថ្ងៃនេះ' : 'Today Standup'}</th>
              <th className="py-3 px-4 text-center">{language === 'km' ? 'កិច្ចការ' : 'Tasks'}</th>
              {canManageGroup && <th className="py-3 px-6 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-xs">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                  {language === 'km'
                    ? 'រកមិនឃើញសមាជិកដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកឡើយ'
                    : 'No members match the search criteria.'}
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
                                {language === 'km' ? 'អ្នក' : 'You'}
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
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-black bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-lg">
                          <CheckCircle2 className="w-3 h-3 text-black" />
                          <span>{language === 'km' ? 'បានបញ្ចូល' : 'Submitted'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-lg">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <span>{language === 'km' ? 'មិនទាន់' : 'Pending'}</span>
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
                        {!isCurrentUser ? (
                          <>
                          {canReset(member.role, isCurrentUser) && (
                            <button
                              onClick={() => resetPassword(member)}
                              className="mr-1 text-neutral-500 hover:text-black hover:bg-neutral-100 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                              title={t.resetPasswordAction}
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span className="text-[11px]">{t.resetPasswordAction}</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(t.removeMemberConfirm)) {
                                removeMemberFromGroup(member.id);
                              }
                            }}
                            className="text-neutral-500 hover:text-black hover:bg-neutral-100 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                            title={t.removeMember}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">{t.removeMember}</span>
                          </button>
                          </>
                        ) : (
                          <span className="text-neutral-400 text-[11px] italic">
                            {language === 'km' ? 'អ្នក' : 'You'}
                          </span>
                        )}
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

import { SupportAccessControl } from './SupportAccessControl';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { daysUntil } from '../lib/dates';
import {
  FolderKanban,
  Calendar,
  Users,
  CheckCircle2,
  Trash2,
  LogOut,
  Plus,
  ChevronDown,
  UserPlus,
  Clock,
  Layers
} from 'lucide-react';

interface GroupBannerProps {
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  onOpenAddMember: () => void;
  onOpenDeleteGroup: (groupId: string) => void;
  onOpenLeaveGroup: (groupId: string) => void;
}

export const GroupBanner: React.FC<GroupBannerProps> = ({
  onOpenCreateGroup,
  onOpenJoinGroup,
  onOpenAddMember,
  onOpenDeleteGroup,
  onOpenLeaveGroup,
}) => {
  const {
    activeGroup,
    currentUser,
    groups,
    setActiveGroupId,
    activeGroupMembers,
    activeGroupTasks,
    isSuperAdmin,
    canCreateGroup,
    canManageGroup,
    isDemo,
    updateGroupDeadline,
    t,
    language,
  } = useApp();

  const [showGroupSwitcher, setShowGroupSwitcher] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [newDeadlineInput, setNewDeadlineInput] = useState(activeGroup?.deadline || '');

  if (!activeGroup) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
        <FolderKanban className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <p className="text-neutral-700 mb-4 font-medium max-w-md mx-auto">
          {canCreateGroup ? t.noGroupSelected : t.noGroupsMember}
        </p>
        <button
          onClick={onOpenJoinGroup}
          className="px-4 py-2 mr-2 bg-white text-black border border-neutral-200 rounded-lg text-xs font-semibold hover:bg-neutral-100 transition-colors"
        >
          {t.joinGroup}
        </button>
        {canCreateGroup && (
          <button
            onClick={onOpenCreateGroup}
            className="px-4 py-2 bg-brand text-white rounded-lg text-xs font-semibold hover:bg-brand-dark transition-colors"
          >
            {t.createGroup}
          </button>
        )}
      </div>
      </div>
    );
  }

  const totalTasks = activeGroupTasks.length;
  const approvedTasks = activeGroupTasks.filter(t => t.status === 'approved').length;
  const reviewTasks = activeGroupTasks.filter(t => t.status === 'ready_for_review').length;
  const progressPercent = totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;

  const getDeadlineText = () => {
    if (!activeGroup.deadline) return null;
    const diffDays = daysUntil(activeGroup.deadline);

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} ${t.daysOverdue}`, isUrgent: true };
    } else if (diffDays === 0) {
      return { text: t.dueToday, isUrgent: true };
    } else {
      return { text: `${diffDays} ${t.daysLeft}`, isUrgent: diffDays <= 3 };
    }
  };

  const deadlineInfo = getDeadlineText();

  return (
    <div className="bg-white border-b border-neutral-200 py-4 sm:py-6 mb-4 sm:mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowGroupSwitcher(!showGroupSwitcher)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand text-white rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer hover:bg-brand-dark"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{activeGroup.code}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                {showGroupSwitcher && (
                  <div
                    className="absolute left-0 mt-1.5 w-80 bg-white rounded-xl shadow-2xl border border-neutral-200 py-2 z-50 text-left"
                    onMouseLeave={() => setShowGroupSwitcher(false)}
                  >
                    <div className="px-3 py-1.5 border-b border-neutral-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                        {t.switchGroup} ({groups.length})
                      </span>
                      {canCreateGroup && (
                        <button
                          onClick={() => {
                            setShowGroupSwitcher(false);
                            onOpenCreateGroup();
                          }}
                          className="text-[11px] text-black hover:underline font-semibold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{t.createGroup}</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1">
                      {groups.map(group => {
                        const isSelected = group.id === activeGroup.id;
                        return (
                          <button
                            key={group.id}
                            onClick={() => {
                              setActiveGroupId(group.id);
                              setShowGroupSwitcher(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs flex flex-col gap-0.5 hover:bg-neutral-100 transition-colors ${
                              isSelected ? 'bg-neutral-100 border-l-2 border-brand font-semibold' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-black">
                                {language === 'km' && group.nameKm ? group.nameKm : group.name}
                              </span>
                              <span className="font-mono text-[11px] text-neutral-600 bg-neutral-200 px-1.5 py-0.5 rounded-lg">
                                {group.code}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-500 truncate">
                              {group.courseOrProject}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <span
                className={`text-xs px-2.5 py-0.5 rounded-lg font-medium border ${
                  activeGroup.status === 'completed'
                    ? 'bg-neutral-900 text-white border-brand'
                    : 'bg-neutral-100 text-neutral-800 border-neutral-200'
                }`}
              >
                {activeGroup.status === 'completed' ? t.groupCompleted : t.activeGroups}
              </span>

              {isEditingDeadline && canManageGroup ? (
                <div className="flex items-center gap-1 bg-white border border-brand rounded-lg px-2 py-0.5 text-xs">
                  <input
                    type="date"
                    value={newDeadlineInput}
                    onChange={e => setNewDeadlineInput(e.target.value)}
                    className="text-xs bg-white text-black focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (newDeadlineInput) {
                        updateGroupDeadline(activeGroup.id, newDeadlineInput);
                      }
                      setIsEditingDeadline(false);
                    }}
                    className="px-1.5 py-0.5 bg-brand text-white rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    ✓ Save
                  </button>
                  <button
                    onClick={() => setIsEditingDeadline(false)}
                    className="text-neutral-400 hover:text-black text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => {
                    if (canManageGroup) {
                      setNewDeadlineInput(activeGroup.deadline || '');
                      setIsEditingDeadline(true);
                    }
                  }}
                  className={`flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-lg font-medium border bg-white border-neutral-200 text-neutral-800 ${
                    canManageGroup ? 'hover:border-brand cursor-pointer' : ''
                  }`}
                  title={canManageGroup ? 'Click to change deadline' : undefined}
                >
                  <Calendar className="w-3 h-3 text-black" />
                  <span>
                    {activeGroup.deadline ? `${activeGroup.deadline} (${deadlineInfo?.text})` : 'No Deadline'}
                  </span>
                  {canManageGroup && (
                    <span className="text-[11px] text-neutral-400 ml-1">✎</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
                {language === 'km' && activeGroup.nameKm ? activeGroup.nameKm : activeGroup.name}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-3xl">
                <span className="font-semibold text-black">{activeGroup.courseOrProject}</span>
                <span className="mx-1.5 hidden text-neutral-300 sm:inline">·</span>
                <span className="hidden sm:inline">{activeGroup.description}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4">
            <div className="hidden items-center gap-3 text-xs sm:flex">
              <div className="flex items-center gap-1 text-neutral-700">
                <Users className="w-4 h-4 text-neutral-500" />
                <span className="font-bold text-black font-mono-numbers">
                  {activeGroupMembers.length}
                </span>
                <span>{t.navMembers}</span>
              </div>
              <span className="text-neutral-300">|</span>
              <div className="flex items-center gap-1 text-neutral-700">
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span className="font-bold text-black font-mono-numbers">
                  {approvedTasks}/{totalTasks}
                </span>
                <span>{t.doneLabel}</span>
                <span className="font-bold font-mono-numbers text-black">
                  ({progressPercent}%)
                </span>
              </div>
              {reviewTasks > 0 && (
                <>
                  <span className="text-neutral-300">|</span>
                  <div className="flex items-center gap-1 text-neutral-900 font-medium">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <span className="font-mono-numbers font-bold">{reviewTasks}</span>
                    <span>{t.pendingLabel}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeGroup.leaderId === currentUser.id && !isSuperAdmin && !isDemo && <SupportAccessControl />}

              {canManageGroup && (
                <button
                  onClick={onOpenAddMember}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-dark rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t.addMember}</span>
                </button>
              )}

              {activeGroup.memberIds.includes(currentUser.id) && (
              <button
                onClick={() => onOpenLeaveGroup(activeGroup.id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-black bg-white hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer border border-neutral-200"
                title={t.leaveGroup}
              >
                <LogOut className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline">{t.leaveGroup}</span>
              </button>
              )}

              {isSuperAdmin && (
                <button
                  onClick={() => onOpenDeleteGroup(activeGroup.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer border border-neutral-200"
                  title={t.deleteGroup}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.deleteGroup}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

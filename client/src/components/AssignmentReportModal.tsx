import React from 'react';
import { createPortal } from 'react-dom';
import type { DailyLogStatus, Role, Task, User } from '@shared/types';
import { useApp } from '../context/AppContext';
import { localDateOf, todayLocal } from '../lib/dates';
import { printPage } from '../lib/printPage';
import { Icons } from './icons';

interface AssignmentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTION = 'mb-3 text-sm font-bold text-black';
const TABLE = 'w-full border-collapse text-left text-xs';
const HEAD_ROW = 'border-b-2 border-brand bg-neutral-100 font-bold text-black print:bg-transparent';

/** The group report page. */
export const AssignmentReportModal: React.FC<AssignmentReportModalProps> = ({ isOpen, onClose }) => {
  const { activeGroup, activeGroupMembers, activeGroupTasks, activeGroupDailyLogs, users, language, t } = useApp();

  if (!isOpen || !activeGroup) return null;

  const km = language === 'km';
  const nameOf = (user?: User) => (user ? (km && user.nameKm ? user.nameKm : user.name) : '');
  const leader = users.find(u => u.id === activeGroup.leaderId);
  const totalTasks = activeGroupTasks.length;
  const approvedTasks = activeGroupTasks.filter(task => task.status === 'approved').length;
  const progressPercent = totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;

  const colon = t.colon;
  const reference = `LS/${activeGroup.code}/${todayLocal().replaceAll('-', '')}`;
  const roleLabel: Record<Role, string> = { super_admin: t.superAdminBadge, team_lead: t.teamLeadBadge, member: t.memberBadge, viewer: t.viewerBadge };
  const taskStatus: Record<Task['status'], string> = {
    todo: t.taskStatusTodo,
    in_progress: t.taskStatusInProgress,
    ready_for_review: t.taskStatusReview,
    approved: t.taskStatusApproved,
  };
  const logStatus: Record<DailyLogStatus, string> = { in_progress: t.taskStatusInProgress, completed: t.reportLogDone, approved: t.taskStatusApproved };

  return createPortal(
    <div className="modal-overlay print-root report-paper fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-2xs">
      <div className="modal-panel max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 print:hidden">
          <div className="flex items-center gap-2 text-base font-bold text-black">
            <Icons.report className="size-5" />
            <span>{t.tabReport}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => printPage()}
              aria-label={t.printReport}
              title={t.printReport}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-dark"
            >
              <Icons.print className="size-4" />
              <span className="hidden sm:inline">{t.printReport}</span>
            </button>
            <button
              onClick={onClose}
              aria-label={t.close}
              className="cursor-pointer rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-black"
            >
              <Icons.close className="size-5" />
            </button>
          </div>
        </div>

        <div className="space-y-8 p-8 print:p-0">
          <div className="keep-together text-center">
            <p className="text-xs font-bold tracking-widest text-brand">LeaderSync</p>
            <div className="mx-auto mt-2 h-px w-24 bg-brand" />
            <h1 className="mt-4 text-xl font-bold leading-snug text-black">{t.reportOfficial}</h1>
            <p className="mt-1 text-base font-semibold text-black">{km && activeGroup.nameKm ? activeGroup.nameKm : activeGroup.name}</p>
            {activeGroup.courseOrProject && <p className="text-sm text-neutral-600">{activeGroup.courseOrProject}</p>}
          </div>

          <table className={`${TABLE} keep-together border border-neutral-300`}>
            <tbody className="divide-y divide-neutral-300">
              {[
                [t.reportRef, reference, t.reportDate, todayLocal()],
                [t.reportCode, activeGroup.code, t.reportCategory, activeGroup.category || '—'],
                [t.reportLeader, `${nameOf(leader)}${leader?.email ? ` · ${leader.email}` : ''}`, t.reportPeriod, `${localDateOf(activeGroup.createdAt)} → ${activeGroup.deadline || t.reportNoDeadline}`],
                [t.reportSummary, `${activeGroupMembers.length} ${t.reportMembersCount} · ${totalTasks} ${t.colTasks} · ${approvedTasks} ${t.reportApprovedCount}`, t.reportProgress, `${progressPercent}%`],
              ].map(([k1, v1, k2, v2]) => (
                <tr key={k1}>
                  <th className="w-[15%] bg-neutral-100 px-3 py-2 font-bold text-black print:bg-transparent">{k1}{colon}</th>
                  <td className="w-[40%] px-3 py-2 text-black">{v1}</td>
                  <th className="w-[15%] bg-neutral-100 px-3 py-2 font-bold text-black print:bg-transparent">{k2}{colon}</th>
                  <td className="px-3 py-2 text-black">{v2}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {activeGroup.description && (
            <p className="text-xs leading-relaxed text-neutral-700">
              <span className="font-bold text-black">{t.reportPurpose}{colon} </span>
              {activeGroup.description}
            </p>
          )}

          <div>
            <h3 className={SECTION}>{t.reportSectionMembers}</h3>
            <table className={TABLE}>
              <thead>
                <tr className={HEAD_ROW}>
                  <th className="w-10 px-3 py-2.5">{t.reportColNo}</th>
                  <th className="px-3 py-2.5">{t.reportColMember}</th>
                  <th className="px-3 py-2.5">{t.reportColEmail}</th>
                  <th className="px-3 py-2.5">{t.reportColSpecialty}</th>
                  <th className="px-3 py-2.5">{t.reportColRole}</th>
                  <th className="px-3 py-2.5 text-right">{t.reportColApproved}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {activeGroupMembers.map((member, index) => {
                  const mine = activeGroupTasks.filter(task => task.assignedTo === member.id);
                  const done = mine.filter(task => task.status === 'approved').length;
                  return (
                    <tr key={member.id}>
                      <td className="px-3 py-2.5 text-neutral-500">{index + 1}</td>
                      <td className="px-3 py-2.5 font-semibold text-black">{nameOf(member)}</td>
                      <td className="px-3 py-2.5 text-neutral-600">{member.email}</td>
                      <td className="px-3 py-2.5 text-neutral-700">{member.specialty || t.reportGeneral}</td>
                      <td className="px-3 py-2.5 font-medium text-black">{roleLabel[member.role]}</td>
                      <td className="px-3 py-2.5 text-right font-bold">
                        {done}/{mine.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className={SECTION}>{t.reportSectionTasks}</h3>
            <table className={TABLE}>
              <thead>
                <tr className={HEAD_ROW}>
                  <th className="w-10 px-3 py-2.5">{t.reportColNo}</th>
                  <th className="px-3 py-2.5">{t.colTitle}</th>
                  <th className="px-3 py-2.5">{t.colAssignee}</th>
                  <th className="px-3 py-2.5">{t.reportColDeadline}</th>
                  <th className="px-3 py-2.5">{t.colStatus}</th>
                  <th className="px-3 py-2.5">{t.reportColCheck}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {activeGroupTasks.map((task, index) => (
                  <tr key={task.id}>
                    <td className="px-3 py-2.5 text-neutral-500">{index + 1}</td>
                    <td className="px-3 py-2.5">
                      <span className="block font-bold text-black">{task.title}</span>
                      <span className="text-[11px] text-neutral-500">{task.module}</span>
                    </td>
                    <td className="px-3 py-2.5 text-neutral-700">{nameOf(activeGroupMembers.find(m => m.id === task.assignedTo)) || t.ganttNobody}</td>
                    <td className="px-3 py-2.5 text-neutral-600">{task.dueDate}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block rounded-lg px-2 py-0.5 text-[11px] font-bold ${task.status === 'approved' ? 'bg-brand text-white print:border print:border-brand print:bg-transparent print:text-brand' : 'bg-neutral-200 text-black print:border print:border-neutral-500 print:bg-transparent'}`}>
                        {taskStatus[task.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 italic text-neutral-700">{task.leaderFeedback || (task.status === 'approved' ? t.reportVerified : t.reportPending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className={SECTION}>{t.reportSectionLogs}</h3>
            {activeGroupDailyLogs.length === 0 ? (
              <p className="text-xs text-neutral-500">{t.reportNoLogs}</p>
            ) : (
              <div className="space-y-2.5">
                {activeGroupDailyLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="keep-together space-y-1 rounded-lg border border-neutral-300 bg-neutral-50 p-3 print:bg-transparent text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-black">
                        {nameOf(activeGroupMembers.find(m => m.id === log.userId))} · {log.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-neutral-500">
                        {log.date} · {logStatus[log.status]}
                      </span>
                    </div>
                    <p className="whitespace-pre-line rounded-lg border border-neutral-200 bg-white p-2 text-[11px] print:border-0 print:p-0 text-neutral-800">{log.rawContent}</p>
                    {log.leaderNote && (
                      <p className="pt-1 text-[11px] font-semibold text-black">
                        ↳ {t.reportLeaderNote}{colon} “{log.leaderNote}”
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="keep-together space-y-6 border-t border-neutral-400 pt-6 text-xs">
            <p className="text-neutral-700">
              {t.reportPlaceDate}{colon} ........................................................
            </p>
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                [t.reportPreparedBy, nameOf(leader), t.teamLeadBadge],
                [t.reportReviewedBy, '', t.reportReviewerRole],
                [t.reportApprovedBy, '', t.reportStamp],
              ].map(([title, name, note]) => (
                <div key={title} className="flex h-40 flex-col justify-between">
                  <span className="font-bold text-black">{title}</span>
                  <div className="border-t border-neutral-500 pt-2">
                    <span className="block h-4 font-bold text-black">{name}</span>
                    <span className="text-[11px] text-neutral-500">{note}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-[11px] text-neutral-500">
              {t.printGenerated} {todayLocal()} · {reference}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

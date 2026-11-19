import { DailyLogEditor } from './daily/DailyLogEditor';
import { ReactionBar } from './ReactionBar';
import { dailyLogPercent } from '../lib/stats';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime } from '../lib/dates';
import { Avatar } from './Avatar';
import { Pager, SearchBox } from './TableParts';
import { useTableView } from '../lib/useTableView';
import { CommentThread } from './CommentThread';
import { Icons } from './icons';
import { DatePicker } from './pickers/DatePicker';
import { FilterPanel, SegmentGroup, StatusChips } from './FilterControls';
import { todayLocal } from '../lib/dates';
import { peekPagePreset } from '../lib/pagePreset';
import { matchesDay, type When } from '../lib/taskFilters';

export const DailyFeed: React.FC = () => {
  const {
    activeGroupDailyLogs,
    users,
    currentUser,
    isTeamLead,
    canContribute,
    toggleDailyTodoItem,
    markDailyLogDone,
    approveDailyLog,
    reopenDailyLog,
    deleteDailyLog,
    addReactionToDailyLog,
    t,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  type Mode = 'all' | 'in_progress' | 'completed' | 'approved';
  // A card on the Overview can open this page already filtered
  const [preset] = useState(() => peekPagePreset('daily'));
  const [filterMode, setFilterMode] = useState<Mode>((preset?.status as Mode | undefined) ?? 'all');
  const [scope, setScope] = useState<'all' | 'mine'>(preset?.scope === 'mine' ? 'mine' : 'all');
  const [when, setWhen] = useState<When>(preset?.when === 'today' || preset?.when === 'range' ? preset.when : 'any');
  const [range, setRange] = useState({ from: '', to: '' });
  const [activeLeaderNoteId, setActiveLeaderNoteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [leaderFeedbackText, setLeaderFeedbackText] = useState<{ [id: string]: string }>({});

  const today = todayLocal();

  // Every filter except the status, so each status button can show how many it would give
  const matchesOthers = (log: (typeof activeGroupDailyLogs)[number], skip?: 'when') => {
    if (scope === 'mine' && log.userId !== currentUser.id) return false;
    if (skip !== 'when' && !matchesDay(log.date, when, today, range)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const author = users.find(u => u.id === log.userId);
      const fullText = (author?.name.toLowerCase() || '') + log.title.toLowerCase() + log.rawContent.toLowerCase();
      if (!fullText.includes(q)) return false;
    }
    return true;
  };

  const otherMatches = activeGroupDailyLogs.filter(log => matchesOthers(log));
  const filteredLogs = filterMode === 'all' ? otherMatches : otherMatches.filter(log => log.status === filterMode);
  const statusCount = (mode: Mode) => (mode === 'all' ? otherMatches : otherMatches.filter(log => log.status === mode)).length;
  const todayCount = activeGroupDailyLogs.filter(log => matchesOthers(log, 'when') && log.date === today).length;
  const isAnyFilterActive = filterMode !== 'all' || scope !== 'all' || when !== 'any' || searchQuery.trim().length > 0;
  const resetFilters = () => {
    setFilterMode('all');
    setScope('all');
    setWhen('any');
    setRange({ from: '', to: '' });
    setSearchQuery('');
  };

  const view = useTableView(filteredLogs, {
    searchText: () => '',
    compare: { newest: (a, b) => a.timestamp.localeCompare(b.timestamp) },
    initialSort: { key: 'newest', dir: 'desc' },
    pageSize: 8,
  });

  const handleApproveWithNote = (logId: string) => {
    const note = leaderFeedbackText[logId]?.trim();
    approveDailyLog(logId, note || 'Approved by Group Leader');
    setActiveLeaderNoteId(null);
  };

  return (
    <div className="space-y-4">
      <FilterPanel>
        <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder={t.searchDaily} />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
          <SegmentGroup
            label={t.filterScopeLabel}
            value={scope}
            onChange={setScope}
            options={[
              { value: 'all', label: t.all },
              { value: 'mine', label: t.filterScopeMine },
            ]}
          />
          <SegmentGroup
            label={t.filterWhenLabel}
            value={when === 'overdue' || when === 'week' ? 'any' : when}
            onChange={setWhen}
            options={[
              { value: 'any', label: t.filterAnyTime },
              { value: 'today', label: t.filterToday, count: todayCount },
              { value: 'range', label: t.filterRange, icon: <Icons.date className="size-3.5" /> },
            ]}
          />
          {when === 'range' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-neutral-600">{t.filterFrom}</span>
              <DatePicker value={range.from} onChange={from => setRange(r => ({ ...r, from, to: r.to && from && r.to < from ? from : r.to }))} max={range.to || undefined} clearable placeholder={t.filterAnyDate} className="w-40" />
              <span className="font-semibold text-neutral-600">{t.filterTo}</span>
              <DatePicker value={range.to} onChange={to => setRange(r => ({ ...r, to }))} min={range.from || undefined} clearable placeholder={t.filterAnyDate} className="w-40" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
          <StatusChips
            value={filterMode}
            onChange={setFilterMode}
            options={[
              { value: 'all', label: t.all, count: statusCount('all') },
              { value: 'in_progress', label: t.taskStatusInProgress, count: statusCount('in_progress') },
              { value: 'completed', label: t.taskStatusReview, count: statusCount('completed') },
              { value: 'approved', label: t.taskStatusApproved, count: statusCount('approved') },
            ]}
          />
          {isAnyFilterActive && (
            <button onClick={resetFilters} className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-black hover:underline">
              <Icons.close className="size-3" />
              <span>{t.filterClear}</span>
            </button>
          )}
        </div>
      </FilterPanel>

      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Icons.time className="size-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-black">{t.noDailyLogsFound}</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            {t.dailyFeedEmptyHint}
          </p>
        </div>
      ) : (
        <>
        <div className="stagger space-y-4">
          {view.pageRows.map(log => {
            const author = users.find(u => u.id === log.userId) || {
              id: log.userId,
              name: t.memberBadge,
              email: '',
              role: 'member',
            };

            const isAuthor = log.userId === currentUser.id;
            // An approved update is locked for everyone until a leader reopens it
            const canEditChecklist = log.status !== 'approved' && (isTeamLead || (isAuthor && canContribute));
            const canEditText = canEditChecklist && editingId !== log.id;
            const calcPercent = dailyLogPercent(log.items);

            return (
              <div
                key={log.id}
                className="lift bg-white rounded-xl border border-neutral-200 p-5 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={author.name} avatar={author.avatar} className="size-9" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-black">
                          {author.name}
                        </span>
                        {author.nameKm && (
                          <span className="text-xs text-neutral-500 hidden sm:inline">
                            ({author.nameKm})
                          </span>
                        )}
                        <span className="text-[11px] text-neutral-500">{author.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                        <span className="font-semibold text-black bg-neutral-100 px-2 py-0.2 rounded-lg">
                          {log.title}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-neutral-500">
                          <Icons.date className="size-3 text-neutral-400" />
                          <span>{formatDateTime(log.timestamp)}</span>
                          {log.editedAt && <span className="italic">· {t.commentEdited}</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {log.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-brand px-2.5 py-0.5 rounded-lg">
                        <Icons.done className="size-3.5 text-white" />
                        <span>{t.taskStatusApproved}</span>
                      </span>
                    )}
                    {log.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-black bg-neutral-200 px-2.5 py-0.5 rounded-lg">
                        <Icons.time className="size-3.5 text-black" />
                        <span>{t.taskStatusReview}</span>
                      </span>
                    )}
                    {log.status === 'in_progress' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-800 bg-neutral-100 px-2.5 py-0.5 rounded-lg">
                        <span>{t.taskStatusInProgress}</span>
                        {calcPercent !== null && <span className="font-mono-numbers font-bold">({calcPercent}%)</span>}
                      </span>
                    )}

                    {canEditText && (
                      <button
                        onClick={() => setEditingId(log.id)}
                        className="text-neutral-500 hover:text-black p-1 rounded-lg transition-colors cursor-pointer"
                        title={t.dailyEdit}
                        aria-label={t.dailyEdit}
                      >
                        <Icons.edit className="size-3.5" />
                      </button>
                    )}
                    {(isAuthor || isTeamLead) && (
                      <button
                        onClick={() => {
                          if (confirm(t.deleteLogConfirm)) {
                            deleteDailyLog(log.id);
                          }
                        }}
                        className="text-neutral-400 hover:text-black p-1 rounded-lg transition-colors cursor-pointer"
                        title={t.delete}
                      >
                        <Icons.remove className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {editingId === log.id ? (
                  <DailyLogEditor log={log} onClose={() => setEditingId(null)} />
                ) : (
                <div className="py-4 space-y-1.5">
                  {log.items.length > 0 ? (
                    <div className="space-y-1.5">
                      {log.items.map((item, i) => (
                        <React.Fragment key={item.id}>
                        {item.group && item.group !== log.items[i - 1]?.group && (
                          <p className="px-2 pt-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">{item.group}</p>
                        )}
                        <div
                          onClick={() => canEditChecklist && toggleDailyTodoItem(log.id, item.id)}
                          className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors text-xs ${
                            canEditChecklist ? 'cursor-pointer' : 'cursor-default'
                          } ${
                            item.done
                              ? 'bg-neutral-50 text-neutral-400 line-through'
                              : 'hover:bg-neutral-50 text-black'
                          }`}
                        >
                          <div className="mt-0.5 text-black shrink-0">
                            {item.done ? (
                              <Icons.daily className="size-4 text-black" />
                            ) : (
                              <Icons.todoOpen className="size-4 text-neutral-400" />
                            )}
                          </div>
                          <div className="flex-1 flex items-center justify-between gap-2">
                            <span className="font-medium text-sm leading-snug">
                              {item.text}
                            </span>
                            {item.progressTag && (
                              <span
                                className={`font-mono-numbers text-[11px] font-bold px-1.5 py-0.5 rounded-lg ${
                                  item.done
                                    ? 'bg-neutral-200 text-neutral-800'
                                    : 'bg-brand text-white'
                                }`}
                              >
                                {item.progressTag}
                              </span>
                            )}
                          </div>
                        </div>
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-black whitespace-pre-line leading-relaxed bg-neutral-50 p-3 rounded-lg">
                      {log.rawContent}
                    </p>
                  )}
                </div>
                )}

                {log.leaderChecked && log.leaderNote && (
                  <div className="p-3 mb-3 bg-neutral-50 rounded-lg text-xs flex items-start gap-2.5 text-black">
                    <Icons.approved className="size-4 text-black shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold text-black mb-0.5">
                        {t.leaderFeedbackLabel}
                      </div>
                      <p className="font-medium text-neutral-700">"{log.leaderNote}"</p>
                    </div>
                  </div>
                )}

                {isTeamLead && log.status === 'completed' && (
                  <div className="mb-3">
                    {activeLeaderNoteId === log.id ? (
                      <div className="p-3 bg-neutral-50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-black">
                          <span>{t.approveWithFeedback}</span>
                          <button
                            onClick={() => setActiveLeaderNoteId(null)}
                            className="text-neutral-500 hover:text-black text-xs"
                          >
                            {t.cancel}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={leaderFeedbackText[log.id] || ''}
                            onChange={e =>
                              setLeaderFeedbackText(prev => ({ ...prev, [log.id]: e.target.value }))
                            }
                            placeholder={t.writeAComment}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/40"
                          />
                          <button
                            type="button"
                            onClick={() => handleApproveWithNote(log.id)}
                            className="px-3.5 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Icons.confirm className="size-3.5" />
                            <span>{t.approveButton}</span>
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {log.status === 'in_progress' && canEditChecklist && (
                      <button
                        onClick={() => markDailyLogDone(log.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-black border border-neutral-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Icons.confirm className="size-3.5" />
                        <span>{t.btnMarkDone}</span>
                      </button>
                    )}

                    {isTeamLead && log.status === 'approved' && (
                      <button
                        onClick={() => reopenDailyLog(log.id)}
                        title={t.approvedLockedHint}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-black border border-neutral-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Icons.edit className="size-3.5" />
                        <span>{t.btnReopen}</span>
                      </button>
                    )}

                    {isTeamLead && log.status === 'completed' && activeLeaderNoteId !== log.id && (
                      <button
                        onClick={() => setActiveLeaderNoteId(log.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        <Icons.approved className="size-3.5" />
                        <span>{t.btnApproveTask}</span>
                      </button>
                    )}
                  </div>

                  <ReactionBar reactions={log.reactions} canReact={canContribute} onToggle={emoji => addReactionToDailyLog(log.id, emoji)} />
                </div>

                <div className="pt-3">
                  <CommentThread kind="daily_log" targetId={log.id} count={log.commentCount ?? 0} />
                </div>
              </div>
            );
          })}
        </div>
        <Pager page={view.page} pageCount={view.pageCount} total={view.total} onPage={view.setPage} />
        </>
      )}
    </div>
  );
};

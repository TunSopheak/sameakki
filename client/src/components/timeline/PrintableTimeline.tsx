import React, { type CSSProperties } from 'react';
import type { Task, User } from '@shared/types';
import { useApp } from '../../context/AppContext';
import { todayLocal } from '../../lib/dates';
import { buildExportLabels } from './exportLabels';
import { exportHeaders, exportRowCells, exportRows } from './exportModel';
import { chartRange, clipSpan, fromDay, isLate, isWeekend, monthSegments, spanDays, toDay, toItem, weekday } from './ganttModel';
import { APP_NAME } from '../../lib/brand';

// Fixed colours: paper is white
const INK = '#1a1410';
const MUTED = '#6f645b';
const LINE = '#d3cbc2';
const BRAND = '#840015';

const BAR: Record<Task['status'], CSSProperties> = {
  todo: { background: '#f3f0ec', border: `1px dashed ${MUTED}`, color: INK },
  in_progress: { background: '#4a3f37', border: '1px solid #4a3f37', color: '#ffffff' },
  ready_for_review: { background: '#fceaed', border: `1px solid ${BRAND}`, color: BRAND },
  approved: { background: BRAND, border: `1px solid ${BRAND}`, color: '#ffffff' },
};

const LABEL_WIDTH = 200;
const ROW_HEIGHT = 26;

interface PrintableTimelineProps {
  groupName: string;
  tasks: Task[];
  users: User[];
  teamDeadline?: string;
}

/** The timeline as a printable page. */
export const PrintableTimeline: React.FC<PrintableTimelineProps> = ({ groupName, tasks, users, teamDeadline }) => {
  const { t, language } = useApp();
  const labels = buildExportLabels(t);
  const locale = language === 'km' ? 'km-KH' : 'en-GB';
  const today = toDay(todayLocal());

  const rows = exportRows(tasks, users, labels, language);
  const items = tasks
    .map(toItem)
    .sort((a, b) => a.start - b.start || a.end - b.end || a.task.title.localeCompare(b.task.title));
  const deadline = teamDeadline ? toDay(teamDeadline) : undefined;
  const { from, to } = chartRange(items, today, deadline === undefined ? [] : [deadline], { before: 1, after: 1 }, 14);
  const total = to - from + 1;
  const pct = (day: number) => ((day - from) / total) * 100;
  const days = Array.from({ length: total }, (_, i) => from + i);
  const everyDay = total <= 62;
  const dayOfMonth = (day: number) => new Date(day * 86_400_000).getUTCDate();
  const monthName = (day: number) => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(day * 86_400_000));

  return (
    <div className="print-root timeline-paper hidden bg-white p-0 text-[11px] print:block" style={{ color: INK, background: '#ffffff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `2px solid ${BRAND}`, paddingBottom: 6, marginBottom: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>{groupName}</h1>
          <p style={{ color: MUTED }}>
            {t.viewTimeline} · {fromDay(from)} → {fromDay(to)} · {tasks.length} {t.colTasks}
          </p>
        </div>
        <p style={{ color: MUTED, textAlign: 'right' }}>
          {APP_NAME}
          <br />
          {t.printGenerated} {fromDay(today)}
        </p>
      </header>

      <section style={{ border: `1px solid ${LINE}`, marginBottom: 12 }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${LINE}`, background: '#faf8f6' }}>
          <div style={{ width: LABEL_WIDTH, flexShrink: 0, borderRight: `1px solid ${LINE}` }} />
          <div style={{ position: 'relative', flex: 1, height: everyDay ? 38 : 22 }}>
            {monthSegments(from, to).map(seg => (
              <div
                key={seg.key}
                style={{ position: 'absolute', top: 0, left: `${pct(seg.from)}%`, width: `${(seg.days / total) * 100}%`, height: 20, borderLeft: `1px solid ${LINE}`, overflow: 'hidden', whiteSpace: 'nowrap', padding: '2px 4px', fontWeight: 700 }}
              >
                {seg.days / total > 0.12 ? monthName(seg.from) : ''}
              </div>
            ))}
            {days.map(day => {
              if (!everyDay && weekday(day) !== 1) return null;
              return (
                <span
                  key={day}
                  style={{ position: 'absolute', top: 21, left: `${pct(day)}%`, width: `${(1 / total) * 100 * (everyDay ? 1 : 7)}%`, textAlign: 'center', fontSize: 9, color: isWeekend(day) ? '#9a9088' : MUTED, fontWeight: day === today ? 700 : 400 }}
                >
                  {dayOfMonth(day)}
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: LABEL_WIDTH, right: 0, pointerEvents: 'none' }}>
            {days.filter(isWeekend).map(day => (
              <span key={day} style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(day)}%`, width: `${100 / total}%`, background: '#f3f0ec' }} />
            ))}
            {deadline !== undefined && deadline >= from && deadline <= to && (
              <span style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(deadline + 1)}%`, borderLeft: `2px dashed ${BRAND}` }} />
            )}
            <span style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(today) + 50 / total}%`, borderLeft: `2px solid ${BRAND}` }} />
          </div>

          {items.map(item => {
            const { task } = item;
            const shown = clipSpan(item, from, to);
            const late = isLate(task, today);
            return (
              <div key={task.id} style={{ position: 'relative', display: 'flex', height: ROW_HEIGHT, borderBottom: `1px solid #ece7e1`, breakInside: 'avoid' }}>
                <div style={{ width: LABEL_WIDTH, flexShrink: 0, borderRight: `1px solid ${LINE}`, padding: '0 6px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                  <p style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: task.status === 'approved' ? 'line-through' : 'none' }}>{task.title}</p>
                </div>
                <div style={{ position: 'relative', flex: 1 }}>
                  {shown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 4,
                        height: ROW_HEIGHT - 8,
                        left: `${pct(shown.start)}%`,
                        width: `${(spanDays(shown) / total) * 100}%`,
                        borderRadius: 4,
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 4px',
                        fontSize: 9,
                        fontWeight: 600,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        outline: late ? `2px solid ${BRAND}` : 'none',
                        outlineOffset: 1,
                        ...BAR[task.status],
                      }}
                    >
                      {spanDays(item)} {t.ganttDaysShort}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 9, color: MUTED, marginBottom: 12 }}>
        {(['todo', 'in_progress', 'ready_for_review', 'approved'] as const).map(status => (
          <span key={status} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, display: 'inline-block', ...BAR[status] }} />
            {labels.statuses[status]}
          </span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, display: 'inline-block', outline: `2px solid ${BRAND}` }} />
          {t.ganttOverdue}
        </span>
        <span>| {t.ganttToday}</span>
        {deadline !== undefined && <span>┆ {t.ganttTeamDeadline}</span>}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
        <thead style={{ display: 'table-header-group' }}>
          <tr>
            {exportHeaders(labels).map(header => (
              <th key={header} style={{ textAlign: 'left', padding: '4px 6px', background: BRAND, color: '#ffffff', fontWeight: 700 }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ breakInside: 'avoid', background: i % 2 ? '#faf8f6' : '#ffffff' }}>
              {exportRowCells(row).map((cell, j) => (
                <td key={j} style={{ padding: '4px 6px', borderBottom: `1px solid #ece7e1`, verticalAlign: 'top', whiteSpace: j === 8 ? 'normal' : 'nowrap', maxWidth: j === 8 ? 260 : undefined }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

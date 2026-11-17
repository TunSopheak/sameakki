import React, { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import type { Task, User } from '@shared/types';
import { useApp } from '../../context/AppContext';
import { todayLocal } from '../../lib/dates';
import { Avatar } from '../Avatar';
import { Icons } from '../icons';
import {
  DAY_MS,
  buildRows,
  chartRange,
  clipSpan,
  dragSpan,
  fromDay,
  isLate,
  isWeekend,
  monthSegments,
  pixelsToDays,
  spanDays,
  toDay,
  weekday,
  type DragMode,
  type GanttItem,
  type GanttRow,
  type Span,
} from './ganttModel';

export const ZOOM_PX = { day: 44, week: 18, month: 7 } as const;
export type Zoom = keyof typeof ZOOM_PX;

const ROW_HEIGHT = 44;
const HEADER_ROW_HEIGHT = 36;
const BAR_HEIGHT = 28;

// Fixed colours for "in progress": the grey tokens swap in dark mode
export const STATUS_STYLE: Record<Task['status'], string> = {
  todo: 'border border-dashed border-neutral-500 bg-neutral-100 text-black',
  in_progress: 'border border-[#8c8178] bg-[#4a3f37] text-[#ffffff]',
  ready_for_review: 'border border-brand bg-brand-soft text-brand-ink',
  approved: 'bg-brand text-white',
};

interface Drag {
  id: string;
  mode: DragMode;
  startX: number;
  delta: number;
}

interface GanttChartProps {
  tasks: Task[];
  members: User[];
  groupBy: 'task' | 'member';
  zoom: Zoom;
  teamDeadline?: string;
  selectedId: string | null;
  canEdit: (task: Task) => boolean;
  onSelect: (id: string | null) => void;
  onReschedule: (task: Task, startDate: string, dueDate: string) => Promise<void>;
  focusToken: number;
}

/** Tasks as bars on a calendar. Drag a bar to change its dates. */
export const GanttChart: React.FC<GanttChartProps> = ({ tasks, members, groupBy, zoom, teamDeadline, selectedId, canEdit, onSelect, onReschedule, focusToken }) => {
  const { t, language, users } = useApp();
  const locale = language === 'km' ? 'km-KH' : 'en-GB';
  const today = toDay(todayLocal());
  const px = ZOOM_PX[zoom];

  const rows = useMemo(() => buildRows(tasks, members, groupBy), [tasks, members, groupBy]);
  const spans = useMemo(() => rows.flatMap(r => r.items), [rows]);
  const deadlineDay = teamDeadline ? toDay(teamDeadline) : undefined;
  const { from, to } = chartRange(spans, today, deadlineDay === undefined ? [] : [deadlineDay]);
  const trackWidth = (to - from + 1) * px;

  const [drag, setDrag] = useState<Drag | null>(null);
  const [pending, setPending] = useState<Record<string, Span>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ left: Math.max(0, (today - from) * px - el.clientWidth * 0.35), behavior: focusToken ? 'smooth' : 'auto' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusToken, zoom]);

  const spanOf = (item: GanttItem): Span => (drag?.id === item.task.id ? dragSpan(item, drag.mode, drag.delta, { from, to }) : (pending[item.task.id] ?? item));

  const begin = (e: PointerEvent<HTMLElement>, item: GanttItem, mode: DragMode) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id: item.task.id, mode, startX: e.clientX, delta: 0 });
  };
  const move = (e: PointerEvent<HTMLElement>, item: GanttItem) => {
    // Touch scrolls the chart; leaders edit dates in the details panel
    if (!drag || drag.id !== item.task.id || e.pointerType === 'touch' || !canEdit(item.task)) return;
    const delta = pixelsToDays(e.clientX - drag.startX, px);
    if (delta !== drag.delta) setDrag({ ...drag, delta });
  };
  const finish = async (item: GanttItem) => {
    if (!drag || drag.id !== item.task.id) return;
    const done = drag;
    setDrag(null);
    if (done.delta === 0) return onSelect(item.task.id);
    const next = dragSpan(item, done.mode, done.delta, { from, to });
    if (next.start === item.start && next.end === item.end) return;
    setPending(p => ({ ...p, [item.task.id]: next }));
    try {
      await onReschedule(item.task, fromDay(next.start), fromDay(next.end));
    } finally {
      setPending(p => Object.fromEntries(Object.entries(p).filter(([id]) => id !== item.task.id)));
    }
  };

  const formatMonth = (day: number, wide: boolean) =>
    new Intl.DateTimeFormat(locale, { month: wide ? 'long' : 'short', year: wide ? 'numeric' : undefined, timeZone: 'UTC' }).format(new Date(day * DAY_MS));
  const dayOfMonth = (day: number) => new Date(day * DAY_MS).getUTCDate();
  const weekdayLetter = (day: number) => new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(day * DAY_MS));

  const days = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const showDayRow = zoom !== 'month';
  const headerHeight = HEADER_ROW_HEIGHT + (showDayRow ? HEADER_ROW_HEIGHT : 0);
  const firstMonday = (8 - weekday(from)) % 7;
  const gridLine = 'color-mix(in srgb, var(--color-neutral-400) 22%, transparent)';
  const trackBackground =
    zoom === 'day'
      ? { backgroundImage: `linear-gradient(to right, ${gridLine} 1px, transparent 1px)`, backgroundSize: `${px}px 100%` }
      : { backgroundImage: `linear-gradient(to right, ${gridLine} 1px, transparent 1px)`, backgroundSize: `${px * 7}px 100%`, backgroundPosition: `${firstMonday * px}px 0` };

  const assigneeName = (task: Task) => users.find(u => u.id === task.assignedTo)?.name;

  const renderLabel = (row: GanttRow): ReactNode => {
    if (row.kind === 'header') {
      return (
        <div className="flex min-w-0 items-center gap-2">
          {row.member ? <Avatar name={row.member.name} avatar={row.member.avatar} className="size-6" /> : <span className="size-6 rounded-full bg-neutral-200" />}
          <span className="truncate text-xs font-bold">{row.member ? (language === 'km' && row.member.nameKm ? row.member.nameKm : row.member.name) : t.ganttNobody}</span>
          <span className="ml-auto shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">{row.count ? row.count : t.ganttNoTasks}</span>
        </div>
      );
    }
    if (row.kind === 'lane') return null;
    const { task } = row.items[0];
    return (
      <div className="min-w-0">
        <p className={`truncate text-xs font-semibold ${task.status === 'approved' ? 'text-neutral-500 line-through' : ''}`}>{task.title}</p>
        <p className="truncate text-[11px] text-neutral-500">{assigneeName(task) ?? t.ganttNobody}</p>
      </div>
    );
  };

  const renderBar = (item: GanttItem, row: GanttRow) => {
    const { task } = item;
    const span = spanOf(item);
    const shown = clipSpan(span, from, to);
    if (!shown) return null; // entirely outside the days drawn
    // A cut-off bar cannot be dragged
    const editable = canEdit(task) && !shown.clipped;
    const late = isLate(task, today);
    const dragging = drag?.id === task.id;
    const width = spanDays(shown) * px - 2;
    const label = row.kind === 'task' ? `${spanDays(span)} ${t.ganttDaysShort}` : task.title;
    const summary = `${task.title} · ${assigneeName(task) ?? t.ganttNobody} · ${fromDay(span.start)} → ${fromDay(span.end)}`;

    return (
      <div
        key={task.id}
        role="button"
        tabIndex={0}
        aria-label={summary}
        title={summary}
        aria-pressed={selectedId === task.id}
        onPointerDown={e => begin(e, item, 'move')}
        onPointerMove={e => move(e, item)}
        onPointerUp={() => void finish(item)}
        onPointerCancel={() => setDrag(null)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(task.id);
          }
        }}
        className={`group absolute top-1/2 flex select-none items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold outline-none transition-[box-shadow,transform] focus-visible:ring-2 focus-visible:ring-brand ${STATUS_STYLE[task.status]} ${
          editable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
        } ${selectedId === task.id ? 'ring-2 ring-brand ring-offset-1' : ''} ${late ? 'outline outline-2 outline-offset-1 outline-brand' : ''} ${
          dragging ? 'z-30 shadow-xl' : 'hover:shadow-md'
        } ${shown.start !== span.start ? 'rounded-l-none' : ''} ${shown.end !== span.end ? 'rounded-r-none' : ''}`}
        style={{ left: (shown.start - from) * px + 1, width, height: BAR_HEIGHT, marginTop: -BAR_HEIGHT / 2, touchAction: 'pan-x' }}
      >
        {late && <Icons.warning className="size-3 shrink-0" aria-label={t.ganttOverdue} />}
        {task.status === 'approved' && <Icons.confirm className="size-3 shrink-0" />}
        {width > 70 && <span className="truncate">{label}</span>}

        {editable && (
          <>
            <span
              aria-hidden="true"
              onPointerDown={e => begin(e, item, 'start')}
              className="absolute inset-y-0 left-0 w-2 cursor-ew-resize rounded-l-md opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100"
            />
            <span
              aria-hidden="true"
              onPointerDown={e => begin(e, item, 'end')}
              className="absolute inset-y-0 right-0 w-2 cursor-ew-resize rounded-r-md opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100"
            />
          </>
        )}

        {dragging && (
          <span className="absolute -top-7 left-0 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[11px] font-semibold text-white shadow-lg">
            {fromDay(span.start)} → {fromDay(span.end)} · {spanDays(span)} {t.ganttDaysShort}
          </span>
        )}
      </div>
    );
  };

  const sticky = 'sticky left-0 z-20 w-[var(--gantt-left)] shrink-0 border-r border-neutral-200';
  const unseen = spans.filter(item => !clipSpan(item, from, to)).length;
  const cutOff = spans.some(item => clipSpan(item, from, to)?.clipped);

  return (
    <div className="space-y-2">
    <div ref={scrollRef} className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-xs">
      <div className="relative [--gantt-left:9.5rem] sm:[--gantt-left:14rem]" style={{ width: `calc(var(--gantt-left) + ${trackWidth}px)` }}>
        <div className="flex border-b border-neutral-200 bg-neutral-50" style={{ height: headerHeight }}>
          <div className={`${sticky} z-30 bg-neutral-50`} />
          <div className="relative" style={{ width: trackWidth }}>
            <div className="flex" style={{ height: HEADER_ROW_HEIGHT }}>
              {monthSegments(from, to).map(seg => (
                <div key={seg.key} className="flex items-center overflow-clip border-l border-neutral-200 text-xs font-bold first:border-l-0" style={{ width: seg.days * px }}>
                  <span className="sticky left-[var(--gantt-left)] whitespace-nowrap px-2">{formatMonth(seg.from, seg.days * px > 110)}</span>
                </div>
              ))}
            </div>
            {showDayRow && (
              <div className="flex" style={{ height: HEADER_ROW_HEIGHT }}>
                {days.map(day => {
                  const isToday = day === today;
                  const showNumber = zoom === 'day' || weekday(day) === 1;
                  return (
                    <div
                      key={day}
                      className={`flex shrink-0 flex-col items-center justify-center text-[11px] leading-tight ${isWeekend(day) ? 'text-neutral-400' : 'text-neutral-600'}`}
                      style={{ width: px }}
                    >
                      {showNumber && (
                        <span className={`grid min-w-5 place-items-center rounded-full px-1 font-bold ${isToday ? 'bg-brand text-white' : ''}`}>{dayOfMonth(day)}</span>
                      )}
                      {zoom === 'day' && <span>{weekdayLetter(day)}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[var(--gantt-left)] z-0" style={{ width: trackWidth, ...trackBackground }}>
            {days.filter(isWeekend).map(day => (
              <span key={day} className="absolute inset-y-0 bg-neutral-100/70" style={{ left: (day - from) * px, width: px }} />
            ))}
            {deadlineDay !== undefined && deadlineDay >= from && deadlineDay <= to && (
              <span className="absolute inset-y-0 border-l-2 border-dashed border-brand" style={{ left: (deadlineDay - from + 1) * px - 1 }}>
                <span className="absolute left-1 top-1 whitespace-nowrap rounded-full border border-brand bg-white px-2 py-0.5 text-[11px] font-bold text-brand-ink">{t.ganttTeamDeadline}</span>
              </span>
            )}
            <span className="absolute inset-y-0 w-0.5 bg-brand" style={{ left: (today - from) * px + px / 2 - 1 }}>
              <span className="absolute -top-px left-1/2 -translate-x-1/2 whitespace-nowrap rounded-b-md bg-brand px-2 py-0.5 text-[11px] font-bold text-white">{t.ganttToday}</span>
            </span>
          </div>

          {rows.map(row => (
            <div
              key={row.id}
              className={`relative z-10 flex border-b border-neutral-100 ${row.kind === 'header' ? 'bg-neutral-50/80' : ''}`}
              style={{ height: row.kind === 'header' ? HEADER_ROW_HEIGHT : ROW_HEIGHT }}
            >
              <div className={`${sticky} flex items-center px-3 ${row.kind === 'header' ? 'bg-neutral-50' : 'bg-white'}`}>{renderLabel(row)}</div>
              <div className="relative" style={{ width: trackWidth }}>
                {row.items.map(item => renderBar(item, row))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    {(unseen > 0 || cutOff) && <p className="text-[11px] text-neutral-500">{t.ganttOutside}</p>}
    </div>
  );
};

// The arithmetic behind the Gantt chart: days as whole numbers, the visible range, rows, and dragging.
// Nothing here touches React or the screen, so it can be tested on its own.
import type { Task, User } from '../../../../shared/types';

export const DAY_MS = 86_400_000;

/** Whole days since 1970-01-01 for a YYYY-MM-DD string. Time zones play no part: the date is read as it is written. */
export const toDay = (iso: string): number => Math.round(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / DAY_MS);

/** The YYYY-MM-DD string for a day number. */
export const fromDay = (day: number): string => new Date(day * DAY_MS).toISOString().slice(0, 10);

/** 0 = Sunday … 6 = Saturday. 1970-01-01 was a Thursday. */
export const weekday = (day: number): number => (((day + 4) % 7) + 7) % 7;
export const isWeekend = (day: number): boolean => weekday(day) === 0 || weekday(day) === 6;

/** A run of days, both ends included. */
export interface Span {
  start: number;
  end: number;
}
export const spanDays = (span: Span): number => span.end - span.start + 1;

/** The most days the chart ever draws. A mistyped year (2099) must not make it draw tens of thousands of columns. */
export const MAX_DAYS = 400;

/**
 * The days the chart shows: a little before the earliest start and after the latest end, always
 * including today and any extra marked days, never fewer than `minDays` and never more than `maxDays`.
 * When the tasks are spread wider than that, the window starts shortly before today.
 */
export function chartRange(
  spans: Span[],
  today: number,
  extraDays: number[] = [],
  pad = { before: 2, after: 5 },
  minDays = 28,
  maxDays = MAX_DAYS
): { from: number; to: number } {
  const days = [today, ...extraDays, ...spans.flatMap(s => [s.start, s.end])];
  const first = Math.min(...days);
  const last = Math.max(...days);
  let from = spans.length ? first - pad.before : today - 7;
  let to = Math.max(spans.length ? last + pad.after : today + 21, from + minDays - 1);
  if (to - from + 1 > maxDays) {
    from = Math.max(from, today - 60);
    to = Math.min(to, from + maxDays - 1);
  }
  return { from, to };
}

/** The part of a span inside the window, or null when none of it is. `clipped` says whether anything was cut off. */
export function clipSpan(span: Span, from: number, to: number): (Span & { clipped: boolean }) | null {
  const start = Math.max(span.start, from);
  const end = Math.min(span.end, to);
  return start > end ? null : { start, end, clipped: start !== span.start || end !== span.end };
}

/** Puts items on as few lines as possible so that none on the same line overlap. Touching days count as overlapping. */
export function packLanes<T extends Span>(items: T[]): T[][] {
  const lanes: T[][] = [];
  for (const item of [...items].sort((a, b) => a.start - b.start || a.end - b.end)) {
    const lane = lanes.find(l => l[l.length - 1].end < item.start);
    if (lane) lane.push(item);
    else lanes.push([item]);
  }
  return lanes;
}

export type DragMode = 'move' | 'start' | 'end';

/**
 * The span after dragging it by `delta` days. Moving keeps the length; dragging an edge changes it but never
 * below one day. `bounds` stops it leaving the visible range.
 */
export function dragSpan(span: Span, mode: DragMode, delta: number, bounds?: { from: number; to: number }): Span {
  let { start, end } = span;
  if (mode === 'move') {
    const d = bounds ? Math.min(Math.max(delta, bounds.from - start), bounds.to - end) : delta;
    return { start: start + d, end: end + d };
  }
  if (mode === 'start') start = Math.min(start + delta, end);
  else end = Math.max(end + delta, start);
  if (bounds) {
    start = Math.max(start, bounds.from);
    end = Math.min(end, bounds.to);
  }
  return { start, end };
}

/** Whole days for a drag of `pixels` when one day is `pxPerDay` wide. */
export const pixelsToDays = (pixels: number, pxPerDay: number): number => Math.round(pixels / pxPerDay);

export interface Segment {
  key: string;
  from: number;
  days: number;
}

/** Splits the days from..to into calendar months, for the top row of the header. */
export function monthSegments(from: number, to: number): Segment[] {
  const out: Segment[] = [];
  let day = from;
  while (day <= to) {
    const d = new Date(day * DAY_MS);
    const nextMonth = Math.round(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) / DAY_MS);
    const end = Math.min(nextMonth - 1, to);
    out.push({ key: fromDay(day).slice(0, 7), from: day, days: end - day + 1 });
    day = end + 1;
  }
  return out;
}

export interface GanttItem extends Span {
  task: Task;
}

export interface GanttRow {
  id: string;
  /** "task": one task per row. "header": a person's name. "lane": a line of that person's tasks. */
  kind: 'task' | 'header' | 'lane';
  member?: User;
  items: GanttItem[];
  /** Number of tasks, for a person's header. */
  count?: number;
}

export const toItem = (task: Task): GanttItem => {
  const start = toDay(task.startDate || task.dueDate);
  const end = toDay(task.dueDate);
  return { task, start: Math.min(start, end), end };
};

/** Late = still open and past its due day. Waiting for review or approved is not late. */
export const isLate = (task: Task, today: number): boolean => (task.status === 'todo' || task.status === 'in_progress') && toDay(task.dueDate) < today;

/** The rows to draw: one per task, or one block per person with their tasks packed onto as few lines as possible. */
export function buildRows(tasks: Task[], members: User[], groupBy: 'task' | 'member'): GanttRow[] {
  const items = tasks.map(toItem);
  if (groupBy === 'task') {
    return [...items].sort((a, b) => a.start - b.start || a.end - b.end || a.task.title.localeCompare(b.task.title)).map(item => ({ id: item.task.id, kind: 'task', items: [item] }));
  }

  const rows: GanttRow[] = [];
  const known = new Set(members.map(m => m.id));
  const people: { id: string; member?: User }[] = [...members.map(member => ({ id: member.id, member })), { id: '' }];
  for (const person of people) {
    const mine = items.filter(i => (person.id === '' ? !known.has(i.task.assignedTo) : i.task.assignedTo === person.id));
    // A member with no tasks still shows, so the leader can see who is free; the "nobody" block only when needed
    if (person.id === '' && mine.length === 0) continue;
    rows.push({ id: `h-${person.id || 'nobody'}`, kind: 'header', member: person.member, items: [], count: mine.length });
    packLanes(mine).forEach((lane, i) => rows.push({ id: `l-${person.id || 'nobody'}-${i}`, kind: 'lane', member: person.member, items: lane }));
  }
  return rows;
}

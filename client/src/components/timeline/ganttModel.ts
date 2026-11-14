// Date and layout maths for the Gantt chart. No React.
import type { Task, User } from '../../../../shared/types';

export const DAY_MS = 86_400_000;

/** Whole days since 1970-01-01. */
export const toDay = (iso: string): number => Math.round(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / DAY_MS);

export const fromDay = (day: number): string => new Date(day * DAY_MS).toISOString().slice(0, 10);

export const weekday = (day: number): number => (((day + 4) % 7) + 7) % 7;
export const isWeekend = (day: number): boolean => weekday(day) === 0 || weekday(day) === 6;

export interface Span {
  start: number;
  end: number;
}
export const spanDays = (span: Span): number => span.end - span.start + 1;

/** Cap on drawn days, so a typo like the year 2099 stays fast. */
export const MAX_DAYS = 400;

/** The days to draw: around the tasks, and always including today. */
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

export function clipSpan(span: Span, from: number, to: number): (Span & { clipped: boolean }) | null {
  const start = Math.max(span.start, from);
  const end = Math.min(span.end, to);
  return start > end ? null : { start, end, clipped: start !== span.start || end !== span.end };
}

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

export const pixelsToDays = (pixels: number, pxPerDay: number): number => Math.round(pixels / pxPerDay);

export interface Segment {
  key: string;
  from: number;
  days: number;
}

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
  kind: 'task' | 'header' | 'lane';
  member?: User;
  items: GanttItem[];
  count?: number;
}

export const toItem = (task: Task): GanttItem => {
  const start = toDay(task.startDate || task.dueDate);
  const end = toDay(task.dueDate);
  return { task, start: Math.min(start, end), end };
};

export const isLate = (task: Task, today: number): boolean => (task.status === 'todo' || task.status === 'in_progress') && toDay(task.dueDate) < today;

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
    if (person.id === '' && mine.length === 0) continue;
    rows.push({ id: `h-${person.id || 'nobody'}`, kind: 'header', member: person.member, items: [], count: mine.length });
    packLanes(mine).forEach((lane, i) => rows.push({ id: `l-${person.id || 'nobody'}-${i}`, kind: 'lane', member: person.member, items: lane }));
  }
  return rows;
}

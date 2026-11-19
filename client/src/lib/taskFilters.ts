import type { Task } from '../../../shared/types';
import { shiftDate } from './dates';

/** Whose tasks: everyone's, only mine alone, or the team tasks that include me. */
export type Scope = 'all' | 'mine' | 'team';
/** When: any time, working today, the next 7 days, late, or a chosen range of dates. */
export type When = 'any' | 'today' | 'week' | 'overdue' | 'range';

export const WEEK_DAYS = 7;

/** Late and still being worked on. Work that was handed in or approved is never late. */
export const isOverdue = (task: Task, today: string) =>
  task.status !== 'approved' && task.status !== 'ready_for_review' && task.dueDate < today;

/** The team tasks (batches) that I am part of */
export const myBatches = (tasks: Task[], userId: string): Set<string> =>
  new Set(tasks.filter(task => task.batchId && task.assignedTo === userId).map(task => task.batchId!));

export const matchesScope = (task: Task, scope: Scope, userId: string, mine: Set<string>) => {
  if (scope === 'mine') return !task.batchId && task.assignedTo === userId;
  if (scope === 'team') return !!task.batchId && mine.has(task.batchId);
  return true;
};

// A task covers the days from its start to its due date
const overlaps = (task: Task, from: string, to: string) => (task.startDate || task.dueDate) <= to && task.dueDate >= from;

/** The range may be open at either end. */
export const matchesWhen = (task: Task, when: When, today: string, range: { from: string; to: string }) => {
  switch (when) {
    case 'today':
      // What there is to work on today: it has started, it is not finished
      return task.status !== 'approved' && overlaps(task, today, today);
    case 'week':
      return task.status !== 'approved' && overlaps(task, today, shiftDate(today, WEEK_DAYS - 1));
    case 'overdue':
      return isOverdue(task, today);
    case 'range':
      return overlaps(task, range.from || '0000-01-01', range.to || '9999-12-31');
    default:
      return true;
  }
};

/** How many cards the tasks make: a team task is one card */
export const cardCount = (tasks: Task[]) => new Set(tasks.map(task => task.batchId ?? task.id)).size;

/** For a daily ToDo, which has one date: any day, today, or a range (open at either end). */
export const matchesDay = (date: string, when: When, today: string, range: { from: string; to: string }) => {
  if (when === 'today') return date === today;
  if (when === 'range') return date >= (range.from || '0000-01-01') && date <= (range.to || '9999-12-31');
  return true;
};

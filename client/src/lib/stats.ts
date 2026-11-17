import type { DailyLog, DailyTodoItem, Task, User } from '../../../shared/types';

const percentOf = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

export const averageProgress = (tasks: Task[]) => (tasks.length === 0 ? 0 : Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length));

/** Who posted today. Viewers cannot post, so they are not counted. */
export const standupToday = (members: User[], logs: DailyLog[], today: string) => {
  const posters = members.filter(m => m.role !== 'viewer');
  const allowed = new Set(posters.map(m => m.id));
  const postedIds = new Set(logs.filter(l => l.date === today && allowed.has(l.userId)).map(l => l.userId));
  return { posted: postedIds.size, total: posters.length, percent: percentOf(postedIds.size, posters.length), postedIds };
};

/** percent counts approved tasks only, progress is the average of all tasks */
export const taskTotals = (tasks: Task[]) => {
  const approved = tasks.filter(t => t.status === 'approved').length;
  const review = tasks.filter(t => t.status === 'ready_for_review').length;
  return { total: tasks.length, approved, review, percent: percentOf(approved, tasks.length), progress: averageProgress(tasks) };
};

/** Done items count 100, items written like "- 80%" count 80. No items gives null. */
export const dailyLogPercent = (items: DailyTodoItem[]): number | null => {
  if (items.length === 0) return null;
  const sum = items.reduce((total, item) => {
    if (item.done) return total + 100;
    const tag = Number.parseInt(item.progressTag ?? '', 10);
    return total + (Number.isNaN(tag) ? 0 : Math.min(100, Math.max(0, tag)));
  }, 0);
  return Math.round(sum / items.length);
};

export interface TaskLine {
  task: Task;
  team?: Task[];
}

/** One line per team task instead of one per person. */
export const groupTeamTasks = (tasks: Task[], all: Task[]): TaskLine[] => {
  const seen = new Set<string>();
  const lines: TaskLine[] = [];
  for (const task of tasks) {
    if (!task.batchId) {
      lines.push({ task });
    } else if (!seen.has(task.batchId)) {
      seen.add(task.batchId);
      lines.push({ task, team: all.filter(other => other.batchId === task.batchId) });
    }
  }
  return lines;
};

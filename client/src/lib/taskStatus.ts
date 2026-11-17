import type { TaskStatus } from '../types';

export const STATUS_ORDER: Record<TaskStatus, number> = { todo: 0, in_progress: 1, ready_for_review: 2, approved: 3 };

export const STATUS_STYLE: Record<TaskStatus, string> = {
  todo: 'bg-neutral-100 text-neutral-600',
  in_progress: 'bg-neutral-200 text-black',
  ready_for_review: 'bg-brand-soft text-brand-ink',
  approved: 'bg-brand text-white',
};

export const statusLabels = (t: Record<'taskStatusTodo' | 'taskStatusInProgress' | 'taskStatusReview' | 'taskStatusApproved', string>): Record<TaskStatus, string> => ({
  todo: t.taskStatusTodo,
  in_progress: t.taskStatusInProgress,
  ready_for_review: t.taskStatusReview,
  approved: t.taskStatusApproved,
});

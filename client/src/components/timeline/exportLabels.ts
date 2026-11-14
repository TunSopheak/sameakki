import type { translations } from '../../locales/translations';
import type { ExportLabels } from './exportModel';
import type { XlsxLabels } from './exportXlsx';

type Words = (typeof translations)['km'];

export const buildXlsxLabels = (t: Words): XlsxLabels => ({
  total: t.xlsxTotal,
  count: t.xlsxCount,
  percentApproved: t.xlsxPercentApproved,
  overdue: t.xlsxOverdue,
});

/** The column names and status words for an export, in the language the person is using. */
export const buildExportLabels = (t: Words): ExportLabels => ({
  columns: {
    title: t.colTitle,
    module: t.colModule,
    assignee: t.colAssignee,
    status: t.colStatus,
    priority: t.taskPriority,
    start: t.taskStartDate,
    due: t.colDue,
    days: t.colDays,
    description: t.taskDescription,
  },
  statuses: { todo: t.taskStatusTodo, in_progress: t.taskStatusInProgress, ready_for_review: t.taskStatusReview, approved: t.taskStatusApproved },
  priorities: { low: t.taskPriorityLow, medium: t.taskPriorityMedium, high: t.taskPriorityHigh, urgent: t.taskPriorityUrgent },
  nobody: t.ganttNobody,
});

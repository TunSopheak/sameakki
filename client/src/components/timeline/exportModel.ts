// What goes into an export: the table of tasks, the CSV text, and the file name. No React and no browser needed.
import type { Task, User } from '../../../../shared/types';
import { spanDays, toDay } from './ganttModel';

export interface ExportLabels {
  columns: { title: string; module: string; assignee: string; status: string; priority: string; start: string; due: string; days: string; description: string };
  statuses: Record<Task['status'], string>;
  priorities: Record<Task['priority'], string>;
  /** Shown when a task has nobody assigned. */
  nobody: string;
}

export interface ExportRow {
  title: string;
  module: string;
  assignee: string;
  status: string;
  priority: string;
  start: string;
  due: string;
  days: number;
  description: string;
}

/** One row per task, in the order of the timeline: by start day, then by due day, then by title. */
export function exportRows(tasks: Task[], users: User[], labels: ExportLabels, language: 'km' | 'en'): ExportRow[] {
  const byId = new Map(users.map(u => [u.id, u]));
  const nameOf = (id: string) => {
    const user = byId.get(id);
    if (!user) return labels.nobody;
    return language === 'km' && user.nameKm ? user.nameKm : user.name;
  };

  return [...tasks]
    .map(task => {
      const end = toDay(task.dueDate);
      // A task from before start dates existed still has to draw, as a single day
      const start = Math.min(toDay(task.startDate || task.dueDate), end);
      return { task, start, end };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end || a.task.title.localeCompare(b.task.title))
    .map(({ task, start, end }) => ({
      title: task.title,
      module: task.module,
      assignee: nameOf(task.assignedTo),
      status: labels.statuses[task.status],
      priority: labels.priorities[task.priority],
      start: task.startDate || task.dueDate,
      due: task.dueDate,
      days: spanDays({ start, end }),
      description: task.description,
    }));
}

export const exportHeaders = (labels: ExportLabels): string[] => {
  const c = labels.columns;
  return [c.title, c.module, c.assignee, c.status, c.priority, c.start, c.due, c.days, c.description];
};

export const exportRowCells = (row: ExportRow): (string | number)[] => [row.title, row.module, row.assignee, row.status, row.priority, row.start, row.due, row.days, row.description];

/**
 * One CSV cell. Text that starts with = + - @ would be run as a formula by Excel or Google Sheets, so a task
 * called "=HYPERLINK(...)" could do harm when someone opens the file. A leading quote makes it plain text.
 */
export function csvCell(value: string | number): string {
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV text that Excel and Google Sheets read correctly, Khmer included (the byte-order mark tells Excel it is UTF-8). */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  return '﻿' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** A file name that is safe on Windows, Mac and Linux, such as "JulNow App - timeline - 2026-11-14.csv". */
export function exportFileName(groupName: string, extension: string, today: string): string {
  const name = groupName
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
    .trim();
  return `${name || 'Team'} - timeline - ${today}.${extension}`;
}

import { TASK_PRIORITIES, type TaskPriority } from './types';

/**
 * Turns a table pasted from Google Sheets / Excel (or a CSV file) into tasks.
 * One row is one task. The first row names the columns, in any order, for example:
 *   Task title | Module | Assign to | Members | Priority | Start date | Due date | Due time | Details
 * Only "Task title" and "Due date" are needed. Other columns are optional and unknown ones are ignored.
 */

export const IMPORT_LIMIT = 200;

export interface ImportMember {
  id: string;
  name: string;
  nameKm?: string;
  email?: string;
  role?: string;
}

export interface ImportedTask {
  title: string;
  module: string;
  description: string;
  priority: TaskPriority;
  startDate?: string;
  dueDate: string;
  dueTime?: string;
  assignToAll?: true;
  assignedTo?: string;
  assigneeIds?: string[];
}

export type ImportProblem =
  | { code: 'noTitle' }
  | { code: 'noDue' }
  | { code: 'badDate'; value: string }
  | { code: 'badTime'; value: string }
  | { code: 'badPriority'; value: string }
  | { code: 'startAfterDue' }
  | { code: 'noAssignee' }
  | { code: 'unknownMember'; value: string }
  | { code: 'viewer'; value: string };

export interface ImportRow {
  /** Row number in the pasted table, counting the header as row 1 */
  line: number;
  title: string;
  /** Who it goes to, as written */
  who: string;
  task?: ImportedTask;
  problems: ImportProblem[];
}

export interface ImportResult {
  rows: ImportRow[];
  /** The header has no title or due date column, so nothing can be read */
  missingColumns: ('title' | 'due')[];
  tooMany: boolean;
}

// Column names people use, after lower-casing and removing spaces and symbols
const COLUMNS: Record<string, string[]> = {
  title: ['tasktitle', 'title', 'task', 'taskname', 'name', 'ចំណងជើង', 'កិច្ចការ'],
  module: ['module', 'modulesection', 'section', 'category', 'group', 'ផ្នែក'],
  mode: ['assignto', 'assign', 'assigntype', 'mode', 'who'],
  members: ['members', 'member', 'assignees', 'assignee', 'people', 'person', 'សមាជិក'],
  priority: ['priority', 'ភាពសំខាន់'],
  start: ['startdate', 'start', 'from', 'ថ្ងៃចាប់ផ្តើម'],
  due: ['duedate', 'due', 'deadline', 'to', 'ថ្ងៃកំណត់'],
  time: ['duetime', 'time', 'ម៉ោង'],
  description: ['details', 'description', 'notes', 'note', 'ពិពណ៌នា'],
};

const norm = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
const squash = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

/** Reads CSV or tab separated text. Quotes may hold commas and line breaks. */
export function parseTable(text: string): string[][] {
  const input = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const firstLine = input.split('\n', 1)[0] ?? '';
  const count = (ch: string) => firstLine.split(ch).length - 1;
  // Pasting from a spreadsheet gives tabs; files usually give commas or semicolons
  const delimiter = count('\t') > 0 ? '\t' : count(';') > count(',') ? ';' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell);
  rows.push(row);

  return rows.filter(r => r.some(c => c.trim() !== ''));
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 2026-11-17, 2026/11/17, 17/11/2026 or 17-11-2026 (day first). Returns YYYY-MM-DD, or null. */
export function parseDate(value: string): string | null {
  const text = value.trim();
  let y: number, m: number, d: number;
  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T].*)?$/);
  if (match) [y, m, d] = [+match[1], +match[2], +match[3]];
  else if ((match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) [d, m, y] = [+match[1], +match[2], +match[3]];
  else return null;

  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** 18:00, 6:30, 18:00:00 or 6pm. Returns HH:MM, or null. */
export function parseTime(value: string): string | null {
  const match = value.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)?$/);
  if (!match) return null;
  let hour = +match[1];
  const minute = match[2] ? +match[2] : 0;
  if (match[3]) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (match[3] === 'pm' ? 12 : 0);
  }
  if (hour > 23 || minute > 59) return null;
  return `${pad(hour)}:${pad(minute)}`;
}

const EVERYONE = ['everyone', 'all', 'team', 'ទាំងអស់គ្នា', 'ទាំងអស់'];

export function parseTaskImport(text: string, members: ImportMember[]): ImportResult {
  const table = parseTable(text);
  const header = table[0] ?? [];
  const index: Record<string, number> = {};
  header.forEach((name, i) => {
    const key = Object.keys(COLUMNS).find(k => COLUMNS[k].includes(norm(name)));
    if (key && index[key] === undefined) index[key] = i;
  });

  const missingColumns: ('title' | 'due')[] = [];
  if (index.title === undefined) missingColumns.push('title');
  if (index.due === undefined) missingColumns.push('due');
  if (missingColumns.length > 0) return { rows: [], missingColumns, tooMany: false };

  const byName = new Map<string, ImportMember>();
  for (const member of members) {
    for (const key of [member.name, member.nameKm, member.email]) if (key) byName.set(squash(key), member);
  }
  const get = (row: string[], key: string) => (index[key] === undefined ? '' : (row[index[key]] ?? '').trim());

  const body = table.slice(1);
  const rows = body.slice(0, IMPORT_LIMIT).map((cells, n): ImportRow => {
    const problems: ImportProblem[] = [];
    const title = get(cells, 'title');
    const who = get(cells, 'members');
    if (!title) problems.push({ code: 'noTitle' });

    const dueText = get(cells, 'due');
    const dueDate = dueText ? parseDate(dueText) : null;
    if (!dueText) problems.push({ code: 'noDue' });
    else if (!dueDate) problems.push({ code: 'badDate', value: dueText });

    const startText = get(cells, 'start');
    const startDate = startText ? parseDate(startText) : null;
    if (startText && !startDate) problems.push({ code: 'badDate', value: startText });
    if (startDate && dueDate && startDate > dueDate) problems.push({ code: 'startAfterDue' });

    const timeText = get(cells, 'time');
    const dueTime = timeText ? parseTime(timeText) : null;
    if (timeText && !dueTime) problems.push({ code: 'badTime', value: timeText });

    const priorityText = get(cells, 'priority').toLowerCase();
    let priority: TaskPriority = 'medium';
    if (priorityText) {
      if ((TASK_PRIORITIES as readonly string[]).includes(priorityText)) priority = priorityText as TaskPriority;
      else problems.push({ code: 'badPriority', value: priorityText });
    }

    // Who does it: "Everyone", or the names in the Members column
    const everyone = EVERYONE.includes(squash(get(cells, 'mode')));
    const ids: string[] = [];
    if (!everyone) {
      const names = who.split(/[,;\n、]|\s+and\s+|\s*&\s*/i).map(s => s.trim()).filter(Boolean);
      if (names.length === 0) problems.push({ code: 'noAssignee' });
      for (const name of names) {
        const member = byName.get(squash(name));
        if (!member) problems.push({ code: 'unknownMember', value: name });
        else if (member.role === 'viewer') problems.push({ code: 'viewer', value: name });
        else if (!ids.includes(member.id)) ids.push(member.id);
      }
    }

    const row: ImportRow = { line: n + 2, title, who: everyone ? 'Everyone' : who, problems };
    if (problems.length === 0 && dueDate) {
      row.task = {
        title,
        module: get(cells, 'module') || 'General',
        description: get(cells, 'description'),
        priority,
        ...(startDate ? { startDate } : {}),
        dueDate,
        ...(dueTime ? { dueTime } : {}),
        ...(everyone ? { assignToAll: true as const } : ids.length === 1 ? { assignedTo: ids[0] } : { assigneeIds: ids }),
      };
    }
    return row;
  });

  return { rows, missingColumns, tooMany: body.length > IMPORT_LIMIT };
}

/** A sample file people can fill in */
export const IMPORT_TEMPLATE = [
  'Task title,Module,Assign to,Members,Priority,Start date,Due date,Due time,Details',
  'Install tools,Team,Everyone,,high,2026-11-17,2026-11-20,18:00,"Done when: every laptop runs the project"',
  'Login screen,Mobile,Choose,"Member One, Member Two",medium,2026-11-21,2026-11-25,18:00,"Done when:\nscreen matches the design"',
].join('\n');

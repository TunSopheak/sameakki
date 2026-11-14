import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Task, User } from '../shared/types';
import { csvCell, exportFileName, exportRows, toCsv, type ExportLabels } from '../client/src/components/timeline/exportModel';

const labels: ExportLabels = {
  columns: { title: 'Task', module: 'Module', assignee: 'Assignee', status: 'Status', priority: 'Priority', start: 'Start', due: 'Due', days: 'Days', description: 'Description' },
  statuses: { todo: 'To do', in_progress: 'In progress', ready_for_review: 'Review', approved: 'Approved' },
  priorities: { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' },
  nobody: 'Nobody',
};

const task = (over: Partial<Task>): Task => ({ id: 't', title: 'T', description: '', module: 'M', assignedTo: 'u1', status: 'todo', priority: 'medium', dueDate: '2026-11-10', startDate: '2026-11-08', ...over }) as Task;
const users = [{ id: 'u1', name: 'Dara', nameKm: 'ដារ៉ា' }] as unknown as User[];

test('rows follow the timeline order and count days inclusively', () => {
  const rows = exportRows([task({ title: 'B', startDate: '2026-11-09', dueDate: '2026-11-09' }), task({ title: 'A', startDate: '2026-11-01', dueDate: '2026-11-03' })], users, labels, 'en');
  assert.deepEqual(rows.map(r => r.title), ['A', 'B']);
  assert.equal(rows[0].days, 3);
  assert.equal(rows[0].status, 'To do');
});

test('assignee uses the Khmer name in Khmer and a placeholder when nobody is assigned', () => {
  assert.equal(exportRows([task({})], users, labels, 'km')[0].assignee, 'ដារ៉ា');
  assert.equal(exportRows([task({ assignedTo: 'gone' })], users, labels, 'en')[0].assignee, 'Nobody');
});

test('a task without a start date uses its due date', () => {
  const [row] = exportRows([task({ startDate: '' })], users, labels, 'en');
  assert.equal(row.start, '2026-11-10');
  assert.equal(row.days, 1);
});

test('csv cells are quoted and formulas are neutralised', () => {
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell('-5'), "'-5");
  assert.equal(csvCell(-5), '-5');
});

test('csv starts with a byte-order mark and uses CRLF', () => {
  const csv = toCsv(['a', 'b'], [['1', 2]]);
  assert.ok(csv.startsWith('﻿'));
  assert.equal(csv, '﻿a,b\r\n1,2\r\n');
});

test('file names are safe and never empty', () => {
  assert.equal(exportFileName('Team: A/B?', 'csv', '2026-11-14'), 'Team AB - timeline - 2026-11-14.csv');
  assert.equal(exportFileName('///', 'csv', '2026-11-14'), 'Team - timeline - 2026-11-14.csv');
});

test('the Excel file has the three sheets, live formulas and a timeline rule', async () => {
  const { default: ExcelJS } = await import('exceljs');
  const { buildXlsx } = await import('../client/src/components/timeline/exportXlsx');
  const { toDay } = await import('../client/src/components/timeline/ganttModel');
  const rows = exportRows([task({ title: 'A', status: 'approved' }), task({ title: 'B', status: 'todo', startDate: '2020-01-01', dueDate: '2020-01-03' })], users, labels, 'en');
  const buffer = await buildXlsx(rows, labels, { total: 'Total', count: 'Count', percentApproved: 'Approved %', overdue: 'Overdue' }, 'Team', toDay('2026-11-14'));
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(buffer);
  assert.deepEqual(book.worksheets.map(s => s.name), ['Tasks', 'Summary', 'Timeline']);
  const tasks = book.getWorksheet('Tasks')!;
  assert.equal(tasks.getRow(1).getCell(1).value, 'Task');
  assert.deepEqual((tasks.getCell('H2').value as { formula: string }).formula, 'G2-F2+1');
  assert.ok(tasks.getCell('F2').value instanceof Date);
  const summary = book.getWorksheet('Summary')!;
  assert.match((summary.getCell('B4').value as { formula: string }).formula, /^COUNTIF\(Tasks!/);
  assert.match((summary.getCell('B10').value as { formula: string }).formula, /TODAY\(\)/);
  const line = book.getWorksheet('Timeline')!;
  assert.equal((line.getCell('B2').value as { formula: string }).formula, 'Tasks!F2');
  assert.ok(line.columnCount > 20);
});

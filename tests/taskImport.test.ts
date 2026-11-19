import assert from 'node:assert/strict';
import { test } from 'node:test';
import { IMPORT_LIMIT, IMPORT_TEMPLATE, parseDate, parseTable, parseTaskImport, parseTime } from '../shared/taskImport';

const members = [
  { id: 'u1', name: 'Pon Somnang', email: 'pon@example.com' },
  { id: 'u2', name: 'Duon Kimay', nameKm: 'ឌួន គីម៉ៃ' },
  { id: 'u3', name: 'Viewer Vi', role: 'viewer' },
];

const sheet = [
  ['ID', 'Task title', 'Module / section', 'Assign to', 'Members', 'Priority', 'Start date', 'Due date', 'Due time', 'Details', 'Status'],
  ['T01', 'Install tools', 'Team', 'Everyone', '', 'High', '2026-11-17', '2026-11-20', '18:00', 'Done when: all OK', 'To do'],
  ['T05', 'Docker Compose', 'Auth', 'Choose', 'Pon Somnang, Duon Kimay', 'High', '2026-11-23', '2026-11-24', '18:00:00', 'Repo: infra', 'To do'],
  ['T04', 'Register account', 'Lead', 'One person', 'Pon Somnang', 'High', '2026-11-19', '2026-11-21', '18:00', '', 'To do'],
]
  .map(r => r.join('\t'))
  .join('\n');

test('reads a table pasted from Google Sheets', () => {
  const { rows, missingColumns } = parseTaskImport(sheet, members);
  assert.deepEqual(missingColumns, []);
  assert.equal(rows.length, 3);
  assert.ok(rows.every(r => r.task && r.problems.length === 0));

  assert.deepEqual(rows[0].task, {
    title: 'Install tools',
    module: 'Team',
    description: 'Done when: all OK',
    priority: 'high',
    startDate: '2026-11-17',
    dueDate: '2026-11-20',
    dueTime: '18:00',
    assignToAll: true,
  });
  assert.deepEqual(rows[1].task?.assigneeIds, ['u1', 'u2']);
  assert.equal(rows[1].task?.dueTime, '18:00', 'seconds are dropped');
  assert.equal(rows[2].task?.assignedTo, 'u1', 'one name means one person');
  assert.equal(rows[2].line, 4, 'row numbers count the header');
});

test('reads CSV with quotes, commas and line breaks inside a cell', () => {
  const rows = parseTable('a,b\n"x, y","line 1\nline 2"\n"say ""hi""",z');
  assert.deepEqual(rows, [['a', 'b'], ['x, y', 'line 1\nline 2'], ['say "hi"', 'z']]);
  assert.deepEqual(parseTable('a;b\n1;2'), [['a', 'b'], ['1', '2']], 'semicolons work too');
  assert.deepEqual(parseTable('﻿a,b\r\n1,2\r\n\r\n'), [['a', 'b'], ['1', '2']], 'BOM, Windows line ends and blank lines');
});

test('the template we give out can be imported', () => {
  const { rows } = parseTaskImport(IMPORT_TEMPLATE, [{ id: 'a', name: 'Member One' }, { id: 'b', name: 'Member Two' }]);
  assert.equal(rows.length, 2);
  assert.ok(rows.every(r => r.task), JSON.stringify(rows.map(r => r.problems)));
  assert.equal(rows[1].task?.description, 'Done when:\nscreen matches the design');
});

test('dates and times are checked', () => {
  assert.equal(parseDate('2026-11-20'), '2026-11-20');
  assert.equal(parseDate('20/11/2026'), '2026-11-20');
  assert.equal(parseDate('2026-2-3'), '2026-02-03');
  assert.equal(parseDate('2026-02-30'), null);
  assert.equal(parseDate('soon'), null);
  assert.equal(parseTime('6pm'), '18:00');
  assert.equal(parseTime('6:30'), '06:30');
  assert.equal(parseTime('12am'), '00:00');
  assert.equal(parseTime('25:00'), null);
});

test('rows with problems say what is wrong and are not imported', () => {
  const text = [
    'Task title,Assign to,Members,Due date,Priority',
    ',Everyone,,2026-11-20,',
    'No date,Everyone,,,',
    'Bad date,Everyone,,31/31/2026,',
    'Nobody,Choose,,2026-11-20,',
    'Stranger,Choose,Somebody Else,2026-11-20,',
    'A viewer,Choose,Viewer Vi,2026-11-20,',
    'Odd priority,Everyone,,2026-11-20,asap',
    'Good,Choose,Duon Kimay,2026-11-20,low',
  ].join('\n');
  const { rows } = parseTaskImport(text, members);
  assert.deepEqual(
    rows.map(r => r.problems[0]?.code ?? 'ok'),
    ['noTitle', 'noDue', 'badDate', 'noAssignee', 'unknownMember', 'viewer', 'badPriority', 'ok']
  );
  assert.deepEqual(rows.map(r => !!r.task), [false, false, false, false, false, false, false, true]);
});

test('members are found by Khmer name or email, and listed once', () => {
  const { rows } = parseTaskImport('Task title,Members,Due date\nA,"ឌួន គីម៉ៃ; pon@example.com; duon kimay",2026-11-20', members);
  assert.deepEqual(rows[0].task?.assigneeIds, ['u2', 'u1']);
});

test('start after due is refused, and column names may come in any order and spelling', () => {
  const { rows } = parseTaskImport('DUE DATE,Start-Date,Title,Members\n2026-11-20,2026-11-25,A,Pon Somnang', members);
  assert.equal(rows[0].problems[0].code, 'startAfterDue');
});

test('a missing title or due date column is reported, and too many rows are cut', () => {
  assert.deepEqual(parseTaskImport('Name,Notes\nA,B', members).missingColumns, ['due']);
  assert.deepEqual(parseTaskImport('Foo,Bar\n1,2', members).missingColumns, ['title', 'due']);
  const many = ['Task title,Assign to,Due date', ...Array.from({ length: IMPORT_LIMIT + 5 }, (_, i) => `T${i},Everyone,2026-11-20`)].join('\n');
  const result = parseTaskImport(many, members);
  assert.equal(result.rows.length, IMPORT_LIMIT);
  assert.equal(result.tooMany, true);
});

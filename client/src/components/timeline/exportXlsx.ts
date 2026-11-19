// Excel file with live formulas
import type { Task } from '../../../../shared/types';
import { exportHeaders, exportRowCells, type ExportLabels, type ExportRow } from './exportModel';
import { chartRange, toDay } from './ganttModel';
import { APP_NAME } from '../../lib/brand';

export interface XlsxLabels {
  total: string;
  count: string;
  percentApproved: string;
  overdue: string;
}

const BRAND = 'FF840015';
const KHMER_FONT = 'Khmer OS Siemreap';
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' } } as const;
const fill = (argb: string) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb }, bgColor: { argb } }) as const;
const dateOf = (iso: string) => new Date(toDay(iso) * 86_400_000);
const STATUS_ORDER: Task['status'][] = ['todo', 'in_progress', 'ready_for_review', 'approved'];

export async function buildXlsx(rows: ExportRow[], labels: ExportLabels, words: XlsxLabels, groupName: string, today: number): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import('exceljs');
  const book = new ExcelJS.Workbook();
  book.creator = APP_NAME;
  book.created = new Date();
  const last = rows.length + 1;

  // Tasks sheet
  const tasks = book.addWorksheet('Tasks', { views: [{ state: 'frozen', ySplit: 1 }] });
  tasks.addRow(exportHeaders(labels));
  rows.forEach((row, i) => {
    const cells = exportRowCells(row);
    const n = i + 2;
    tasks.addRow([cells[0], cells[1], cells[2], cells[3], cells[4], dateOf(row.start), dateOf(row.due), { formula: `G${n}-F${n}+1`, result: row.days }, cells[8]]);
  });
  tasks.columns = [{ width: 32 }, { width: 16 }, { width: 20 }, { width: 18 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 10 }, { width: 50 }];
  const head = tasks.getRow(1);
  head.font = HEADER_FONT;
  head.eachCell(cell => (cell.fill = fill(BRAND)));
  for (const col of ['F', 'G']) tasks.getColumn(col).numFmt = 'yyyy-mm-dd';
  tasks.getColumn('I').alignment = { wrapText: true, vertical: 'top' };
  tasks.autoFilter = { from: 'A1', to: `I${Math.max(last, 1)}` };

  // Summary sheet
  const sum = book.addWorksheet('Summary');
  sum.getCell('A1').value = groupName;
  sum.getCell('A1').font = { bold: true, size: 14 };
  sum.getCell('A3').value = labels.columns.status;
  sum.getCell('B3').value = words.count;
  for (const c of ['A3', 'B3']) {
    sum.getCell(c).font = HEADER_FONT;
    sum.getCell(c).fill = fill(BRAND);
  }
  const counts = STATUS_ORDER.map(status => rows.filter(r => r.status === labels.statuses[status]).length);
  STATUS_ORDER.forEach((status, i) => {
    const n = i + 4;
    sum.getCell(`A${n}`).value = labels.statuses[status];
    sum.getCell(`B${n}`).value = { formula: `COUNTIF(Tasks!$D$2:$D$${last + 500},A${n})`, result: counts[i] };
  });
  const total = counts.reduce((a, b) => a + b, 0);
  sum.getCell('A8').value = words.total;
  sum.getCell('B8').value = { formula: 'SUM(B4:B7)', result: total };
  sum.getCell('A9').value = words.percentApproved;
  sum.getCell('B9').value = { formula: 'IF(B8=0,0,B7/B8)', result: total ? counts[3] / total : 0 };
  sum.getCell('B9').numFmt = '0%';
  sum.getCell('A10').value = words.overdue;
  const overdue = rows.filter(r => (r.status === labels.statuses.todo || r.status === labels.statuses.in_progress) && toDay(r.due) < today).length;
  const open = (n: number) => `COUNTIFS(Tasks!$D$2:$D$${last + 500},A${n},Tasks!$G$2:$G$${last + 500},"<"&TODAY())`;
  sum.getCell('B10').value = { formula: `${open(4)}+${open(5)}`, result: overdue };
  for (const c of ['A8', 'A9', 'A10']) sum.getCell(c).font = { bold: true };
  sum.columns = [{ width: 30 }, { width: 12 }];

  // Timeline sheet
  const items = rows.map(r => ({ start: toDay(r.start), end: toDay(r.due) }));
  const { from, to } = chartRange(items, today, [], { before: 1, after: 1 }, 14);
  const line = book.addWorksheet('Timeline', { views: [{ state: 'frozen', xSplit: 3, ySplit: 1 }] });
  const first = 4;
  const header: (string | Date)[] = [labels.columns.title, labels.columns.start, labels.columns.due];
  for (let day = from; day <= to; day++) header.push(new Date(day * 86_400_000));
  line.addRow(header);
  rows.forEach((row, i) => {
    const n = i + 2;
    line.addRow([row.title, { formula: `Tasks!F${n}`, result: dateOf(row.start) }, { formula: `Tasks!G${n}`, result: dateOf(row.due) }]);
  });
  line.getColumn(1).width = 32;
  line.getColumn(2).width = 12;
  line.getColumn(3).width = 12;
  line.getColumn(2).numFmt = 'yyyy-mm-dd';
  line.getColumn(3).numFmt = 'yyyy-mm-dd';
  const lineHead = line.getRow(1);
  lineHead.height = 44;
  lineHead.font = HEADER_FONT;
  lineHead.eachCell({ includeEmpty: false }, (cell, col) => {
    cell.fill = fill(BRAND);
    if (col >= first) {
      cell.numFmt = 'dd mmm';
      cell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'middle' };
    }
  });
  for (let col = first; col < first + (to - from + 1); col++) line.getColumn(col).width = 3.5;
  if (rows.length) {
    const lastCol = line.getColumn(first + (to - from)).letter;
    line.addConditionalFormatting({
      ref: `D2:${lastCol}${last}`,
      rules: [
        { type: 'expression', priority: 1, formulae: ['AND(D$1>=$B2,D$1<=$C2)'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: BRAND } } } },
        { type: 'expression', priority: 2, formulae: ['WEEKDAY(D$1,2)>5'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF3F0EC' } } } },
      ],
    });
  }

  // Khmer font on every cell (keeps bold/colour/size set above)
  book.eachSheet(sheet =>
    sheet.eachRow({ includeEmpty: false }, row =>
      row.eachCell({ includeEmpty: false }, cell => {
        cell.font = { ...cell.font, name: KHMER_FONT };
      }),
    ),
  );

  return (await book.xlsx.writeBuffer()) as ArrayBuffer;
}

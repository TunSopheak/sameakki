import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Download, FileSpreadsheet, Printer } from 'lucide-react';
import type { Task, User } from '@shared/types';
import { useApp } from '../../context/AppContext';
import { todayLocal } from '../../lib/dates';
import { downloadBlob } from '../../lib/download';
import { printPage } from '../../lib/printPage';
import { useDismiss } from '../../lib/useDismiss';
import { buildExportLabels, buildXlsxLabels } from './exportLabels';
import { toDay } from './ganttModel';
import { exportFileName, exportHeaders, exportRowCells, exportRows, toCsv } from './exportModel';
import { PrintableTimeline } from './PrintableTimeline';

interface ExportMenuProps {
  groupName: string;
  tasks: Task[];
  users: User[];
  teamDeadline?: string;
}

/** The "Export" button: a PDF through the browser's print window, or a CSV file for Excel and Google Sheets. */
export const ExportMenu: React.FC<ExportMenuProps> = ({ groupName, tasks, users, teamDeadline }) => {
  const { t, language } = useApp();
  const [open, setOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  // Once the paper version is on the page, open the print window
  useEffect(() => (printing ? printPage(() => setPrinting(false)) : undefined), [printing]);

  const exportPdf = () => {
    setOpen(false);
    setPrinting(true);
  };

  const exportCsv = () => {
    setOpen(false);
    const labels = buildExportLabels(t);
    const rows = exportRows(tasks, users, labels, language).map(exportRowCells);
    downloadBlob(new Blob([toCsv(exportHeaders(labels), rows)], { type: 'text/csv;charset=utf-8' }), exportFileName(groupName, 'csv', todayLocal()));
  };

  const exportXlsx = async () => {
    setOpen(false);
    const labels = buildExportLabels(t);
    // Loaded only now: the Excel library is large and most visits never export
    const { buildXlsx } = await import('./exportXlsx');
    const buffer = await buildXlsx(exportRows(tasks, users, labels, language), labels, buildXlsxLabels(t), groupName, toDay(todayLocal()));
    downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), exportFileName(groupName, 'xlsx', todayLocal()));
  };

  const item ='flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-neutral-100';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={tasks.length === 0}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="size-3.5" />
        {t.exportLabel}
        <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1.5 w-64 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
          <button role="menuitem" onClick={exportPdf} className={item}>
            <Printer className="size-4 text-brand" />
            {t.exportPdf}
          </button>
          <button role="menuitem" onClick={() => void exportXlsx()} className={item}>
            <FileSpreadsheet className="size-4 text-brand" />
            {t.exportXlsx}
          </button>
          <button role="menuitem" onClick={exportCsv} className={item}>
            <FileSpreadsheet className="size-4 text-brand" />
            {t.exportCsv}
          </button>
          <p className="px-3 pb-1.5 pt-1 text-[11px] leading-relaxed text-neutral-500">{t.exportHint}</p>
        </div>
      )}
      {printing && createPortal(<PrintableTimeline groupName={groupName} tasks={tasks} users={users} teamDeadline={teamDeadline} />, document.body)}
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

import { Icons } from '../icons';

interface ExportMenuProps {
  groupName: string;
  tasks: Task[];
  users: User[];
  teamDeadline?: string;
}

/** Export button: PDF, Excel or CSV. */
export const ExportMenu: React.FC<ExportMenuProps> = ({ groupName, tasks, users, teamDeadline }) => {
  const { t, language } = useApp();
  const [open, setOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

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
    const { buildXlsx } = await import('./exportXlsx');
    const buffer = await buildXlsx(exportRows(tasks, users, labels, language), labels, buildXlsxLabels(t), groupName, toDay(todayLocal()));
    downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), exportFileName(groupName, 'xlsx', todayLocal()));
  };

  const item = 'flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-3 text-left text-sm sm:py-2 sm:text-xs font-medium transition-colors hover:bg-neutral-100';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={tasks.length === 0}
        aria-label={t.exportLabel}
        title={t.exportLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icons.export className="size-3.5" />
        <span className="hidden sm:inline">{t.exportLabel}</span>
        <Icons.expand className={`hidden size-3.5 transition-transform sm:block ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <button type="button" aria-label={t.close} onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default bg-black/40 sm:hidden" />
        <div
          role="menu"
          className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:z-30 sm:mt-1.5 sm:w-64 sm:shadow-lg"
        >
          <button role="menuitem" onClick={exportPdf} className={item}>
            <Icons.print className="size-4 text-brand-ink" />
            {t.exportPdf}
          </button>
          <button role="menuitem" onClick={() => void exportXlsx()} className={item}>
            <Icons.excel className="size-4 text-brand-ink" />
            {t.exportXlsx}
          </button>
          <button role="menuitem" onClick={exportCsv} className={item}>
            <Icons.csv className="size-4 text-brand-ink" />
            {t.exportCsv}
          </button>
          <p className="px-3 pb-1.5 pt-1 text-[11px] leading-relaxed text-neutral-500">{t.exportHint}</p>
        </div>
        </>
      )}
      {printing && createPortal(<PrintableTimeline groupName={groupName} tasks={tasks} users={users} teamDeadline={teamDeadline} />, document.body)}
    </div>
  );
};

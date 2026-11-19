import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IMPORT_LIMIT, IMPORT_TEMPLATE, parseTaskImport, type ImportProblem } from '@shared/taskImport';
import { useApp } from '../context/AppContext';
import { useEscape } from '../lib/useEscape';
import { Icons } from './icons';

const PLACEHOLDER = 'Task title\tModule\tAssign to\tMembers\tDue date\nInstall tools\tTeam\tEveryone\t\t2026-11-20';

interface ImportTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Create many tasks at once from a table pasted from Google Sheets / Excel, or from a CSV file. */
export const ImportTasksModal: React.FC<ImportTasksModalProps> = ({ isOpen, onClose }) => {
  const { t, activeGroupMembers, importTasks } = useApp();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEscape(isOpen, onClose);

  const result = useMemo(() => (text.trim() ? parseTaskImport(text, activeGroupMembers) : null), [text, activeGroupMembers]);

  if (!isOpen) return null;

  const ready = result?.rows.filter(row => row.task) ?? [];
  const broken = result?.rows.filter(row => !row.task) ?? [];

  const problemText = (problem: ImportProblem): string => {
    const value = 'value' in problem ? problem.value : '';
    const messages: Record<ImportProblem['code'], string> = {
      noTitle: t.importErrNoTitle,
      noDue: t.importErrNoDue,
      badDate: t.importErrBadDate,
      badTime: t.importErrBadTime,
      badPriority: t.importErrBadPriority,
      startAfterDue: t.importErrStartAfterDue,
      noAssignee: t.importErrNoAssignee,
      unknownMember: t.importErrUnknownMember,
      viewer: t.importErrViewer,
    };
    return messages[problem.code].replace('{v}', value);
  };

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setText(await file.text());
    if (fileRef.current) fileRef.current.value = '';
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob(['﻿' + IMPORT_TEMPLATE], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sameakki-tasks-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const close = () => {
    setText('');
    onClose();
  };

  const submit = async () => {
    if (ready.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await importTasks(ready.map(row => row.task!));
      close();
    } catch {
      // The error is shown by the app; the table stays so it can be fixed
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
      <div role="dialog" aria-modal="true" aria-label={t.importTasks} className="modal-panel flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-neutral-200 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
              <Icons.excel className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{t.importTasks}</h2>
              <p className="text-xs text-neutral-500">{t.importHint}</p>
            </div>
          </div>
          <button onClick={close} aria-label={t.cancel} className="cursor-pointer rounded-lg p-1 text-neutral-400 hover:text-black">
            <Icons.close className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="import-text" className="text-xs font-bold text-black">{t.importPasteLabel}</label>
              <div className="flex items-center gap-2 text-xs">
                <button type="button" onClick={() => fileRef.current?.click()} className="cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 py-1 font-semibold text-neutral-700 hover:bg-neutral-100">
                  {t.importFile}
                </button>
                <button type="button" onClick={downloadTemplate} className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 font-semibold text-neutral-700 hover:bg-neutral-100">
                  <Icons.export className="size-3.5" />
                  {t.importTemplate}
                </button>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" className="hidden" onChange={e => readFile(e.target.files?.[0])} />
            </div>
            <textarea
              id="import-text"
              rows={6}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={PLACEHOLDER}
              spellCheck={false}
              className="block w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-black placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">{t.importColumns}</p>
          </div>

          {result && result.missingColumns.length > 0 && (
            <div className="space-y-1 rounded-lg bg-neutral-100 p-3 text-xs text-black">
              {result.missingColumns.includes('title') && <p className="flex items-center gap-1.5"><Icons.warning className="size-3.5 shrink-0" />{t.importMissingTitle}</p>}
              {result.missingColumns.includes('due') && <p className="flex items-center gap-1.5"><Icons.warning className="size-3.5 shrink-0" />{t.importMissingDue}</p>}
            </div>
          )}

          {result && result.missingColumns.length === 0 && (
            <div className="space-y-2">
              {result.rows.length === 0 ? (
                <p className="text-xs text-neutral-500">{t.importNothing}</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-brand px-2.5 py-0.5 text-white">{t.importReadyCount.replace('{n}', String(ready.length))}</span>
                    {broken.length > 0 && <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-black">{t.importProblemCount.replace('{n}', String(broken.length))}</span>}
                    {result.tooMany && <span className="text-neutral-600">{t.importTooMany.replace('{n}', String(IMPORT_LIMIT))}</span>}
                  </div>

                  <ul className="max-h-64 divide-y divide-neutral-200 overflow-y-auto rounded-lg border border-neutral-200 text-xs">
                    {result.rows.map(row => (
                      <li key={row.line} className="flex items-start gap-2 px-3 py-2">
                        {row.task ? <Icons.confirm className="mt-0.5 size-3.5 shrink-0 text-brand-ink" /> : <Icons.error className="mt-0.5 size-3.5 shrink-0 text-neutral-500" />}
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-semibold text-black">
                            <span className="mr-1.5 font-normal text-neutral-500">{t.importRow.replace('{n}', String(row.line))}</span>
                            {row.title || '-'}
                          </p>
                          {row.task ? (
                            <p className="break-words text-neutral-600">
                              {row.who || t.importEveryone} · {row.task.dueDate}
                              {row.task.dueTime ? ` ${row.task.dueTime}` : ''} · {row.task.module}
                            </p>
                          ) : (
                            row.problems.map((problem, i) => (
                              <p key={i} className="text-neutral-600">{problemText(problem)}</p>
                            ))
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {broken.length > 0 && <p className="text-[11px] text-neutral-500">{t.importSkipNote}</p>}
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
          <button onClick={close} className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100">
            {t.cancel}
          </button>
          <button
            onClick={submit}
            disabled={ready.length === 0 || submitting}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-dark disabled:cursor-default disabled:opacity-50"
          >
            {submitting ? <Icons.loading className="size-3.5 animate-spin" /> : <Icons.add className="size-3.5" />}
            {t.importButton.replace('{n}', String(ready.length))}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

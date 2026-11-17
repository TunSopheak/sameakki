import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Comment, CommentKind } from '@shared/types';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { CommentForm } from './comments/CommentForm';
import { CommentItem } from './comments/CommentItem';
import { Icons } from './icons';

interface CommentThreadProps {
  kind: CommentKind;
  targetId: string;
  count: number;
}

/** Comments under a task or a daily update. */
export const CommentThread: React.FC<CommentThreadProps> = ({ kind, targetId, count }) => {
  const { t, currentUser, canContribute, isDemo, showError } = useApp();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Comment[] | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const scrollDown = useRef(false);

  const fail = useCallback((err: unknown) => showError(err instanceof Error ? err.message : String(err)), [showError]);

  const load = useCallback(async () => {
    if (isDemo) {
      setItems([]);
      return;
    }
    try {
      setItems(await api.comments(kind, targetId));
    } catch (err) {
      fail(err);
    }
  }, [isDemo, kind, targetId, fail]);

  useEffect(() => {
    if (open) void load();
  }, [open, count, load]);

  useEffect(() => {
    if (!scrollDown.current) return;
    scrollDown.current = false;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [items]);

  const add = async (body: string) => {
    if (isDemo) {
      showError(t.demoReadOnly);
      return false;
    }
    try {
      const created = await api.addComment(kind, targetId, body);
      scrollDown.current = true;
      setItems(list => [...(list ?? []), created]);
      return true;
    } catch (err) {
      fail(err);
      return false;
    }
  };

  const edit = async (comment: Comment, body: string) => {
    try {
      const updated = await api.editComment(comment.id, body);
      setItems(list => (list ?? []).map(c => (c.id === updated.id ? updated : c)));
      return true;
    } catch (err) {
      fail(err);
      return false;
    }
  };

  const remove = async (comment: Comment) => {
    if (!confirm(t.commentDeleteConfirm)) return;
    try {
      await api.deleteComment(comment.id);
      setItems(list => (list ?? []).filter(c => c.id !== comment.id));
    } catch (err) {
      fail(err);
    }
  };

  const shown = items ? items.length : count;

  return (
    <div className="text-xs">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-neutral-600 hover:text-black"
      >
        <Icons.comments className="size-3.5" />
        {t.commentsLabel}
        {shown > 0 && <span className="rounded-full bg-neutral-100 px-1.5 py-px font-mono-numbers text-[11px] text-black">{shown}</span>}
      </button>

      {open && (
        <div className="animate-rise mt-2 space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
          {items === null ? (
            <div className="space-y-3" aria-hidden>
              {[0, 1].map(i => (
                <div key={i} className="flex animate-pulse items-start gap-2.5">
                  <div className="size-7 shrink-0 rounded-full bg-neutral-200" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-2.5 w-24 rounded bg-neutral-200" />
                    <div className="h-2.5 w-3/4 rounded bg-neutral-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length > 0 ? (
            <ul ref={listRef} className="max-h-80 space-y-3.5 overflow-y-auto pr-1">
              {items.map(comment => (
                <CommentItem key={comment.id} comment={comment} onEdit={body => edit(comment, body)} onDelete={() => remove(comment)} />
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center gap-2 py-1 text-center text-neutral-500">
              <Icons.comments className="size-4 text-neutral-400" />
              <p>{t.commentsEmpty}</p>
            </div>
          )}

          {canContribute ? (
            <div className={`flex items-start gap-2.5 ${items && items.length > 0 ? 'border-t border-neutral-200 pt-3' : ''}`}>
              <Avatar name={currentUser.name} avatar={currentUser.avatar} className="mt-0.5 size-8 shrink-0" />
              <CommentForm placeholder={t.commentPlaceholder} submitLabel={t.commentSend} onSubmit={add} />
            </div>
          ) : (
            <p className="text-neutral-500">{t.commentViewerNote}</p>
          )}
        </div>
      )}
    </div>
  );
};

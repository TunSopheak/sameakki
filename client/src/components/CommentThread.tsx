import React, { useCallback, useEffect, useState } from 'react';
import type { Comment, CommentKind } from '@shared/types';
import { api } from '../lib/api';
import { timeAgo } from '../lib/notificationText';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { Icons } from './icons';

interface CommentThreadProps {
  kind: CommentKind;
  targetId: string;
  count: number;
}

/** Comments under a task or a daily update. */
export const CommentThread: React.FC<CommentThreadProps> = ({ kind, targetId, count }) => {
  const { t, language, currentUser, canContribute, isTeamLead, isDemo, showError } = useApp();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Comment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (isDemo) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      setItems(await api.comments(kind, targetId));
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [isDemo, kind, targetId, showError]);

  useEffect(() => {
    if (open) void load();
  }, [open, count, load]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    if (isDemo) {
      showError(t.demoReadOnly);
      return;
    }
    setSending(true);
    try {
      const created = await api.addComment(kind, targetId, body);
      setItems(list => [...(list ?? []), created]);
      setText('');
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  const remove = async (comment: Comment) => {
    if (!confirm(t.commentDeleteConfirm)) return;
    try {
      await api.deleteComment(comment.id);
      setItems(list => (list ?? []).filter(c => c.id !== comment.id));
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
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
        {shown > 0 && <span className="rounded-full bg-neutral-100 px-1.5 py-px font-mono text-[11px] text-black">{shown}</span>}
      </button>

      {open && (
        <div className="animate-rise mt-2 space-y-3 rounded-lg bg-neutral-50 p-3">
          {loading && items === null ? (
            <div className="flex justify-center py-2 text-neutral-400">
              <Icons.loading className="size-4 animate-spin" />
            </div>
          ) : items && items.length > 0 ? (
            <ul className="space-y-3">
              {items.map(c => {
                const mine = c.userId === currentUser.id;
                const name = language === 'km' && c.userNameKm ? c.userNameKm : c.userName;
                return (
                  <li key={c.id} className="flex items-start gap-2">
                    <Avatar name={c.userName} avatar={c.avatar} className="mt-0.5 size-6 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate font-semibold text-black">{name}</span>
                        <span className="shrink-0 text-[11px] text-neutral-400">{timeAgo(c.createdAt, language)}</span>
                        {(mine || isTeamLead) && !isDemo && (
                          <button
                            onClick={() => remove(c)}
                            aria-label={t.delete}
                            title={t.delete}
                            className="ml-auto shrink-0 cursor-pointer text-neutral-400 hover:text-black"
                          >
                            <Icons.remove className="size-3" />
                          </button>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap break-words text-neutral-800">{c.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-neutral-500">{t.commentsEmpty}</p>
          )}

          {canContribute ? (
            <form onSubmit={send} className="flex items-end gap-2">
              <textarea
                rows={2}
                value={text}
                maxLength={2000}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void send();
                }}
                placeholder={t.commentPlaceholder}
                className="min-w-0 flex-1 resize-none rounded-lg border border-neutral-200 bg-white p-2 text-xs text-black focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                aria-label={t.commentSend}
                title={`${t.commentSend} (Ctrl+Enter)`}
                className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-white shadow-xs hover:bg-brand-dark disabled:opacity-50"
              >
                {sending ? <Icons.loading className="size-3.5 animate-spin" /> : <Icons.send className="size-3.5" />}
                <span className="hidden sm:inline">{t.commentSend}</span>
              </button>
            </form>
          ) : (
            <p className="text-neutral-500">{t.commentViewerNote}</p>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../icons';

const MAX_LENGTH = 2000;

interface CommentFormProps {
  initial?: string;
  placeholder: string;
  submitLabel: string;
  autoFocus?: boolean;
  /** Return true when saved, so the form can clear itself */
  onSubmit: (body: string) => Promise<boolean>;
  onCancel?: () => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({ initial = '', placeholder, submitLabel, autoFocus, onSubmit, onCancel }) => {
  const { t } = useApp();
  const [text, setText] = useState(initial);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const saved = await onSubmit(body);
    setSending(false);
    if (saved && !onCancel) setText('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void send();
    if (e.key === 'Escape' && onCancel) onCancel();
  };

  return (
    <form onSubmit={send} className="min-w-0 flex-1">
      <textarea
        ref={inputRef}
        rows={1}
        autoFocus={autoFocus}
        value={text}
        maxLength={MAX_LENGTH}
        placeholder={placeholder}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKeyDown}
        className="block w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-black focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
      />
      <div className="mt-1.5 flex items-center justify-end gap-2">
        {text.length > MAX_LENGTH - 200 && (
          <span className="mr-auto text-[11px] text-neutral-500 font-mono-numbers">
            {text.length}/{MAX_LENGTH}
          </span>
        )}
        {onCancel && (
          <button type="button" onClick={onCancel} className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100">
            {t.cancel}
          </button>
        )}
        <button
          type="submit"
          disabled={sending || !text.trim()}
          title={`${submitLabel} (Ctrl+Enter)`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-dark disabled:cursor-default disabled:opacity-50"
        >
          {sending ? <Icons.loading className="size-3.5 animate-spin" /> : <Icons.send className="size-3.5" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

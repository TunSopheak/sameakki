import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { AppNotification, NotificationType } from '@shared/types';
import { api } from '../lib/api';
import { telegramLink } from '../lib/contact';
import { buildDemoNotifications } from '../lib/demoData';
import { describeNotification, timeAgo } from '../lib/notificationText';
import { useDismiss } from '../lib/useDismiss';
import { useApp } from '../context/AppContext';
import type { Tab } from './sidebar/SidebarNav';
import { Icons } from './icons';

const POLL_MS = 30_000;

const ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  task_assigned: Icons.tasks,
  task_ready_for_review: Icons.review,
  task_approved: Icons.approved,
  task_due_soon: Icons.time,
  task_rescheduled: Icons.deadline,
  task_overdue: Icons.warning,
  daily_approved: Icons.approved,
  daily_reaction: Icons.reaction,
  plan_expiring: Icons.deadline,
  comment_added: Icons.comments,
  password_reset: Icons.password,
};

interface NotificationBellProps {
  onNavigate: (tab: Tab) => void;
}

/** The bell in the header: unread count, a list of what happened, and a click to jump there. */
export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const { t, language, groups, setActiveGroupId, isDemo, showError } = useApp();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  const load = useCallback(async () => {
    if (isDemo) {
      setItems(prev => (prev.length ? prev : buildDemoNotifications()));
      return;
    }
    try {
      const res = await api.notifications();
      setItems(res.items);
      setUnread(res.unread);
    } catch {
      // Not critical: the bell just keeps what it had
    }
  }, [isDemo]);

  // Load now, then keep fresh while the tab is open and when it regains focus
  useEffect(() => {
    void load();
    const tick = () => {
      if (document.visibilityState === 'visible') void load();
    };
    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [load]);

  // The demo has no server, so count its unread items here
  const unreadCount = isDemo ? items.filter(i => !i.read).length : unread;

  const markRead = async (n: AppNotification) => {
    if (n.read) return;
    setItems(list => list.map(i => (i.id === n.id ? { ...i, read: true } : i)));
    setUnread(c => Math.max(0, c - 1));
    if (isDemo) return;
    try {
      await api.markNotificationRead(n.id);
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
      void load();
    }
  };

  const markAll = async () => {
    setItems(list => list.map(i => ({ ...i, read: true })));
    setUnread(0);
    if (isDemo) return;
    try {
      await api.markAllNotificationsRead();
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
      void load();
    }
  };

  const openItem = (n: AppNotification, tab?: Tab) => {
    void markRead(n);
    if (n.groupId && groups.some(g => g.id === n.groupId)) setActiveGroupId(n.groupId);
    if (tab) onNavigate(tab);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={t.notifTitle}
        aria-expanded={open}
        title={t.notifTitle}
        className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-100"
      >
        <Icons.notifications className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
            <h3 className="text-sm font-bold text-black">{t.notifTitle}</h3>
            {unreadCount > 0 && (
              <button onClick={markAll} className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-black hover:underline">
                <Icons.readAll className="size-3.5" />
                {t.notifMarkAll}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-neutral-500">
              <Icons.notifications className="mx-auto mb-2 size-6 text-neutral-300" />
              {t.notifEmpty}
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100 overflow-y-auto">
              {items.map(n => {
                const view = describeNotification(n, language);
                const Icon = ICONS[n.type];
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => openItem(n, view.tab)}
                      className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-100 ${
                        n.read ? '' : 'bg-brand-soft/60'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
                          n.type === 'task_overdue' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-xs leading-relaxed text-black ${n.read ? '' : 'font-semibold'}`}>{view.text}</span>
                        {view.note && (
                          <span className="mt-1 block rounded-md bg-neutral-100 px-2 py-1 text-[11px] italic text-neutral-600">“{view.note}”</span>
                        )}
                        {n.type === 'plan_expiring' && (
                          <a
                            href={telegramLink(t.notifRenewMessage)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                          >
                            <Icons.send className="size-3" />
                            {t.contactTelegram}
                          </a>
                        )}
                        <span className="mt-1 block text-[11px] text-neutral-400">{timeAgo(n.createdAt, language)}</span>
                      </span>
                      {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" aria-label="unread" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

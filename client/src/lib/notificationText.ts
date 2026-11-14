import type { AppNotification } from '@shared/types';
import type { Language } from '../locales/translations';
import type { Tab } from '../components/sidebar/SidebarNav';

export interface NotificationView {
  text: string;
  /** A note the leader wrote, shown under the text. */
  note?: string;
  /** The tab to open when it is clicked. */
  tab?: Tab;
}

/** Words for a notification, in the reader's language (the database only keeps the type and values). */
export function describeNotification(n: AppNotification, language: Language): NotificationView {
  const km = language === 'km';
  const who = n.actorName || (km ? 'មានម្នាក់' : 'Someone');
  const p = n.params;
  const title = p.title ?? '';
  const note = p.feedback;

  switch (n.type) {
    case 'task_assigned':
      return {
        tab: 'tasks',
        text: km
          ? `${who} បានចាត់កិច្ចការ «${title}» ជូនអ្នក (ផុតកំណត់ ${p.dueDate})`
          : `${who} assigned you "${title}" (due ${p.dueDate})`,
      };
    case 'task_ready_for_review':
      return {
        tab: 'tasks',
        text: km
          ? `${who} បានបញ្ចប់កិច្ចការ «${title}» ហើយរង់ចាំអ្នកពិនិត្យ`
          : `${who} finished "${title}" and is waiting for your review`,
      };
    case 'task_approved':
      return {
        tab: 'tasks',
        note,
        text: km ? `${who} បានអនុម័តកិច្ចការ «${title}»` : `${who} approved your task "${title}"`,
      };
    case 'task_due_soon':
      return {
        tab: 'tasks',
        text: km ? `កិច្ចការ «${title}» ជិតដល់ថ្ងៃកំណត់ (${p.dueDate})` : `"${title}" is due soon (${p.dueDate})`,
      };
    case 'task_overdue':
      return {
        tab: 'tasks',
        text: km ? `កិច្ចការ «${title}» ហួសថ្ងៃកំណត់ហើយ (${p.dueDate})` : `"${title}" is overdue (was due ${p.dueDate})`,
      };
    case 'daily_approved':
      return {
        tab: 'daily',
        note,
        text: km ? `${who} បានអនុម័តរបាយការណ៍ប្រចាំថ្ងៃ «${title}»` : `${who} approved your daily update "${title}"`,
      };
    case 'daily_reaction':
      return {
        tab: 'daily',
        text: km
          ? `${who} បានបញ្ចេញប្រតិកម្ម ${p.emoji ?? ''} លើរបាយការណ៍របស់អ្នក «${title}»`
          : `${who} reacted ${p.emoji ?? ''} to your update "${title}"`,
      };
    case 'comment_added':
      return {
        tab: p.kind === 'task' ? 'tasks' : 'daily',
        note: p.snippet,
        text: km ? `${who} បានបញ្ចេញមតិលើ «${title}»` : `${who} commented on "${title}"`,
      };
    case 'password_reset':
      return {
        text: km
          ? `${who} បានកំណត់ពាក្យសម្ងាត់គណនីរបស់អ្នកឡើងវិញ។ បើអ្នកមិនបានស្នើសុំ សូមទាក់ទងប្រធានក្រុមរបស់អ្នក។`
          : `${who} reset your account password. If you did not ask for this, contact your team leader.`,
      };
    case 'plan_expiring':
      return {
        text: km
          ? `កញ្ចប់របស់អ្នកនឹងផុតកំណត់នៅថ្ងៃ ${p.expiresAt}។ សូមទាក់ទង Admin ដើម្បីបន្ត។`
          : `Your plan ends on ${p.expiresAt}. Contact the Admin to renew.`,
      };
  }
}

/** "5 minutes ago" in the reader's language. */
export function timeAgo(iso: string, language: Language): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(language === 'km' ? 'km' : 'en', { numeric: 'auto' });
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(Math.round(seconds / 1), 'second');
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  return rtf.format(Math.round(seconds / 86400), 'day');
}

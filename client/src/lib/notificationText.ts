import type { Language } from '../locales/translations';

export { describeNotification, type NotificationView } from '@shared/notificationText';

export function timeAgo(iso: string, language: Language): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(language === 'km' ? 'km' : 'en', { numeric: 'auto' });
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(Math.round(seconds / 1), 'second');
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  return rtf.format(Math.round(seconds / 86400), 'day');
}

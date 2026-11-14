// Where people go to ask the Super Admin for a Team Leader account.
export const TELEGRAM_USERNAME = 'TUN_SOPHEAK';

export const telegramLink = (message?: string) =>
  `https://t.me/${TELEGRAM_USERNAME}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

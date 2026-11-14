export const TELEGRAM_USERNAME = 'TUN_SOPHEAK';

export const telegramLink = (message?: string) =>
  `https://t.me/${TELEGRAM_USERNAME}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

export const CREATOR = {
  name: 'Tun Sopheak',
  nameKm: 'ទុន សុភ័ក្ខ',
  github: 'https://github.com/TunSopheak',
};

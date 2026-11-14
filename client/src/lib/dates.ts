// Dates in local time (toISOString is UTC)

const pad = (n: number) => String(n).padStart(2, '0');

export const toLocalDateString = (d: Date = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayLocal = () => toLocalDateString();

export const parseLocalDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const daysUntil = (value: string) => {
  const today = parseLocalDate(todayLocal());
  return Math.round((parseLocalDate(value).getTime() - today.getTime()) / 86_400_000);
};

export const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
};

export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${toLocalDateString(d)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const localDateOf = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso.slice(0, 10) : toLocalDateString(d);
};

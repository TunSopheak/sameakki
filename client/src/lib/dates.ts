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

/** A date string moved by some days, e.g. shiftDate('2026-11-30', 1) is '2026-12-01'. */
export const shiftDate = (value: string, days: number) => {
  const d = parseLocalDate(value);
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
};

/** The 42 days (six weeks, Monday first) that fill a month's calendar grid. */
export const monthGrid = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => toLocalDateString(new Date(year, month, 1 - lead + i)));
};

const locale = (language: string) => (language === 'km' ? 'km-KH' : 'en-GB');

export const formatDateLong = (value: string, language: string) =>
  new Intl.DateTimeFormat(locale(language), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(parseLocalDate(value));

export const formatMonthYear = (year: number, month: number, language: string) =>
  new Intl.DateTimeFormat(locale(language), { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));

/** Monday to Sunday, short names. */
export const weekdayNames = (language: string) =>
  Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale(language), { weekday: 'short' }).format(new Date(2024, 0, 1 + i)));

export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${toLocalDateString(d)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const localDateOf = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso.slice(0, 10) : toLocalDateString(d);
};

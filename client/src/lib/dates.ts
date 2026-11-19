// Dates in local time (toISOString is UTC)

const pad = (n: number) => String(n).padStart(2, '0');

export const toLocalDateString = (d: Date = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Same zone as the server, so "today" is the same for everyone. */
export const APP_TIME_ZONE = 'Asia/Phnom_Penh';

export const dateInAppZone = (moment: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(moment);

export const todayLocal = () => dateInAppZone(new Date());

export const parseLocalDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const daysUntil = (value: string) => {
  const today = parseLocalDate(todayLocal());
  return Math.round((parseLocalDate(value).getTime() - today.getTime()) / 86_400_000);
};

export const addDays = (days: number) => shiftDate(todayLocal(), days);

export const shiftDate = (value: string, days: number) => {
  const d = parseLocalDate(value);
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
};

/** Same day number in another month, kept inside that month. */
export const shiftMonth = (value: string, months: number) => {
  const d = parseLocalDate(value);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return toLocalDateString(d);
};

export const monthBounds = (year: number, month: number) => ({
  first: toLocalDateString(new Date(year, month, 1)),
  last: toLocalDateString(new Date(year, month + 1, 0)),
});

/** Six weeks, Monday first, that fill a month grid. */
export const monthGrid = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => toLocalDateString(new Date(year, month, 1 - lead + i)));
};

const locale = (language: string) => (language === 'km' ? 'km-KH' : 'en-GB');

// Written out because some browsers have no Khmer date data
const KM_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
const KM_WEEKDAYS = ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ']; // Monday first
const KM_WEEKDAYS_SHORT = ['ច', 'អ', 'ព', 'ព្រ', 'សុ', 'សៅ', 'អា'];

export const formatDateLong = (value: string, language: string) => {
  const d = parseLocalDate(value);
  if (language === 'km') return `${KM_WEEKDAYS[(d.getDay() + 6) % 7]} ${d.getDate()} ${KM_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return new Intl.DateTimeFormat(locale(language), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(d);
};

/** "22 Nov 2026" / "22 វិច្ឆិកា 2026" */
export const formatDateShort = (value: string, language: string) => {
  if (!value) return '';
  const d = parseLocalDate(value);
  return `${d.getDate()} ${monthShortNames(language)[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatMonthYear =(year: number, month: number, language: string) =>
  language === 'km' ? `${KM_MONTHS[month]} ${year}` : new Intl.DateTimeFormat(locale(language), { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));

export const formatYear = (year: number, language: string) =>
  language === 'km' ? String(year) : new Intl.DateTimeFormat(locale(language), { year: 'numeric' }).format(new Date(year, 0, 1));

export const monthShortNames = (language: string) =>
  language === 'km' ? KM_MONTHS : Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(locale(language), { month: 'short' }).format(new Date(2024, i, 1)));

export const weekdayNames = (language: string) =>
  language === 'km' ? KM_WEEKDAYS_SHORT : Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale(language), { weekday: 'short' }).format(new Date(2024, 0, 1 + i)));

export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${toLocalDateString(d)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const localDateOf = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso.slice(0, 10) : dateInAppZone(d);
};

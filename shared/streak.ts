/**
 * Streaks: how many days in a row a member posted their daily ToDo.
 *
 * - A day counts when the member posted at least one ToDo on that day (Cambodia time).
 * - The streak is still alive today if the member has not posted yet, as long as they posted yesterday.
 *   It breaks when a whole day passes with no post.
 * - Days after today never count, so a post cannot be made for a future day to fake a streak.
 */

export interface StreakInfo {
  /** Days in a row, ending today (or yesterday while today is still open) */
  current: number;
  /** Longest run ever */
  best: number;
  /** Different days with a post */
  total: number;
  postedToday: boolean;
}

const DAY_MS = 86_400_000;

/** The day before a YYYY-MM-DD date */
export const previousDay = (date: string): string => new Date(Date.parse(`${date}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);

export function computeStreak(postDays: Iterable<string>, today: string): StreakInfo {
  const days = [...new Set([...postDays].filter(day => day <= today))].sort();
  const have = new Set(days);
  const postedToday = have.has(today);

  let current = 0;
  for (let day = postedToday ? today : previousDay(today); have.has(day); day = previousDay(day)) current++;

  let best = 0;
  let run = 0;
  let before = '';
  for (const day of days) {
    run = before && previousDay(day) === before ? run + 1 : 1;
    best = Math.max(best, run);
    before = day;
  }

  return { current, best, total: days.length, postedToday };
}

export interface RankedMember extends StreakInfo {
  userId: string;
  name: string;
  /** Has connected Telegram, so a poke also reaches them there. A yes/no only. */
  telegram?: boolean;
}

/** Longest current streak first. Ties go to the longer best run, then to more days, then to the name. */
export const rankMembers = <T extends RankedMember>(members: T[]): T[] =>
  [...members].sort((a, b) => b.current - a.current || b.best - a.best || b.total - a.total || a.name.localeCompare(b.name));

/** Streak lengths worth celebrating */
export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365] as const;

/** The milestone reached when a streak grew from `before` to `after`, or null */
export const milestoneReached = (before: number, after: number): number | null => {
  const reached = STREAK_MILESTONES.filter(m => before < m && after >= m);
  return reached.length > 0 ? reached[reached.length - 1] : null;
};

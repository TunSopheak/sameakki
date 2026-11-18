import type { DailyTodoItem } from './types';

const BULLET = /^(?:[-*•]|\d+[.)])\s*/;
const isBullet = (line: string) => BULLET.test(line);

/**
 * Turns a daily update into a title and checklist items.
 *   Project name            <- a line without "-" is a heading (the first one is the title)
 *   - task one - 80%        <- a line starting with "-" is a task to tick, optional progress
 *   - [x] task two          <- [x] or 100% means done
 *   Another part            <- more headings group the tasks under them
 *   - task three
 * The heading is optional: a list of only "-" lines is just tasks.
 * A plain line with no "-" is also read as a task, unless a "-" line follows it (then it is a heading).
 */
export const parseRawLogContent = (rawText: string): { title: string; items: DailyTodoItem[] } => {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { title: 'Daily Update', items: [] };
  }

  const seed = Date.now().toString(36);
  const clean = (line: string) => line.replace(/^[-*•#\s]+/, '').trim();

  let title = 'Daily Update';
  let start = 0;
  if (!isBullet(lines[0])) {
    title = clean(lines[0]) || title;
    start = 1;
  }

  let group: string | undefined;
  const items: DailyTodoItem[] = [];

  lines.slice(start).forEach((line, idx) => {
    const next = lines[start + idx + 1];
    // A plain line followed by a "-" line starts a new group
    if (!isBullet(line) && next !== undefined && isBullet(next)) {
      group = clean(line) || group;
      return;
    }

    const pctMatch = line.match(/[-–—]\s*(\d{1,3}%)\s*$/) || line.match(/\((\d{1,3}%)\)\s*$/);
    const progressTag = pctMatch ? pctMatch[1] : undefined;

    let text = line.replace(BULLET, '').trim();
    if (progressTag) {
      text = text.replace(/[-–—]\s*\d{1,3}%\s*$/, '').replace(/\(\d{1,3}%\)\s*$/, '').trim();
    }

    const done = /\[[xX]\]/.test(text) || progressTag === '100%';
    text = text.replace(/\[[xX\s]\]/g, '').trim();
    // A bare "-" or "[ ]" with no words is not a task
    if (!text) return;

    items.push({
      id: `item_${seed}_${idx}`,
      text,
      done,
      ...(group ? { group } : {}),
      ...(progressTag ? { progressTag } : {}),
    });
  });

  return { title, items };
};

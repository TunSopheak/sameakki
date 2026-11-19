import type { When, Scope } from './taskFilters';

/** A filter to start a page with, for example when a card on the Overview opens the Tasks page already filtered. */
export interface PagePreset {
  page: 'tasks' | 'daily';
  status?: string;
  scope?: Scope;
  when?: When;
}

let pending: PagePreset | null = null;

/** Set before changing the page. Pass null to clear it. */
export const setPagePreset = (preset: PagePreset | null) => {
  pending = preset;
};

/**
 * Read by the page when it opens. It stays until the next page change, so a page that renders twice
 * (React strict mode in development) sees the same preset both times.
 */
export const peekPagePreset = (page: PagePreset['page']): PagePreset | null => (pending?.page === page ? pending : null);

import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

interface Options<T> {
  /** Text a row can be found by */
  searchText: (row: T) => string;
  /** One compare function per sortable column */
  compare: Record<string, (a: T, b: T) => number>;
  initialSort: { key: string; dir: SortDir };
  pageSize?: number;
}

/** Search, sort and paging for a list that is already in memory. */
export function useTableView<T>(rows: T[], { searchText, compare, initialSort, pageSize = 10 }: Options<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(0);

  const result = useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = q ? rows.filter(row => searchText(row).toLowerCase().includes(q)) : rows;
    const sign = sort.dir === 'asc' ? 1 : -1;
    const sorted = [...found].sort((a, b) => sign * compare[sort.key](a, b));
    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    const current = Math.min(page, pageCount - 1);
    return { total: sorted.length, pageCount, current, pageRows: sorted.slice(current * pageSize, (current + 1) * pageSize) };
    // compare and searchText are stable per table, so they are left out on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, sort, page, pageSize]);

  return {
    query,
    setQuery: (value: string) => {
      setQuery(value);
      setPage(0);
    },
    sort,
    toggleSort: (key: string) => {
      setSort(prev => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
      setPage(0);
    },
    page: result.current,
    setPage,
    ...result,
  };
}

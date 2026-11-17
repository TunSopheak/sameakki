import { useLayoutEffect, useState, type RefObject } from 'react';

/** Position of the active list item, so one highlight can slide between items. */
export const useActivePill = (listRef: RefObject<HTMLElement | null>, deps: unknown[]) => {
  const [pill, setPill] = useState<{ top: number; height: number } | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      const active = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
      setPill(active ? { top: active.offsetTop, height: active.offsetHeight } : null);
    };
    measure();
    // No slide on the first paint
    const frame = requestAnimationFrame(() => setReady(true));
    window.addEventListener('resize', measure);
    const observer = new ResizeObserver(measure);
    if (listRef.current) observer.observe(listRef.current);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { pill, ready };
};

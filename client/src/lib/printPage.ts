const PRINTING = 'printing';

/** Opens the print window. Only .print-root is shown. Returns a cancel function. */
export function printPage(onDone?: () => void): () => void {
  const root = document.documentElement;
  const wasDark = root.classList.contains('dark');
  let cancelled = false;
  let restored = false;

  const restore = () => {
    if (restored) return;
    restored = true;
    root.classList.remove(PRINTING);
    if (wasDark) root.classList.add('dark');
    window.removeEventListener('afterprint', finish);
  };
  function finish() {
    restore();
    onDone?.();
  }

  root.classList.add(PRINTING);
  root.classList.remove('dark');
  window.addEventListener('afterprint', finish, { once: true });

  void (async () => {
    try {
      await document.fonts?.ready;
    } catch {
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!cancelled) window.print();
      }),
    );
  })();

  return () => {
    cancelled = true;
    restore();
  };
}

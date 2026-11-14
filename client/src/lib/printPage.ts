const PRINTING = 'printing';

/**
 * Opens the browser's print window for what is on the page. While it is open the page is switched to light
 * colours and everything except the element marked `.print-root` is hidden (see index.css).
 * Returns a function that cancels and restores the page; `onDone` runs once printing has ended.
 */
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
      // Printing still works without waiting for fonts
    }
    // Two frames so the print layout has been drawn before the window opens
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

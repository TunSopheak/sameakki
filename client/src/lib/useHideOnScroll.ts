import { useEffect, useState } from 'react';

const TOP = 120;
const STEP = 8;

/** True while scrolling down, false again when scrolling up or near the top. */
export const useHideOnScroll = () => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y <= TOP) {
        setHidden(false);
        last = y;
        return;
      }
      if (Math.abs(y - last) < STEP) return;
      const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 4;
      setHidden(y > last && !atBottom);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return [hidden, () => setHidden(false)] as const;
};

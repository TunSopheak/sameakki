import { useEffect, useState } from 'react';

const QUERY = '(min-width: 1024px)';

/** True on screens where the sidebar is a fixed column (Tailwind's lg breakpoint). */
export const useIsDesktop = () => {
  const [desktop, setDesktop] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = () => setDesktop(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return desktop;
};

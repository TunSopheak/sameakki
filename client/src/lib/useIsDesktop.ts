import { useMediaQuery } from './useMediaQuery';

/** True on screens where the sidebar is a fixed column (Tailwind's lg breakpoint). */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

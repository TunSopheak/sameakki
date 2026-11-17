import { useMediaQuery } from './useMediaQuery';

/** True from the lg breakpoint up. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

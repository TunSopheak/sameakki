import { useState, type SyntheticEvent } from 'react';

export interface SideTip {
  label: string;
  top: number;
  left: number;
}

/** Tooltip shown to the right of an element, for the collapsed sidebar. */
export const useSideTooltip = (enabled: boolean) => {
  const [tip, setTip] = useState<SideTip | null>(null);

  const show = (label: string) => (e: SyntheticEvent<HTMLElement>) => {
    if (!enabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTip({ label, top: rect.top + rect.height / 2, left: rect.right + 8 });
  };

  return { tip, show, hide: () => setTip(null) };
};

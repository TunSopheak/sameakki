import React from 'react';
import type { SideTip } from '../../lib/useSideTooltip';

export const NavTooltip: React.FC<{ tip: SideTip | null }> = ({ tip }) => {
  if (!tip) return null;

  return (
    <span
      role="tooltip"
      style={{ top: tip.top, left: tip.left }}
      className="tip-in pointer-events-none fixed z-[60] -translate-y-1/2 whitespace-nowrap rounded-lg bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
    >
      {tip.label}
    </span>
  );
};

import React, { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
}

/** Counts up (or down) to `value` instead of jumping. */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, suffix = '' }) => {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setShown(value);
      return;
    }
    const start = performance.now();
    const startValue = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 700, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);
      from.current = current;
      setShown(current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <>
      {shown}
      {suffix}
    </>
  );
};

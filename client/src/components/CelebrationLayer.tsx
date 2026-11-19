import React, { useEffect, useState } from 'react';
import { onCelebrate } from '../lib/celebrate';

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  round: boolean;
  drift: number;
}

const COLORS = ['#840015', '#c8102e', '#f2b83d', '#ffd978', '#ffffff', '#ff8fb1', '#7fd1c2'];
const COUNT = 70;

/** Confetti that falls over the screen for a moment. It is not shown to people who asked for less motion. */
export const CelebrationLayer: React.FC = () => {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    let next = 0;
    return onCelebrate(() => {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      const batch: Piece[] = Array.from({ length: COUNT }, () => ({
        id: next++,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.6 + Math.random() * 1.4,
        size: 6 + Math.random() * 7,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        round: Math.random() > 0.55,
        drift: (Math.random() - 0.5) * 160,
      }));
      setPieces(current => [...current, ...batch]);
      window.setTimeout(() => setPieces(current => current.filter(p => !batch.includes(p))), 3600);
    });
  }, []);

  if (pieces.length === 0) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {pieces.map(p => (
        <span
          key={p.id}
          className="confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.round ? '50%' : 2,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
};

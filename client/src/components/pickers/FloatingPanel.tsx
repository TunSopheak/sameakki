import React, { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useMediaQuery } from '../../lib/useMediaQuery';

interface FloatingPanelProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  label: string;
  children: React.ReactNode;
}

const GAP = 6;
const EDGE = 8;

// Below the anchor, or above it when there is no room
const placePanel = (anchor: DOMRect, width: number, height: number) => {
  const below = anchor.bottom + GAP;
  const fitsBelow = below + height <= window.innerHeight - EDGE;
  const fitsAbove = anchor.top - GAP - height > EDGE;
  const top = fitsBelow || !fitsAbove ? Math.max(EDGE, Math.min(below, window.innerHeight - height - EDGE)) : anchor.top - GAP - height;
  const left = Math.max(EDGE, Math.min(anchor.left, window.innerWidth - width - EDGE));
  return { top, left };
};

/** Menu beside the control on desktop, bottom sheet on phones. Drawn on body so dialogs never clip it. */
export const FloatingPanel: React.FC<FloatingPanelProps> = ({ open, onClose, anchorRef, label, children }) => {
  const wide = useMediaQuery('(min-width: 640px)');
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !wide) return;
    const place = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (anchor && panel) setPos(placePanel(anchor, panel.offsetWidth, panel.offsetHeight));
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, wide, anchorRef]);

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      if (wide) onClose();
    };
    // Capture phase, so Escape closes only this panel and not the dialog under it
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, wide, onClose, anchorRef]);

  if (!open) return null;

  const content = wide ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={label}
      style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
      className="picker-pop z-[90] rounded-xl border border-neutral-200 bg-white shadow-2xl"
    >
      {children}
    </div>
  ) : (
    <div className="fixed inset-0 z-[90]">
      <div className="modal-overlay absolute inset-0 bg-black/45" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="sheet-up absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-neutral-200 bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-neutral-300" aria-hidden />
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

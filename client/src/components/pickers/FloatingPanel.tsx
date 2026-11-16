import React, { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useMediaQuery } from '../../lib/useMediaQuery';

interface FloatingPanelProps {
  open: boolean;
  onClose: () => void;
  /** The control the panel opens from; clicks on it do not count as "outside". */
  anchorRef: RefObject<HTMLElement | null>;
  label: string;
  children: React.ReactNode;
}

/**
 * Opens next to its control on a computer, and as a bottom sheet on a phone.
 * It is drawn on <body>, so a dialog with its own scrolling never clips it.
 */
export const FloatingPanel: React.FC<FloatingPanelProps> = ({ open, onClose, anchorRef, label, children }) => {
  const wide = useMediaQuery('(min-width: 640px)');
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !wide) return;
    const place = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const { offsetHeight: h, offsetWidth: w } = panel;
      const below = anchor.bottom + 6;
      // Flip above the control when there is no room underneath
      const top = below + h > window.innerHeight - 8 && anchor.top - 6 - h > 8 ? anchor.top - 6 - h : Math.max(8, Math.min(below, window.innerHeight - h - 8));
      const left = Math.max(8, Math.min(anchor.left, window.innerWidth - w - 8));
      setPos({ top, left });
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
    // Capture phase: Escape closes only the picker, not the dialog behind it
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

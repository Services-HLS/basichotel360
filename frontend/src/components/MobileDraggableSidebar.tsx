import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const SIDEBAR_WIDTH = 280;
const HEADER_HEIGHT = 56;
const HANDLE_H = 56;
const HANDLE_R = 26;
const HANDLE_W = HANDLE_R + 6;
const SNAP_RATIO = 0.32;
const DRAG_CLICK_THRESHOLD = 8;

const CLOSED_OFFSET = -SIDEBAR_WIDTH;
const OPEN_OFFSET = 0;

interface MobileDraggableSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export default function MobileDraggableSidebar({
  open,
  onOpenChange,
  children,
}: MobileDraggableSidebarProps) {
  const [offset, setOffset] = useState(CLOSED_OFFSET);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartOffset = useRef(CLOSED_OFFSET);
  const didDrag = useRef(false);
  const activePointerId = useRef<number | null>(null);

  useEffect(() => {
    if (!isDragging) {
      setOffset(open ? OPEN_OFFSET : CLOSED_OFFSET);
    }
  }, [open, isDragging]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const clampOffset = useCallback((value: number) => {
    return Math.min(OPEN_OFFSET, Math.max(CLOSED_OFFSET, value));
  }, []);

  const snapFromOffset = useCallback(
    (value: number) => {
      const range = OPEN_OFFSET - CLOSED_OFFSET;
      const progress = range === 0 ? 0 : (value - CLOSED_OFFSET) / range;
      onOpenChange(progress >= SNAP_RATIO);
    },
    [onOpenChange]
  );

  const endDrag = useCallback(
    (clientX: number) => {
      setIsDragging(false);
      activePointerId.current = null;
      const delta = clientX - dragStartX.current;
      const finalOffset = clampOffset(dragStartOffset.current + delta);
      snapFromOffset(finalOffset);
    },
    [clampOffset, snapFromOffset]
  );

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e: PointerEvent) => {
      if (activePointerId.current !== null && e.pointerId !== activePointerId.current) return;
      const delta = e.clientX - dragStartX.current;
      if (Math.abs(delta) > DRAG_CLICK_THRESHOLD) didDrag.current = true;
      setOffset(clampOffset(dragStartOffset.current + delta));
    };

    const onPointerUp = (e: PointerEvent) => {
      if (activePointerId.current !== null && e.pointerId !== activePointerId.current) return;
      endDrag(e.clientX);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isDragging, clampOffset, endDrag]);

  const startDrag = (clientX: number, pointerId: number) => {
    didDrag.current = false;
    setIsDragging(true);
    dragStartX.current = clientX;
    dragStartOffset.current = offset;
    activePointerId.current = pointerId;
  };

  const handleHandlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    startDrag(e.clientX, e.pointerId);
  };

  const handleHandleClick = () => {
    if (didDrag.current) return;
    onOpenChange(!open);
  };

  const handleEdgePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (open) return;
    startDrag(e.clientX, e.pointerId);
  };

  const openProgress =
    (offset - CLOSED_OFFSET) / (OPEN_OFFSET - CLOSED_OFFSET || 1);

  const handleLeft = offset + SIDEBAR_WIDTH;
  const showBackdrop = openProgress > 0.02;

  return (
    <>
      {/* Dim overlay — below header, above content */}
      <div
        className={cn(
          'fixed left-0 right-0 bottom-0 z-[44] md:hidden',
          showBackdrop ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        style={{
          top: HEADER_HEIGHT,
          backgroundColor: `rgba(0,0,0,${openProgress * 0.45})`,
          transition: isDragging ? 'none' : 'background-color 0.25s ease',
        }}
        onClick={() => onOpenChange(false)}
        aria-hidden={!showBackdrop}
      />

      {/* Swipe zone — thin strip on left edge, no visible UI */}
      {!open && !isDragging && (
        <div
          className="fixed left-0 z-[45] w-4 md:hidden"
          style={{ top: HEADER_HEIGHT, bottom: 0 }}
          onPointerDown={handleEdgePointerDown}
          aria-hidden
        />
      )}

      {/* Sidebar panel — fully off-screen when closed (no gray strip) */}
      <aside
        className={cn(
          'fixed bottom-0 left-0 z-[46] flex flex-col overflow-hidden md:hidden',
          'border-r border-border/70 bg-card/98 shadow-[8px_0_32px_rgba(0,0,0,0.14)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/95'
        )}
        style={{
          top: HEADER_HEIGHT,
          width: SIDEBAR_WIDTH,
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {children}
      </aside>

      {/* Arc semicircle tab — outline curve on the right, flat on the left edge */}
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onPointerDown={handleHandlePointerDown}
        onClick={handleHandleClick}
        className={cn(
          'fixed z-[47] flex items-center justify-center md:hidden',
          'border-0 bg-transparent p-0 shadow-none outline-none select-none touch-none',
          'active:scale-95',
          isDragging && 'opacity-80'
        )}
        style={{
          width: HANDLE_W,
          height: HANDLE_H,
          left: handleLeft,
          top: HEADER_HEIGHT + 80,
          transition: isDragging
            ? 'none'
            : 'left 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.15s ease, transform 0.15s ease',
        }}
      >
        <svg
          width={HANDLE_W}
          height={HANDLE_H}
          viewBox={`0 0 ${HANDLE_W} ${HANDLE_H}`}
          className="pointer-events-none text-primary drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]"
          aria-hidden
        >
          <path
            d={`M 3 ${HANDLE_H * 0.1} A ${HANDLE_R} ${HANDLE_R} 0 0 1 3 ${HANDLE_H * 0.9}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </>
  );
}

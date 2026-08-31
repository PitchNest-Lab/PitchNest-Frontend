import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MonitorOff } from "lucide-react";
import { cn } from "../lib/utils";

/**
 * SlideDeckViewer — presents a pitch deck ONE COMPLETE SLIDE AT A TIME.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY IT IS BUILT THIS WAY
 * ──────────────────────────────────────────────────────────────────────────────
 * The deck is a PDF served from a private bucket through a short-lived signed
 * URL, rendered in an iframe by the browser's own PDF viewer. There is no PDF
 * rendering library in this project, and adding one would mean shipping a
 * ~1 MB worker plus a build-time asset pipeline into a live pitch page.
 *
 * The browser viewer already knows how to render exactly one page, fitted to its
 * frame with the aspect ratio preserved — that is what the PDF open-parameters
 * `#page=N&view=Fit` do. So the slide surface here is a real single page, not a
 * scroll position faked to look like one:
 *
 *   • `page=N`      — the page to display
 *   • `view=Fit`    — fit the WHOLE page in the frame (never a crop, never a
 *                     zoomed fragment), which is what "one complete slide" means
 *   • `toolbar=0&navpanes=0&scrollbar=0` — hide the viewer's own chrome so the
 *                     embedded controls can't sit on top of the slide
 *
 * TOTAL PAGES COMES FROM THE SERVER. `pageCount` is measured from the document
 * itself at upload (and back-filled for older decks), never guessed from the
 * extracted text — a deck of image-only slides has no text to count, and the old
 * upload path collapsed page boundaries, so a text-derived total would report
 * "Slide 1 of 1" for a 14-page deck. If the server has no count, this component
 * refuses to paginate and renders the plain document instead of inventing pages.
 *
 * WHY TWO IFRAMES. A PDF viewer only honours `#page=` on a real navigation, and
 * changing just the fragment of an existing iframe is a same-document navigation
 * that most viewers ignore. So each page change mounts a NEW iframe (a changed
 * React key). That reloads the document, which would flash white — so the new
 * page loads in the hidden buffer and the two swap once it has painted. The
 * founder sees a clean cut between slides.
 *
 * WHY THE OVERLAY. Wheel and click events land inside the iframe's document,
 * where this component can never see them, and the embedded viewer would scroll
 * the page (breaking "one slide at a time"). A transparent layer on top takes
 * those events instead: it feeds the wheel to slide navigation and keeps the
 * embedded document from being scrolled at all.
 */

/** Fragment that makes the browser viewer show exactly one fitted page. */
function pageFragment(page: number): string {
  return `#page=${page}&view=Fit&toolbar=0&navpanes=0&scrollbar=0&pagemode=none`;
}

/**
 * Build the src for one page.
 *
 * The signed URL already carries a query string, so the fragment is appended
 * after stripping any fragment the URL arrived with.
 */
function pageSrc(url: string, page: number): string {
  const base = url.split("#")[0];
  return `${base}${pageFragment(page)}`;
}

/**
 * Can this deck be paginated?
 *
 * Only PDFs have pages. A .txt/.md deck renders as one flowing document, and a
 * missing/zero page count means the server could not measure the document — in
 * both cases the honest answer is to show the document as-is rather than draw
 * slide numbers that don't correspond to anything.
 */
export function canPaginateDeck(url: string, pageCount: number): boolean {
  if (!url || !Number.isFinite(pageCount) || pageCount < 1) return false;
  // Signed URLs keep the object path (…/deck.pdf?token=…), local-fallback URLs
  // keep the filename (/api/files/1234_deck.pdf?token=…).
  const path = url.split("#")[0].split("?")[0].toLowerCase();
  if (path.endsWith(".pdf")) return true;
  if (/\.(txt|md|markdown)$/.test(path)) return false;
  // No usable extension (legacy row): trust a real multi-page count.
  return pageCount > 1;
}

/** How long to wait for the buffered page to paint before swapping anyway. */
const SWAP_TIMEOUT_MS = 1200;
/** Wheel events arrive in bursts; one slide per gesture, not per tick. */
const WHEEL_COOLDOWN_MS = 320;

interface SlideDeckViewerProps {
  url: string;
  pageCount: number;
  /** Current slide (1-based). Controlled by the parent so the pitch session can
   *  report it to the server and both viewer positions stay in step. */
  slide: number;
  onSlideChange: (slide: number) => void;
  /** Hide arrows/label for thumbnail-sized instances. */
  showControls?: boolean;
  className?: string;
  /** Screen-share takes over the surface entirely (existing behaviour). */
  isCapturing?: boolean;
  screenRef?: any;
  /** Enables window-level arrow/page keys. Only the main instance sets this. */
  captureKeyboard?: boolean;
}

export const SlideDeckViewer = React.memo(function SlideDeckViewer({
  url,
  pageCount,
  slide,
  onSlideChange,
  showControls = true,
  className = "",
  isCapturing = false,
  screenRef,
  captureKeyboard = false,
}: SlideDeckViewerProps) {
  const paginated = useMemo(() => canPaginateDeck(url, pageCount), [url, pageCount]);
  const total = paginated ? Math.max(1, Math.floor(pageCount)) : 1;
  const current = Math.min(Math.max(1, Math.floor(slide) || 1), total);

  // Double buffer. Each entry is the page a slot is showing; `nonce` forces a
  // fresh iframe (and therefore a real navigation) even when the same page is
  // requested twice.
  const [slots, setSlots] = useState<Array<{ page: number; nonce: number }>>([
    { page: current, nonce: 0 },
    { page: current, nonce: 0 },
  ]);
  const [activeSlot, setActiveSlot] = useState(0);
  /**
   * The second buffer is mounted lazily, on the first navigation.
   *
   * A hidden iframe still loads and still costs a live PDF-viewer instance, and
   * this component is mounted several times per room (main surface, thumbnail,
   * plus the mobile layout, which stays in the DOM behind a `hidden` class).
   * Mounting both buffers up front would double every one of those for a founder
   * who never leaves slide 1. Nothing is lost by waiting: the buffer only earns
   * its keep during a slide change, and that is exactly when it appears.
   */
  const [bufferMounted, setBufferMounted] = useState(false);
  const pendingSlotRef = useRef<number | null>(null);
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nonceRef = useRef(0);

  const clearSwapTimer = () => {
    if (swapTimerRef.current) {
      clearTimeout(swapTimerRef.current);
      swapTimerRef.current = null;
    }
  };

  const commitSwap = useCallback((slotIndex: number) => {
    if (pendingSlotRef.current !== slotIndex) return;
    pendingSlotRef.current = null;
    clearSwapTimer();
    setActiveSlot(slotIndex);
  }, []);

  // Load a requested page into the hidden slot, then swap.
  useEffect(() => {
    if (!paginated || !url) return;
    if (slots[activeSlot].page === current && pendingSlotRef.current === null) {
      return; // already showing it
    }
    const target = activeSlot === 0 ? 1 : 0;
    if (slots[target].page === current && pendingSlotRef.current === target) {
      return; // already loading it
    }

    nonceRef.current += 1;
    const nonce = nonceRef.current;
    setSlots((prev) => {
      const next = [...prev];
      next[target] = { page: current, nonce };
      return next;
    });
    setBufferMounted(true);
    pendingSlotRef.current = target;

    // Some viewers never fire load for a fragment navigation. Swap regardless
    // so a slide change can never leave the founder staring at the old page.
    clearSwapTimer();
    swapTimerRef.current = setTimeout(() => commitSwap(target), SWAP_TIMEOUT_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, paginated, url, activeSlot]);

  // A new URL (re-signed link, different deck) invalidates both buffers.
  useEffect(() => {
    clearSwapTimer();
    pendingSlotRef.current = null;
    nonceRef.current += 1;
    setActiveSlot(0);
    setBufferMounted(false);
    setSlots([
      { page: current, nonce: nonceRef.current },
      { page: current, nonce: nonceRef.current },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => clearSwapTimer, []);

  const go = useCallback(
    (delta: number) => {
      if (!paginated) return;
      const next = Math.min(Math.max(1, current + delta), total);
      if (next !== current) onSlideChange(next);
    },
    [current, total, paginated, onSlideChange],
  );

  // ── Wheel: one slide per gesture ──────────────────────────────────────────
  const lastWheelRef = useRef(0);
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!paginated) return;
      // The overlay exists precisely so this event is ours to handle; stop it
      // reaching any scrollable ancestor.
      e.preventDefault();
      e.stopPropagation();
      const now = Date.now();
      if (now - lastWheelRef.current < WHEEL_COOLDOWN_MS) return;
      const magnitude = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(magnitude) < 4) return;
      lastWheelRef.current = now;
      go(magnitude > 0 ? 1 : -1);
    },
    [go, paginated],
  );

  // ── Keyboard: arrows / page keys / space, main instance only ─────────────
  useEffect(() => {
    if (!captureKeyboard || !paginated) return;

    const onKey = (e: KeyboardEvent) => {
      // Never steal keys from the chat box or any other text entry — the founder
      // types messages to the panel in the same room.
      const el = document.activeElement as HTMLElement | null;
      if (el) {
        const tag = el.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          el.isContentEditable
        ) {
          return;
        }
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          go(1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          go(-1);
          break;
        case "Home":
          e.preventDefault();
          if (current !== 1) onSlideChange(1);
          break;
        case "End":
          e.preventDefault();
          if (current !== total) onSlideChange(total);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [captureKeyboard, paginated, go, current, total, onSlideChange]);

  // ── Screen share takes the whole surface (unchanged behaviour) ────────────
  if (isCapturing) {
    return (
      <video
        ref={screenRef}
        autoPlay
        muted
        playsInline
        className={cn("w-full h-full object-contain bg-black/40", className)}
      />
    );
  }

  if (!url) {
    return (
      <div
        className={cn(
          "w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900",
          className,
        )}
      >
        <MonitorOff
          size={40}
          className="text-slate-400 dark:text-slate-500 opacity-50 mb-2"
        />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 opacity-50">
          No deck selected
        </p>
      </div>
    );
  }

  // Not a paginable document (text deck, or the server has no page count):
  // render it plainly rather than drawing slide numbers that mean nothing.
  if (!paginated) {
    return (
      <div
        className={cn("w-full h-full overflow-auto overscroll-contain", className)}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <iframe
          src={url}
          className="w-full h-full border-none"
          title="Pitch Deck"
          allow="fullscreen"
        />
      </div>
    );
  }

  const atStart = current <= 1;
  const atEnd = current >= total;

  return (
    <div className={cn("w-full h-full relative bg-slate-950", className)}>
      {/* Slide surface. The visible buffer is always mounted; the spare joins it
          on the first navigation and both stay mounted from then on. */}
      {slots.map((slot, index) =>
        index !== activeSlot && !bufferMounted ? null : (
          <iframe
            // A changed key remounts the element, which is what makes the viewer
            // actually navigate to the new page.
            key={`slot-${index}-${slot.page}-${slot.nonce}`}
            src={pageSrc(url, slot.page)}
            title={`Pitch deck slide ${slot.page}`}
            className={cn(
              "absolute inset-0 w-full h-full border-none transition-opacity duration-150",
              index === activeSlot ? "opacity-100" : "opacity-0",
            )}
            // The hidden buffer must not be reachable by tab or pointer.
            tabIndex={index === activeSlot ? 0 : -1}
            aria-hidden={index !== activeSlot}
            onLoad={() => commitSwap(index)}
          />
        ),
      )}

      {/*
        Transparent event layer. It sits over the slide so wheel gestures drive
        slide navigation instead of scrolling the embedded document, and a click
        anywhere focuses this surface rather than the PDF viewer's own UI.
        It carries no visual weight, so it cannot cover slide content.
      */}
      <div
        className="absolute inset-0 z-10"
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
        role="presentation"
      />

      {showControls && (
        <>
          {/*
            Navigation arrows are pinned to the OUTER EDGES of the surface, in the
            letterbox margin that `view=Fit` leaves beside a fitted page, and they
            fade in only when the pointer is near. Slide content is never covered
            by a control that is sitting there permanently.
          */}
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={atStart}
            aria-label="Previous slide"
            className={cn(
              "absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-14 rounded-xl",
              "flex items-center justify-center text-white",
              "bg-black/45 hover:bg-black/70 backdrop-blur-sm border border-white/10",
              "opacity-0 hover:opacity-100 focus-visible:opacity-100 group-hover/deck:opacity-100",
              "transition-opacity duration-150 disabled:opacity-0 disabled:pointer-events-none",
              "cursor-pointer",
            )}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={atEnd}
            aria-label="Next slide"
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-14 rounded-xl",
              "flex items-center justify-center text-white",
              "bg-black/45 hover:bg-black/70 backdrop-blur-sm border border-white/10",
              "opacity-0 hover:opacity-100 focus-visible:opacity-100 group-hover/deck:opacity-100",
              "transition-opacity duration-150 disabled:opacity-0 disabled:pointer-events-none",
              "cursor-pointer",
            )}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
});

/**
 * Slide position + arrows rendered OUTSIDE the slide surface.
 *
 * Requirement: session controls must never sit on top of deck content. The
 * canonical position readout and its arrows therefore live in their own strip
 * below the slide, where they cannot overlap it at any window size.
 */
export const SlideDeckControls = React.memo(function SlideDeckControls({
  slide,
  total,
  onSlideChange,
  className = "",
  compact = false,
}: {
  slide: number;
  total: number;
  onSlideChange: (slide: number) => void;
  className?: string;
  compact?: boolean;
}) {
  const current = Math.min(Math.max(1, Math.floor(slide) || 1), Math.max(1, total));
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 shrink-0 select-none",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSlideChange(Math.max(1, current - 1))}
        disabled={current <= 1}
        aria-label="Previous slide"
        className={cn(
          "rounded-lg flex items-center justify-center transition-colors cursor-pointer",
          "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-200",
          "hover:bg-slate-200 dark:hover:bg-zinc-700",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          compact ? "w-7 h-7" : "w-9 h-9",
        )}
      >
        <ChevronLeft size={compact ? 14 : 18} />
      </button>

      <span
        className={cn(
          "font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 tabular-nums",
          compact ? "text-[9px] px-1" : "text-[11px] px-2",
        )}
        aria-live="polite"
      >
        [ Slide {current} of {Math.max(1, total)} ]
      </span>

      <button
        type="button"
        onClick={() => onSlideChange(Math.min(Math.max(1, total), current + 1))}
        disabled={current >= total}
        aria-label="Next slide"
        className={cn(
          "rounded-lg flex items-center justify-center transition-colors cursor-pointer",
          "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-200",
          "hover:bg-slate-200 dark:hover:bg-zinc-700",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          compact ? "w-7 h-7" : "w-9 h-9",
        )}
      >
        <ChevronRight size={compact ? 14 : 18} />
      </button>
    </div>
  );
});

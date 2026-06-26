import { useEffect, useRef, useState } from "react";

/**
 * Defers rendering its children (a Recharts ResponsiveContainer) until the
 * wrapper has a measured, non-zero size. This prevents the Recharts
 * "The width(-1) and height(-1) of chart should be greater than 0" warning that
 * fires when a chart mounts inside a container that hasn't been laid out yet
 * (e.g. a flex child on first paint, or a not-yet-visible panel).
 *
 * Place inside an element that already has an explicit height; ChartFrame fills
 * it 100% and only mounts the chart once that height is actually measured.
 */
export function ChartFrame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Already laid out? Mount immediately.
    if (el.clientWidth > 0 && el.clientHeight > 0) {
      setReady(true);
      return;
    }
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setReady(true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ width: "100%", height: "100%" }}>
      {ready ? children : null}
    </div>
  );
}

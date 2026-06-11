import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { SectionReveal } from './SectionReveal';

const stats = [
  { value: 3, suffix: '', label: 'Investor personas', accent: 'text-indigo-600 dark:text-indigo-400' },
  { value: 1, suffix: '', label: 'Session to first feedback', prefix: '<', accent: 'text-sky-600 dark:text-sky-400' },
  { value: 0, prefix: '$', suffix: '', label: 'Cost during early access', accent: 'text-emerald-600 dark:text-emerald-400' },
  { value: 100, suffix: '%', label: 'Deck-aware Q&A', accent: 'text-indigo-600 dark:text-indigo-400' },
];

function CountUp({
  value,
  prefix = '',
  suffix = '',
  active,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  active: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const start = performance.now();
    const duration = 1200;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, value]);

  return (
    <span className="tabular-nums">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export function StatsBand() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="pb-16 sm:pb-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <SectionReveal>
          <div
            ref={ref}
            className="card overflow-hidden grid sm:grid-cols-2 lg:grid-cols-4"
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`px-7 py-9 text-center ${i < stats.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-slate-200/80 dark:border-zinc-800' : ''}`}
              >
                <div className={`font-display text-3xl sm:text-4xl font-semibold leading-none tracking-tight ${s.accent}`}>
                  <CountUp value={s.value} prefix={s.prefix ?? ''} suffix={s.suffix} active={inView} />
                </div>
                <div className="mt-2 text-sm font-medium text-slate-500 dark:text-zinc-400">{s.label}</div>
              </div>
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

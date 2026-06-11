import { SectionReveal } from './SectionReveal';

const stages = [
  { name: 'Pre-Seed', color: '#6366F1' },
  { name: 'Seed Round', color: '#0284C7' },
  { name: 'Series A', color: '#4F46E5' },
  { name: 'Y Combinator', color: '#F97316' },
  { name: 'Demo Day', color: '#0D9488' },
  { name: 'Angel Round', color: '#7C3AED' },
  { name: 'Accelerator', color: '#2563EB' },
  { name: 'Series B', color: '#0891B2' },
];

function Chip({ name, color }: { name: string; color: string }) {
  return (
    <div className="flex h-[52px] shrink-0 items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 shadow-sm">
      <span className="whitespace-nowrap text-sm font-semibold tracking-tight" style={{ color }}>
        {name}
      </span>
    </div>
  );
}

function Track({ reverse = false }: { reverse?: boolean }) {
  const items = [...stages, ...stages];
  return (
    <div className={`flex w-max gap-3 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}>
      {items.map((s, i) => (
        <Chip key={`${s.name}-${i}`} name={s.name} color={s.color} />
      ))}
    </div>
  );
}

export function InvestorMarquee() {
  return (
    <section className="overflow-hidden border-y border-slate-200/80 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-900/40 py-10">
      <SectionReveal className="max-w-6xl mx-auto px-5 sm:px-8 mb-7 text-center">
        <p className="section-label">Built for fundraising</p>
        <h2 className="font-display mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
          Practice for the conversations that matter
        </h2>
      </SectionReveal>
      <div className="mask-fade-x mb-3 overflow-hidden">
        <Track />
      </div>
      <div className="mask-fade-x overflow-hidden">
        <Track reverse />
      </div>
    </section>
  );
}

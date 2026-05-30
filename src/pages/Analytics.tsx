import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  ArrowUpRight,
  Sparkles,
  ArrowRight,
  Rocket
} from 'lucide-react';
import { motion } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Progress from '@radix-ui/react-progress';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from '../components/Skeleton';

const StatCard = ({ title, value, subtitle, trend, progress, tooltip, isLoading }: { title: string, value: string, subtitle?: string, trend?: string, progress?: number, tooltip?: string, isLoading?: boolean }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="card p-6 flex flex-col gap-4 relative group dark:bg-zinc-900 dark:border-zinc-800"
  >
    {isLoading ? (
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="w-4 h-4 rounded-full" />
        </div>
        <div className="flex items-baseline gap-2">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    ) : (
      <>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500 dark:text-zinc-500">{title}</span>
            {tooltip && (
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center cursor-help">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">?</span>
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content 
                    className="bg-slate-900 dark:bg-zinc-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl z-50 max-w-xs border border-white/10"
                    sideOffset={5}
                  >
                    {tooltip}
                    <Tooltip.Arrow className="fill-slate-900 dark:fill-zinc-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            )}
          </div>
          {trend && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
              <ArrowUpRight size={12} />
              {trend}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-slate-900 dark:text-zinc-100">{value}</span>
          {subtitle && <span className="text-slate-400 dark:text-zinc-500 font-medium">{subtitle}</span>}
        </div>
        {progress !== undefined && (
          <div className="mt-2">
            <Progress.Root className="relative overflow-hidden bg-slate-100 dark:bg-zinc-800 rounded-full w-full h-2">
              <Progress.Indicator 
                className="bg-sky-500 w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.65, 0, 0.35, 1)]"
                style={{ transform: `translateX(-${100 - progress}%)` }}
              />
            </Progress.Root>
          </div>
        )}
      </>
    )}
  </motion.div>
);

const InsightItem = ({ category, time, content, type, isLoading }: { category?: string, time?: string, content?: string, type?: 'vocal' | 'visual' | 'engagement' | string, isLoading?: boolean }) => {
  const colors: Record<string, string> = {
    vocal: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    visual: "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400",
    engagement: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-4 border-b border-slate-100 dark:border-zinc-800 last:border-0">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-4 border-b border-slate-100 dark:border-zinc-800 last:border-0">
      <div className="flex justify-between items-center">
        <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded", type && colors[type] ? colors[type] : colors.vocal)}>
          {category}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-zinc-500">{time}</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
        {content}
      </p>
    </div>
  );
};

// Helper to compute overall score from evaluation_report
function getOverallScore(report: any): number {
  if (!report || !report.scores) return 0;
  const s = report.scores;
  const total = (Number(s.delivery) || 0) + (Number(s.clarity) || 0) + (Number(s.scalability) || 0) + (Number(s.readiness) || 0);
  return Math.round((total / 40) * 100);
}

function formatDate(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return "Unknown"; }
}

export default function Analytics() {
  const { authFetch } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await authFetch('/api/sessions');
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // Derive analytics from real session data
  const scoredSessions = sessions
    .map(s => ({ ...s, overallScore: getOverallScore(s.evaluation_report) }))
    .filter(s => s.overallScore > 0);

  const avgReadiness = scoredSessions.length > 0
    ? Math.round(scoredSessions.reduce((a, b) => a + b.overallScore, 0) / scoredSessions.length)
    : 0;

  const totalSessions = sessions.length;

  // Chart data from real sessions (most recent 8, reversed to show oldest-to-newest)
  const chartSessions = [...scoredSessions].reverse().slice(-8);
  const displayChartData = chartSessions.map((s, i) => {
    const report = s.evaluation_report || {};
    const scores = report.scores || {};
    return {
      name: s.business_name?.substring(0, 12) || `Pitch ${i + 1}`,
      readiness: s.overallScore,
      confidence: Math.round((Number(scores.delivery) || 0) * 10),
      market: Math.round((Number(scores.scalability) || 0) * 10),
      tech: Math.round((Number(scores.clarity) || 0) * 10),
    };
  });

  // Market and tech score arrays for the bar charts
  const marketScores = chartSessions.map(s => Math.round((Number(s.evaluation_report?.scores?.scalability) || 0) * 10));
  const techScores = chartSessions.map(s => Math.round((Number(s.evaluation_report?.scores?.clarity) || 0) * 10));

  // Most improved metric
  let mostImproved = "N/A";
  if (chartSessions.length >= 2) {
    const first = chartSessions[0].evaluation_report?.scores || {};
    const last = chartSessions[chartSessions.length - 1].evaluation_report?.scores || {};
    const diffs = [
      { name: "Delivery", diff: (Number(last.delivery) || 0) - (Number(first.delivery) || 0) },
      { name: "Clarity", diff: (Number(last.clarity) || 0) - (Number(first.clarity) || 0) },
      { name: "Market Scalability", diff: (Number(last.scalability) || 0) - (Number(first.scalability) || 0) },
      { name: "Readiness", diff: (Number(last.readiness) || 0) - (Number(first.readiness) || 0) },
    ];
    const best = diffs.reduce((a, b) => b.diff > a.diff ? b : a, diffs[0]);
    if (best.diff > 0) mostImproved = best.name;
  }

  // Derive insights from real session reports
  const insights: any[] = [];
  for (const session of sessions.slice(0, 3)) {
    const report = session.evaluation_report;
    if (report?.summary) {
      insights.push({
        category: session === sessions[0] ? "Latest Feedback" : "Past Review",
        time: formatDate(session.created_at),
        content: report.summary,
        type: session === sessions[0] ? "engagement" : "vocal"
      });
    }
  }

  const hasData = scoredSessions.length > 0;

  return (
    <Tooltip.Provider>
      <div className="space-y-8 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-2">Analytics Deep Dive</h1>
            <p className="text-slate-500 dark:text-zinc-500">Comprehensive review of your pitching performance and investor readiness.</p>
          </div>
          
          <Tabs.Root defaultValue="30d" className="flex flex-col">
            <Tabs.List className="flex bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1 rounded-xl shadow-sm transition-colors">
              <Tabs.Trigger value="30d" className="px-4 py-2 text-sm font-bold data-[state=active]:bg-sky-500 data-[state=active]:text-white rounded-lg transition-all cursor-pointer">
                All Time
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard isLoading={isLoading} title="Avg. Investment Readiness" value={hasData ? avgReadiness.toString() : "—"} subtitle={hasData ? "/100" : ""} progress={hasData ? avgReadiness : undefined} trend={hasData && avgReadiness >= 70 ? "Strong" : undefined} tooltip="Based on AI analysis of your historical pitch sessions." />
          <StatCard isLoading={isLoading} title="Total Sessions" value={totalSessions.toString()} subtitle="pitches" tooltip="Total number of recorded pitches sent to the AI panel." />
          <StatCard isLoading={isLoading} title="Most Improved" value={mostImproved} tooltip="The metric that has shown the highest growth trajectory." />
          <StatCard isLoading={isLoading} title="Data Status" value={hasData ? "Live" : "Waiting"} trend={hasData ? "Synced" : undefined} tooltip="This dashboard is pulling processed AI evaluations." />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 card p-8 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Pitch Score Trends</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-500" /><span className="text-xs font-medium text-slate-500 dark:text-zinc-500">Readiness Score</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-400" /><span className="text-xs font-medium text-slate-500 dark:text-zinc-500">Confidence (Delivery)</span></div>
              </div>
            </div>

            <div className="h-[340px] w-full">
              {isLoading ? (
                <div className="w-full h-full flex items-end gap-4 pb-8">
                  {[40, 70, 50, 90, 60, 80, 45, 75].map((h, i) => <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />)}
                </div>
              ) : displayChartData.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-600">
                  <Rocket size={48} className="mb-4 opacity-50" />
                  <p className="text-sm font-medium">Complete pitches to see your score trends</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayChartData}>
                    <defs>
                      <linearGradient id="colorReadiness" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.1}/><stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" className="dark:stroke-zinc-800" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }} dy={10} />
                    <YAxis hide domain={[0, 100]} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="readiness" stroke="#0EA5E9" strokeWidth={3} fillOpacity={1} fill="url(#colorReadiness)" />
                    <Area type="monotone" dataKey="confidence" stroke="#818CF8" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-8 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-6"><Sparkles className="text-purple-500" size={20} /><h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">AI Insights & Trends</h3></div>
            <div className="flex flex-col">
              {isLoading ? (
                <><InsightItem isLoading /><InsightItem isLoading /></>
              ) : insights.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-zinc-600">
                  <Sparkles size={32} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No insights yet. Complete a pitch to get AI feedback.</p>
                </div>
              ) : (
                insights.map((insight: any, i: number) => <InsightItem key={i} {...insight} />)
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-8 dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-6">Market Understanding (Scalability)</h3>
            <div className="flex items-end gap-3 h-40">
              {isLoading ? (
                [40, 60, 30, 80, 50].map((_, i) => <Skeleton key={i} className="flex-1 w-full h-full rounded-t-lg" />)
              ) : marketScores.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">No data yet</div>
              ) : (
                marketScores.map((h: number, i: number) => (
                  <div key={i} className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-t-lg relative group cursor-pointer h-full flex items-end">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.4 + (i * 0.05), duration: 0.8 }} className={cn("w-full rounded-t-lg transition-all duration-300", i === marketScores.length - 1 ? "bg-sky-500" : "bg-slate-200 dark:bg-zinc-700 group-hover:bg-slate-300")} />
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-8 dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-6">Technical Depth (Clarity)</h3>
            <div className="flex items-end gap-3 h-40">
               {isLoading ? (
                [40, 60, 30, 80, 50].map((_, i) => <Skeleton key={i} className="flex-1 w-full h-full rounded-t-lg" />)
              ) : techScores.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">No data yet</div>
              ) : (
                techScores.map((h: number, i: number) => (
                  <div key={i} className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-t-lg relative group cursor-pointer h-full flex items-end">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.5 + (i * 0.05), duration: 0.8 }} className={cn("w-full rounded-t-lg transition-all duration-300", i === techScores.length - 1 ? "bg-indigo-500" : "bg-slate-200 dark:bg-zinc-700 group-hover:bg-slate-300")} />
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Tooltip.Provider>
  );
}
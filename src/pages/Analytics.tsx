import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  ArrowUpRight,
  Sparkles,
  ArrowRight
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

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    chartData: [] as any[],
    displayChartData: [] as any[],
    avgReadiness: 0,
    totalSessions: 0,
    mostImproved: "N/A",
    insights: [] as any[],
    marketScores: [] as number[],
    techScores: [] as number[]
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/sessions?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const chronological = [...data].reverse();

          // 🔥 FIX 1: Filter out 0-score / failed pitches so they don't break the charts
          const validSessions = chronological.filter(session => {
            const scores = session.evaluation_report?.scores;
            if (!scores) return false;
            return Object.values(scores).some(v => Number(v) > 0);
          });

          const chartData = validSessions.map((session, index) => {
            const scores = session.evaluation_report?.scores || {};
            return {
              name: `Pitch ${index + 1}`,
              readiness: scores.readiness ? Number(scores.readiness) * 10 : 0, 
              confidence: scores.delivery ? Number(scores.delivery) * 10 : 0,
              market: scores.scalability ? Number(scores.scalability) * 10 : 0,
              tech: scores.clarity ? Number(scores.clarity) * 10 : 0
            };
          });

          // 🔥 FIX 2: If only 1 valid pitch exists, Recharts AreaChart won't draw a line. We duplicate it to create a baseline.
          const displayChartData = chartData.length === 1 
            ? [{ ...chartData[0], name: "Baseline" }, { ...chartData[0], name: "Current" }] 
            : chartData;

          const avgReadiness = chartData.length > 0 
            ? Math.round(chartData.reduce((acc, curr) => acc + curr.readiness, 0) / chartData.length)
            : 0;

          let mostImproved = "N/A";
          if (chartData.length >= 2) {
            const first = chartData[0];
            const last = chartData[chartData.length - 1];
            const improvements = {
              "Delivery": last.confidence - first.confidence,
              "Scalability": last.market - first.market,
              "Clarity": last.tech - first.tech
            };
            const best = Object.entries(improvements).reduce((a, b) => a[1] > b[1] ? a : b);
            mostImproved = best[1] > 0 ? best[0] : "Steady";
          } else if (chartData.length === 1) {
            mostImproved = "Baseline Set";
          }

          const insights = validSessions.slice(-3).reverse().map((session, i) => ({
            category: i === 0 ? "Latest Feedback" : "Past Review",
            time: new Date(session.timestamp).toLocaleDateString(),
            content: session.summary || "No summary recorded.",
            type: i === 0 ? "engagement" : i === 1 ? "vocal" : "visual"
          }));

          setAnalyticsData({
            chartData,
            displayChartData,
            avgReadiness,
            totalSessions: data.length, // Still count all sessions, even failed ones
            mostImproved,
            insights,
            marketScores: chartData.map(d => d.market),
            techScores: chartData.map(d => d.tech)
          });
        } else {
          setAnalyticsData(prev => ({ ...prev, totalSessions: 0, mostImproved: "No Data", avgReadiness: 0 }));
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

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
          <StatCard isLoading={isLoading} title="Avg. Investment Readiness" value={analyticsData.avgReadiness.toString()} subtitle="/100" progress={analyticsData.avgReadiness} tooltip="Based on AI analysis of your historical pitch sessions." />
          <StatCard isLoading={isLoading} title="Total Sessions" value={analyticsData.totalSessions.toString()} subtitle="pitches" tooltip="Total number of recorded pitches sent to the AI panel." />
          <StatCard isLoading={isLoading} title="Most Improved" value={analyticsData.mostImproved} tooltip="The metric that has shown the highest growth trajectory." />
          <StatCard isLoading={isLoading} title="Data Status" value="Live" trend="Synced" tooltip="This dashboard is currently pulling live data from your SQLite backend." />
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
              ) : analyticsData.displayChartData.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400">
                   <BarChart3 size={48} className="mb-4 opacity-20" />
                   <p className="font-medium">No valid pitch history to graph.</p>
                   {/* 🔥 FIX 3: Added actionable empty-state link */}
                   <Link to="/setup" className="mt-4 flex items-center gap-2 px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-all">
                     Start Your First Pitch <ArrowRight size={16} />
                   </Link>
                 </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.displayChartData}>
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
              ) : analyticsData.insights.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <p className="text-sm text-slate-500">Complete a pitch to generate AI insights.</p>
                  <Link to="/setup" className="inline-block px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-slate-200 transition-colors">Go to Setup</Link>
                </div>
              ) : (
                analyticsData.insights.map((insight, i) => <InsightItem key={i} {...insight} />)
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-8 dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-6">Market Understanding (Scalability)</h3>
            <div className="flex items-end gap-3 h-40">
              {isLoading ? (
                [40, 60, 30].map((_, i) => <Skeleton key={i} className="flex-1 w-full h-full rounded-t-lg" />)
              ) : analyticsData.marketScores.length === 0 ? (
                 <div className="text-slate-500 w-full text-center mt-10 text-sm">No data available</div>
              ) : (
                analyticsData.marketScores.slice(-6).map((h, i) => (
                  <div key={i} className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-t-lg relative group cursor-pointer h-full flex items-end">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.4 + (i * 0.05), duration: 0.8 }} className={cn("w-full rounded-t-lg transition-all duration-300", i === analyticsData.marketScores.slice(-6).length - 1 ? "bg-sky-500" : "bg-slate-200 dark:bg-zinc-700 group-hover:bg-slate-300")} />
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-8 dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-6">Technical Depth (Clarity)</h3>
            <div className="flex items-end gap-3 h-40">
               {isLoading ? (
                [40, 60, 30].map((_, i) => <Skeleton key={i} className="flex-1 w-full h-full rounded-t-lg" />)
              ) : analyticsData.techScores.length === 0 ? (
                 <div className="text-slate-500 w-full text-center mt-10 text-sm">No data available</div>
              ) : (
                analyticsData.techScores.slice(-6).map((h, i) => (
                  <div key={i} className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-t-lg relative group cursor-pointer h-full flex items-end">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.5 + (i * 0.05), duration: 0.8 }} className={cn("w-full rounded-t-lg transition-all duration-300", i === analyticsData.techScores.slice(-6).length - 1 ? "bg-indigo-500" : "bg-slate-200 dark:bg-zinc-700 group-hover:bg-slate-300")} />
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
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Play, BarChart3, Target, Sparkles, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/Skeleton';

// --- Components ---
const RecentPitchItem = ({ id, name, date, score, status }: { id: number, name: string, date: string, score: number, status: string }) => {
  const isIncomplete = score === 0;

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl hover:border-sky-200 dark:hover:border-sky-500/50 hover:shadow-md transition-all group">
      <div className="flex items-center gap-4">
        <Link to={`/report?session=${id}`} className="w-12 h-12 bg-slate-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-zinc-500 group-hover:bg-sky-50 dark:group-hover:bg-sky-900/20 group-hover:text-sky-500 transition-colors">
          <Play size={20} fill="currentColor" />
        </Link>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{name}</p>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">{date}</p>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end w-24">
          {isIncomplete ? (
            <div className="flex items-center gap-1.5 text-slate-400">
              <AlertCircle size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">N/A</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-16 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className={cn(
                  "h-full transition-all duration-1000",
                  score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-sky-500" : "bg-amber-500"
                )} style={{ width: `${score}%` }} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{score}</span>
            </div>
          )}
        </div>
        <div className="w-32">
          <span className={cn(
            "text-[10px] font-bold px-3 py-1 rounded-full",
            status === "Investor Ready" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : 
            status === "Good Progress" ? "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400" :
            status === "Incomplete" ? "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400" :
            "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
          )}>
            {status}
          </span>
        </div>
        <Link to={`/report?session=${id}`} className="p-2 text-slate-300 dark:text-zinc-600 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
          <Play size={18} />
        </Link>
      </div>
    </div>
  );
};

const InsightCard = ({ title, content, icon: Icon, color, darkColor }: { title: string, content: string, icon: any, color: string, darkColor: string }) => (
  <div className={cn("p-6 rounded-2xl border-l-4 transition-colors", color, darkColor)}>
    <div className="flex items-center gap-2 mb-3">
      <Icon size={18} className="dark:text-zinc-400" />
      <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{title}</h4>
    </div>
    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
      "{content}"
    </p>
  </div>
);

// 🔥 BEAUTIFUL HARDCODED DEMO DATA
const MOCK_SESSIONS = [
  { id: 101, name: "Seed Round - Y Combinator", date: "Mar 15, 2026", score: 92, status: "Investor Ready" },
  { id: 102, name: "Angel Investor Pitch", date: "Mar 12, 2026", score: 85, status: "Investor Ready" },
  { id: 103, name: "PitchNest App Demo", date: "Mar 10, 2026", score: 78, status: "Good Progress" },
  { id: 104, name: "Techstars Application", date: "Mar 05, 2026", score: 88, status: "Investor Ready" }
];

const MOCK_STATS = {
  avgScore: 88,
  totalPitches: 14,
  bestScore: 92
};

const MOCK_INSIGHTS = [
  {
    title: "Latest AI Feedback",
    content: "Your explanation of Customer Acquisition Cost (CAC) was much sharper. The panel responded well to the clear unit economics.",
    icon: Sparkles,
    color: "border-sky-500 bg-sky-50/30",
    darkColor: "dark:border-sky-500 dark:bg-sky-500/5"
  },
  {
    title: "Previous Session Notes",
    content: "Delivery pace improved significantly. You eliminated 80% of filler words compared to your baseline pitch.",
    icon: Target,
    color: "border-indigo-500 bg-indigo-50/30",
    darkColor: "dark:border-indigo-500 dark:bg-indigo-500/5"
  }
];

// --- Main Dashboard Component ---
export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fake loading state for visual polish during the demo
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 pb-20">
      {/* Welcome Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-600 to-sky-500 rounded-[32px] p-10 text-white relative overflow-hidden shadow-xl shadow-sky-500/20"
      >
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl font-bold mb-4 flex items-center gap-3">
            Welcome back, Founder! 🚀
          </h2>
          <p className="text-white/80 text-lg mb-8 leading-relaxed">
            You've completed {MOCK_STATS.totalPitches} pitches. Ready to refine your next big idea with our AI panel?
          </p>
          <Link to="/setup" className="px-8 py-3.5 bg-white text-sky-600 font-bold rounded-xl shadow-xl hover:bg-sky-50 transition-all inline-flex items-center gap-2">
            <Rocket size={18} fill="currentColor" />
            Start New Pitch
          </Link>
        </div>
        <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
          <Rocket size={240} fill="currentColor" />
        </div>
      </motion.div>

      {/* Dynamic Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Average Pitch Score", value: MOCK_STATS.avgScore.toString(), suffix: "/100", trend: "+12%", icon: BarChart3, color: "text-sky-500" },
          { label: "Total Pitches", value: MOCK_STATS.totalPitches, suffix: "Sessions", trend: "", icon: Target, color: "text-indigo-500" },
          { label: "Best Score", value: MOCK_STATS.bestScore.toString(), suffix: "/100", trend: "", icon: CheckCircle2, color: "text-emerald-500" },
          { label: "AI Improvements", value: "Ready", suffix: "Pending Action", trend: "", icon: Sparkles, color: "text-amber-500" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors"
          >
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="w-5 h-5 rounded" />
                </div>
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                  <stat.icon className={stat.color} size={20} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-zinc-100">{stat.value}</span>
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">{stat.suffix}</span>
                  {stat.trend && <span className="text-[10px] font-bold text-emerald-500 ml-auto">{stat.trend}</span>}
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Pitches List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Recent Pitches</h3>
            <Link to="/archive" className="text-sm font-bold text-sky-500 hover:text-sky-600 flex items-center gap-1">
              View All
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </>
            ) : (
              MOCK_SESSIONS.map((session) => (
                <RecentPitchItem 
                  key={session.id}
                  id={session.id}
                  name={session.name} 
                  date={session.date} 
                  score={session.score} 
                  status={session.status} 
                />
              ))
            )}
          </div>
        </div>

        {/* Dynamic AI Insights */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="text-sky-500" size={20} />
            <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100">AI Insights</h3>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </>
            ) : (
              <>
                {MOCK_INSIGHTS.map((insight, i) => (
                  <InsightCard 
                    key={i}
                    title={insight.title}
                    content={insight.content}
                    icon={insight.icon}
                    color={insight.color}
                    darkColor={insight.darkColor}
                  />
                ))}
              </>
            )}
            
            <Link to="/analytics" className="w-full py-4 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 font-bold rounded-2xl flex items-center justify-between px-6 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors group">
              <span className="flex items-center gap-2">
                <BarChart3 size={16} />
                Unlock deep analytics
              </span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
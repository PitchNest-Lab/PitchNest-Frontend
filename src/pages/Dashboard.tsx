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
        <div className="w-12 h-12 bg-slate-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-zinc-500 group-hover:bg-sky-50 dark:group-hover:bg-sky-900/20 group-hover:text-sky-500 transition-colors">
          <Play size={20} fill="currentColor" />
        </div>
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
        <Link to={`/replay?session=${id}`} className="p-2 text-slate-300 dark:text-zinc-600 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
          <Play size={18} />
        </Link>
      </div>
    </div>
  );
};

const RecentPitchSkeleton = () => (
  <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl">
    <div className="flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <div className="flex items-center gap-8">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-32 rounded-full" />
      <Skeleton className="w-8 h-8 rounded-full" />
    </div>
  </div>
);

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

const InsightSkeleton = () => (
  <div className="p-6 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-3 bg-white dark:bg-zinc-900">
    <div className="flex items-center gap-2">
      <Skeleton className="w-5 h-5 rounded" />
      <Skeleton className="h-4 w-24" />
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

// --- Main Dashboard Component ---
export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    avgScore: 0,
    totalPitches: 0,
    bestScore: 0
  });

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`/api/sessions?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          setSessions(data);
          
          // 🔥 FIX 1: Filter out 0 scores so average isn't dragged down by incomplete pitches
          const validScores = data
            .map((s: any) => {
              const r = s.evaluation_report?.scores || {};
              const d = Number(r.delivery) || 0;
              const c = Number(r.clarity) || 0;
              const sc = Number(r.scalability) || 0;
              const read = Number(r.readiness) || 0;
              return Math.round(((d + c + sc + read) / 40) * 100);
            })
            .filter((score: number) => score > 0);

          setStats({
            totalPitches: data.length,
            avgScore: validScores.length > 0 ? Math.round(validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length) : 0,
            bestScore: validScores.length > 0 ? Math.max(...validScores) : 0
          });
        }
      } catch (error) {
        console.error("Failed to load real data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
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
            {stats.totalPitches > 0 
              ? `You've completed ${stats.totalPitches} pitches. Ready to refine your next big idea with our AI panel?`
              : "Welcome to PitchNest! Ready to face the AI panel for your very first pitch?"}
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
          { label: "Average Pitch Score", value: stats.avgScore || "0", suffix: "/100", trend: "", icon: BarChart3, color: "text-sky-500" },
          { label: "Total Pitches", value: stats.totalPitches, suffix: "Sessions", trend: "", icon: Target, color: "text-indigo-500" },
          { label: "Best Score", value: stats.bestScore || "0", suffix: "/100", trend: "", icon: CheckCircle2, color: "text-emerald-500" },
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
                <RecentPitchSkeleton />
                <RecentPitchSkeleton />
              </>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                <p className="text-slate-500 dark:text-zinc-400">No pitches recorded yet. Start your first session!</p>
              </div>
            ) : (
              sessions.slice(0, 4).map((session) => {
                const r = session.evaluation_report?.scores || {};
                const finalScore = Math.round(((
                  (Number(r.delivery) || 0) + 
                  (Number(r.clarity) || 0) + 
                  (Number(r.scalability) || 0) + 
                  (Number(r.readiness) || 0)
                ) / 40) * 100);
                
                // 🔥 FIX 2: Safely handles 0 scores
                let statusBadge = "Needs Polish";
                if (finalScore === 0) statusBadge = "Incomplete";
                else if (finalScore >= 80) statusBadge = "Investor Ready";
                else if (finalScore >= 60) statusBadge = "Good Progress";

                const displayName = session.business_name || `Pitch Session #${session.id}`;

                return (
                  <RecentPitchItem 
                    key={session.id}
                    id={session.id}
                    name={displayName} 
                    date={new Date(session.timestamp).toLocaleString()} 
                    score={finalScore} 
                    status={statusBadge} 
                  />
                );
              })
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
                <InsightSkeleton />
                <InsightSkeleton />
              </>
            ) : sessions.length === 0 ? (
               <p className="text-sm text-slate-500">Complete a pitch to unlock AI insights.</p>
            ) : (
              <>
                <InsightCard 
                  title="Latest AI Feedback"
                  content={sessions[0]?.summary || "No summary available for the last pitch."}
                  icon={Sparkles}
                  color="border-sky-500 bg-sky-50/30"
                  darkColor="dark:border-sky-500 dark:bg-sky-500/5"
                />
                {sessions[1] && (
                  <InsightCard 
                    title="Previous Session Notes"
                    content={sessions[1]?.summary || "Keep practicing to build more history!"}
                    icon={Target}
                    color="border-indigo-500 bg-indigo-50/30"
                    darkColor="dark:border-indigo-500 dark:bg-indigo-500/5"
                  />
                )}
              </>
            )}
            
            {/* 🔥 FIX 3: Replaced dead <button> with a functional React Router <Link> */}
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
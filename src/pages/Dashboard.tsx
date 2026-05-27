import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Play, BarChart3, Target, Sparkles, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/Skeleton';
import { useAuth } from '../contexts/AuthContext';

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

// Helper to compute session status from score
function getStatus(score: number): string {
  if (score === 0) return "Incomplete";
  if (score >= 80) return "Investor Ready";
  if (score >= 60) return "Good Progress";
  return "Needs Work";
}

// Helper to compute overall score from evaluation_report
function getOverallScore(report: any): number {
  if (!report || !report.scores) return 0;
  const s = report.scores;
  const total = (Number(s.delivery) || 0) + (Number(s.clarity) || 0) + (Number(s.scalability) || 0) + (Number(s.readiness) || 0);
  return Math.round((total / 40) * 100);
}

// Helper to format date
function formatDate(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return "Unknown"; }
}

// --- Main Dashboard Component ---
export default function Dashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch('/api/sessions');
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

  // Compute stats from real data
  const recentSessions = sessions.slice(0, 4);
  const sessionScores = sessions.map(s => getOverallScore(s.evaluation_report)).filter(s => s > 0);
  const avgScore = sessionScores.length > 0 ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length) : 0;
  const bestScore = sessionScores.length > 0 ? Math.max(...sessionScores) : 0;
  const totalPitches = sessions.length;

  // Derive insights from the latest session's evaluation report
  const latestSession = sessions[0];
  const latestReport = latestSession?.evaluation_report;
  const insights = [];
  if (latestReport?.summary) {
    insights.push({
      title: "Latest AI Feedback",
      content: latestReport.summary,
      icon: Sparkles,
      color: "border-sky-500 bg-sky-50/30",
      darkColor: "dark:border-sky-500 dark:bg-sky-500/5"
    });
  }
  if (latestReport?.strengths?.[0]) {
    insights.push({
      title: "Key Strength",
      content: latestReport.strengths[0],
      icon: Target,
      color: "border-indigo-500 bg-indigo-50/30",
      darkColor: "dark:border-indigo-500 dark:bg-indigo-500/5"
    });
  }

  const userName = user?.name || "Founder";

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
            Welcome back, {userName}! 🚀
          </h2>
          <p className="text-white/80 text-lg mb-8 leading-relaxed">
            {totalPitches > 0 
              ? `You've completed ${totalPitches} pitch${totalPitches !== 1 ? 'es' : ''}. Ready to refine your next big idea with our AI panel?`
              : "Ready to practice your first pitch with our AI investor panel?"
            }
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
          { label: "Average Pitch Score", value: totalPitches > 0 ? avgScore.toString() : "—", suffix: totalPitches > 0 ? "/100" : "", trend: "", icon: BarChart3, color: "text-sky-500" },
          { label: "Total Pitches", value: totalPitches.toString(), suffix: "Sessions", trend: "", icon: Target, color: "text-indigo-500" },
          { label: "Best Score", value: totalPitches > 0 ? bestScore.toString() : "—", suffix: totalPitches > 0 ? "/100" : "", trend: "", icon: CheckCircle2, color: "text-emerald-500" },
          { label: "AI Improvements", value: totalPitches > 0 ? "Ready" : "Start", suffix: totalPitches > 0 ? "Pending Action" : "Your first pitch", trend: "", icon: Sparkles, color: "text-amber-500" }
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
            ) : recentSessions.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                <Rocket size={48} className="mx-auto text-slate-300 dark:text-zinc-700 mb-4" />
                <p className="text-slate-500 dark:text-zinc-500 font-medium mb-4">No pitches yet. Start your first session!</p>
                <Link to="/setup" className="px-6 py-2.5 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-all inline-flex items-center gap-2 text-sm">
                  <Rocket size={16} fill="currentColor" />
                  Start Pitching
                </Link>
              </div>
            ) : (
              recentSessions.map((session: any) => {
                const score = getOverallScore(session.evaluation_report);
                return (
                  <RecentPitchItem 
                    key={session.id}
                    id={session.id}
                    name={session.business_name || "Untitled Pitch"} 
                    date={formatDate(session.timestamp)} 
                    score={score} 
                    status={getStatus(score)} 
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
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </>
            ) : insights.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                <Sparkles size={32} className="mx-auto text-slate-300 dark:text-zinc-700 mb-3" />
                <p className="text-slate-500 dark:text-zinc-500 text-sm font-medium">Complete your first pitch to see AI insights here.</p>
              </div>
            ) : (
              <>
                {insights.map((insight, i) => (
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
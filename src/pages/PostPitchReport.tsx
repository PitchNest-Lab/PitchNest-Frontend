import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Share2, FileDown, Calendar, Users, Target, Activity, 
  CheckCircle2, AlertTriangle, Play, Zap, Star, TrendingUp, ShieldAlert
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/Skeleton';

export default function PostPitchReport() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const sessionId = searchParams.get('session');
        
        const response = await fetch(`/api/sessions?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const specificSession = sessionId ? data.find((s: any) => s.id.toString() === sessionId) : data[0];
          setSession(specificSession || data[0]);
        }
      } catch (err) {} finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, [location.search]);

  const report = session?.evaluation_report || {};
  const rawScores = report.scores || {};
  
  const isInsufficientData = !rawScores || Object.keys(rawScores).length === 0 || Object.values(rawScores).every(v => v === 0);
  
  const scores = {
    delivery: Number(rawScores.delivery) || 0,
    clarity: Number(rawScores.clarity) || 0,
    scalability: Number(rawScores.scalability) || 0,
    readiness: Number(rawScores.readiness) || 0,
  };
  
  const overallScore = isInsufficientData ? 0 : Math.round(((scores.delivery + scores.clarity + scores.scalability + scores.readiness) / 40) * 100);

  // 🔥 FIX: Truly dynamic engagement metrics based on AI output
  const strengths = Array.isArray(report.strengths) ? report.strengths : [];
  const risks = Array.isArray(report.risks) ? report.risks : [];
  const nextSteps = Array.isArray(report.next_steps) ? report.next_steps : [];
  const sentiments = Array.isArray(report.sentiments) ? report.sentiments : [];

  const dynamicQuestionsAsked = isInsufficientData ? 0 : Math.max(1, risks.length + nextSteps.length + 2);
  const dynamicConfidenceScore = isInsufficientData ? 0 : Math.min(100, Math.round((scores.readiness / 10) * 100));
  const dynamicTrend = isInsufficientData ? "N/A" : (scores.delivery >= 7 ? `+${(scores.delivery * 1.5).toFixed(0)}%` : `-${(10 - scores.delivery).toFixed(0)}%`);

  const RADAR_DATA = [
    { subject: 'MARKET FIT', A: scores.scalability * 10, fullMark: 100 },
    { subject: 'TECH MOAT', A: scores.clarity * 10, fullMark: 100 },
    { subject: 'FINANCIALS', A: scores.readiness * 10, fullMark: 100 },
    { subject: 'TEAM', A: scores.delivery * 10, fullMark: 100 },
  ];

  const circumference = 2 * Math.PI * 40; 
  const strokeDashoffset = circumference * (1 - overallScore / 100);
  const formattedDate = session?.timestamp ? new Date(session.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date';
  const businessName = session?.business_name || "My Startup";

  if (isLoading) return <div className="p-20 text-center"><Skeleton className="w-full h-96 rounded-3xl" /></div>;
  if (!session) return <div className="p-20 text-center">No pitch data found.</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 font-sans text-slate-900 dark:text-zinc-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-500 font-bold text-[10px] uppercase tracking-widest mb-2">
            <Activity size={14} /> Post-Pitch Report
          </div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">{businessName}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><Calendar size={16} /> Pitch Date: {formattedDate}</span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            <span className={cn("px-3 py-0.5 rounded-full text-xs font-bold", isInsufficientData ? "bg-slate-100 text-slate-500" : overallScore >= 80 ? "bg-emerald-100 text-emerald-700" : overallScore >= 60 ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700")}>
              Verdict: {isInsufficientData ? 'Incomplete' : overallScore >= 80 ? 'Strong Buy' : overallScore >= 60 ? 'Consideration' : 'Pass'}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm">
            <Share2 size={16} /> Share
          </button>
          <button className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm">
            <FileDown size={16} /> PDF
          </button>
          <Link to="/setup" className="px-6 py-2.5 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-all flex items-center gap-2 text-sm shadow-md">
            <Calendar size={16} /> Start New Session
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 space-y-4">
              <div className="relative w-28 h-28 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F5F9" strokeWidth="6" className="dark:stroke-zinc-800" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke={isInsufficientData ? "#94A3B8" : "#0EA5E9"} strokeWidth="6" strokeDasharray="251.2" strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold">{overallScore}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">/100</span>
                </div>
              </div>
              <h2 className="text-xl font-extrabold">Overall Pitch Score</h2>
              <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed max-w-sm">
                {report.summary || "Pitch was too short. AI could not generate a full report."}
              </p>
            </div>
            <div className="w-full md:w-64 h-64 shrink-0 flex items-center justify-center">
              {isInsufficientData ? (
                <div className="text-center text-slate-400 opacity-50">
                  <ShieldAlert size={48} className="mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Insufficient Data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={RADAR_DATA}>
                    <PolarGrid stroke="#E2E8F0" className="dark:stroke-zinc-800" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }} />
                    <Radar dataKey="A" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-extrabold flex items-center gap-2 mb-4"><Users className="text-indigo-500" size={20} /> Investor Sentiment</h3>
            {isInsufficientData ? (
               <div className="w-full p-8 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-center text-slate-500 text-sm font-medium">
                 Your pitch was too short to generate investor sentiment. Please speak for at least 2 minutes.
               </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {sentiments.slice(0, 3).map((sent: any, idx: number) => (
                  <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center"><Target size={16} /></div>
                      <div>
                        <p className="text-sm font-bold">{sent.persona}</p>
                        <p className="text-[10px] text-slate-500">AI Panelist</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed italic">"{sent.quote}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6">
              <h3 className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-2 mb-4"><TrendingUp size={18} /> Key Strengths</h3>
              {isInsufficientData ? (
                 <p className="text-sm text-slate-500 italic">Not enough data.</p>
              ) : (
                <ul className="space-y-4">
                  {strengths.map((str: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-zinc-300"><CheckCircle2 className="text-emerald-500 shrink-0" size={18} /> {str}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-6">
              <h3 className="text-rose-700 dark:text-rose-400 font-extrabold flex items-center gap-2 mb-4"><AlertTriangle size={18} /> Critical Risks</h3>
              {isInsufficientData ? (
                 <p className="text-sm text-slate-500 italic">Not enough data.</p>
              ) : (
                <ul className="space-y-4">
                  {risks.map((risk: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-zinc-300"><AlertTriangle className="text-rose-500 shrink-0" size={18} /> {risk}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-extrabold flex items-center gap-2 mb-6"><CheckCircle2 className="text-sky-500" size={20} /> Actionable Next Steps</h3>
            {isInsufficientData ? (
               <div className="w-full p-8 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-center text-slate-500 text-sm font-medium">
                 Complete a full pitch session to receive your personalized action plan.
               </div>
            ) : (
              <div className="space-y-4">
                {nextSteps.map((step: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-4 border border-slate-100 dark:border-zinc-800 rounded-2xl hover:border-sky-200 transition-colors">
                    <div className={cn("w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 border-slate-300 dark:border-zinc-600")}></div>
                    <div className="flex-1">
                      <p className={"text-sm font-bold text-slate-900 dark:text-zinc-100"}>{step.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
                    </div>
                    <span className={cn("text-[9px] font-bold px-2 py-1 rounded", step.priority?.toLowerCase().includes('high') ? "text-rose-600 bg-rose-100" : "text-amber-600 bg-amber-100")}>
                      {step.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold flex items-center gap-2 mb-4"><Play className="text-slate-900 dark:text-white" size={16} /> Pitch Replay</h3>
            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative mb-4">
              {session?.video_url ? (
                <video src={session.video_url} className="w-full h-full object-cover" controls />
              ) : (
                <>
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800"><div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"><Play fill="white" size={24} className="text-white ml-1" /></div></div>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">Watch your presentation with real-time AI heatmaps of investor engagement.</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold flex items-center gap-2 mb-6"><Zap className="text-slate-900 dark:text-white" size={16} /> AI Engagement</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <span className="text-sm text-slate-600 dark:text-zinc-400">Questions Asked</span>
                <span className="text-sm font-extrabold">{dynamicQuestionsAsked}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <span className="text-sm text-slate-600 dark:text-zinc-400">Confidence Score</span>
                <span className="text-sm font-extrabold text-sky-500">{dynamicConfidenceScore}%</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-sm text-slate-600 dark:text-zinc-400">Sentiment Trend</span>
                <span className={cn("text-sm font-extrabold", dynamicTrend.startsWith('+') ? "text-emerald-500" : dynamicTrend === "N/A" ? "text-slate-500" : "text-rose-500")}>{dynamicTrend}</span>
              </div>
            </div>
          </div>

          <div className={cn("bg-gradient-to-br rounded-3xl p-6 text-white shadow-lg relative overflow-hidden", isInsufficientData ? "from-slate-500 to-slate-700" : "from-indigo-500 to-sky-500")}>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-4 absolute right-0 top-0">
                <Star size={20} fill="currentColor" />
              </div>
              <h3 className="text-lg font-extrabold mb-2 pr-10">{isInsufficientData ? "Keep Practicing" : "Ready for Series A?"}</h3>
              <p className="text-xs text-white/90 leading-relaxed mb-6">
                {isInsufficientData ? "Complete a full 15-minute pitch to unlock premium VC insights." : "Your scores qualify you for PitchNest Prime. Get direct intros to tier-1 VCs."}
              </p>
              <button disabled={isInsufficientData} className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                Unlock Premium Insights
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
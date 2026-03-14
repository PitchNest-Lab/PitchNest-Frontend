import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Play, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Maximize2, 
  Settings, 
  Download, 
  Share2, 
  ChevronLeft, 
  MessageSquare, 
  Sparkles,
  Target,
  Clock,
  Search,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

const TimelineEvent = ({ type, time, content, active = false }: { type: string, time: string, content: string, active?: boolean }) => (
  <div className={cn(
    "relative pl-8 pb-8 last:pb-0 border-l-2 transition-all",
    active ? "border-sky-500" : "border-slate-100 dark:border-zinc-800"
  )}>
    <div className={cn(
      "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-white dark:bg-zinc-900 transition-all",
      active ? "border-sky-500 scale-110" : "border-slate-200 dark:border-zinc-700"
    )} />
    <div className="flex justify-between items-start mb-2">
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded",
        type.includes('INVESTOR') ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" : 
        type.includes('RESPONSE') ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400"
      )}>
        {type}
      </span>
      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">{time}</span>
    </div>
    <p className={cn(
      "text-sm leading-relaxed",
      active ? "text-slate-900 dark:text-zinc-100 font-medium" : "text-slate-500 dark:text-zinc-400"
    )}>
      {content}
    </p>
  </div>
);

export default function PitchReplayScreen() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const sessionId = searchParams.get('session');

        // 🔥 FIX: The Cache-Buster! Adding ?t=Date.now() forces the browser to bypass its cache and get fresh DB data.
        const response = await fetch(`/api/sessions?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (sessionId) {
            const specificSession = data.find((s: any) => s.id.toString() === sessionId);
            setSession(specificSession || data[0]);
          } else {
            setSession(data[0]); 
          }
        } else {
          setSession(null);
        }
      } catch (err) {
        console.error("Error fetching replay data:", err);
        setError("Could not connect to the backend database.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [location.search]);

  const rawScores = session?.evaluation_report?.scores || {};
  const scores = {
    delivery: Number(rawScores.delivery) || 0,
    clarity: Number(rawScores.clarity) || 0,
    scalability: Number(rawScores.scalability) || 0,
    readiness: Number(rawScores.readiness) || 0,
  };
  const overallScore = session && Object.keys(rawScores).length > 0
    ? Math.round(((scores.delivery + scores.clarity + scores.scalability + scores.readiness) / 40) * 100) 
    : 0;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <h2 className="text-xl font-bold mb-2">Oops! Something went wrong.</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/archive" className="p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
            <Link to="/archive" className="hover:text-slate-600 dark:hover:text-zinc-300">My Pitches</Link>
            <ChevronLeft size={12} className="rotate-180" />
            <span className="text-slate-900 dark:text-zinc-100">
              {isLoading 
                ? "Loading..." 
                : session 
                  ? (session.business_name ? `${session.business_name} Replay` : `Replay Session #${session.id}`)
                  : "No Session Found"}
            </span>
          </div>
        </div>
  
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2">
            <Download size={18} />
            Download Transcript
          </button>
          <button className="px-6 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2">
            <Share2 size={18} />
            Share
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-slate-900 dark:bg-zinc-900 rounded-[40px] relative overflow-hidden shadow-2xl group flex items-center justify-center">
            {isLoading ? (
              <div className="w-full h-full bg-slate-800 dark:bg-zinc-800 animate-pulse" />
            ) : session?.video_url ? (
              <video 
                key={session.video_url} 
                src={session.video_url} 
                controls 
                autoPlay
                className="w-full h-full object-cover bg-black"
              />
            ) : (
              <>
                <img 
                  src="https://picsum.photos/seed/replay_video/1200/800" 
                  className="w-full h-full object-cover opacity-30 grayscale"
                  referrerPolicy="no-referrer"
                  alt="Placeholder"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
                  <Play size={48} className="opacity-50" />
                  <p className="font-medium tracking-wide">No video recording available for this session.</p>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-4 gap-6">
            {[
              { label: "Overall Score", value: isLoading ? "..." : `${overallScore}%`, icon: Target, color: "text-sky-500" },
              { label: "Delivery", value: isLoading ? "..." : `${scores.delivery}/10`, icon: Sparkles, color: "text-indigo-500" },
              { label: "Clarity", value: isLoading ? "..." : `${scores.clarity}/10`, icon: MessageSquare, color: "text-purple-500" },
              { label: "Scalability", value: isLoading ? "..." : `${scores.scalability}/10`, icon: Clock, color: "text-amber-500" }
            ].map((stat, i) => (
              <div key={i} className="card p-6 flex flex-col gap-2 dark:bg-zinc-900 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                <div className="flex items-center gap-2">
                  <stat.icon className={stat.color} size={16} />
                  <span className="text-xl font-bold text-slate-900 dark:text-zinc-100">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card flex flex-col overflow-hidden dark:bg-zinc-900 dark:border-zinc-800 opacity-70">
          <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="text-sky-500" size={20} />
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Transcript</h3>
            </div>
            <span className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-500 text-[10px] font-bold uppercase rounded">Mock Data</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <TimelineEvent type="PITCH START" time="00:00" content='"Hello everyone, today I&apos;m excited to present PitchNest..."' />
            <TimelineEvent type="INVESTOR QUESTION" time="00:15" active={true} content='"How does your algorithm account for market volatility?"' />
            <TimelineEvent type="RESPONSE" time="00:20" content='"Great question. Our model utilizes real-time API feeds..."' />
            <TimelineEvent type="CLOSING REMARKS" time="01:45" content='"Thank you for your time. We&apos;re looking for partners..."' />
          </div>
        </div>
      </div>

      <div className="card p-10 space-y-10 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="text-sky-500" size={24} />
          <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">AI Performance Summary</h3>
        </div>
  
        {isLoading ? (
          <div className="space-y-4">
            <div className="w-full h-4 bg-slate-200 dark:bg-zinc-800 animate-pulse rounded" />
            <div className="w-full h-4 bg-slate-200 dark:bg-zinc-800 animate-pulse rounded" />
            <div className="w-2/3 h-4 bg-slate-200 dark:bg-zinc-800 animate-pulse rounded" />
          </div>
        ) : session && session.evaluation_report ? (
          <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-4">
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Executive Overview</p>
              <p className="text-lg text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                {session.summary || session.evaluation_report?.summary || "No summary available for this pitch."}
              </p>
            </div>
            <div className="space-y-4 bg-sky-50 dark:bg-sky-900/10 p-6 rounded-2xl border border-sky-100 dark:border-sky-900/30">
              <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Investor Readiness</p>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                Based on this session, your pitch readiness is evaluated at a <strong>{scores.readiness}/10</strong>. Focus on iterating your delivery and ensuring your market size arguments are defensible before presenting to live VC panels.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 border border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl text-center text-slate-500">
            <p>No session data found. Complete a pitch to see your results here!</p>
          </div>
        )}
      </div>
    </div>
  );
}
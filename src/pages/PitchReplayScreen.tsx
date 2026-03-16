import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, ChevronLeft, MessageSquare, Sparkles, Target, Clock, FileText, Download, Share2
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
        type.includes('FOUNDER') ? "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
      )}>
        {type}
      </span>
      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">{time}</span>
    </div>
    <p className={cn("text-sm leading-relaxed", active ? "text-slate-900 dark:text-zinc-100 font-medium" : "text-slate-500 dark:text-zinc-400")}>
      {content}
    </p>
  </div>
);

// 🔥 THE ULTIMATE HARDCODED DEMO DATA
const MOCK_REPORT = {
  business_name: "Seed Round - Y Combinator",
  summary: "An incredibly strong pitch with a clear value proposition. The founder demonstrated deep market knowledge, though the go-to-market strategy for enterprise clients could use a bit more clarity regarding customer acquisition costs (CAC).",
  scores: { delivery: 9, clarity: 8, scalability: 9, readiness: 9 },
  overall: 88,
  transcript: [
    { type: "FOUNDER PITCH", time: "00:00", text: "Hi panel, I'm building PitchNest. We use AI to simulate VC boardrooms so founders can practice their pitches before stepping into the real room." },
    { type: "INVESTOR RESPONSE", time: "01:15", text: "That's a massive pain point. But how do you plan to monetize this? Is it B2B or B2C?" },
    { type: "FOUNDER PITCH", time: "01:22", text: "We are starting with a B2B SaaS model targeting accelerators and incubators, who then offer it as a perk to their cohorts." },
    { type: "INVESTOR RESPONSE", time: "02:10", text: "Smart wedge strategy. Your technical moat looks solid with the Gemini integration." },
    { type: "FOUNDER PITCH", time: "03:30", text: "Exactly. We are raising $500k to expand the engineering team and secure partnerships with top-tier accelerators. Thank you for your time." }
  ]
};

export default function PitchReplayScreen() {
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
            <span className="text-slate-900 dark:text-zinc-100">{MOCK_REPORT.business_name}</span>
          </div>
        </div>
  
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2">
            <Download size={18} /> Download
          </button>
          <button className="px-6 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-all flex items-center gap-2">
            <Share2 size={18} /> Share Report
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-slate-900 rounded-[40px] relative overflow-hidden shadow-2xl group flex items-center justify-center border border-slate-800">
            {/* 🔥 FAKE VIDEO OVERLAY THAT LOOKS INCREDIBLY REAL */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opacity-60" />
            <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center gap-4 text-white">
              <button className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/30">
                <Play size={20} fill="currentColor" className="ml-1" />
              </button>
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-sky-500 rounded-full" />
              </div>
              <span className="text-xs font-mono font-bold">01:15 / 03:45</span>
            </div>
            <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&w=1200&q=80" alt="Video Cover" className="w-full h-full object-cover opacity-80 mix-blend-luminosity" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Overall Score", value: `${MOCK_REPORT.overall}%`, icon: Target, color: "text-sky-500" },
              { label: "Delivery", value: `${MOCK_REPORT.scores.delivery}/10`, icon: Sparkles, color: "text-indigo-500" },
              { label: "Clarity", value: `${MOCK_REPORT.scores.clarity}/10`, icon: MessageSquare, color: "text-purple-500" },
              { label: "Scalability", value: `${MOCK_REPORT.scores.scalability}/10`, icon: Clock, color: "text-amber-500" }
            ].map((stat, i) => (
              <div key={i} className="card p-6 flex flex-col gap-2 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                <div className="flex items-center gap-2">
                  <stat.icon className={stat.color} size={16} />
                  <span className="text-xl font-bold text-slate-900 dark:text-zinc-100">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card flex flex-col overflow-hidden dark:bg-zinc-900 dark:border-zinc-800 shadow-lg border border-slate-100">
          <div className="p-8 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="text-sky-500" size={20} />
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Live Transcript</h3>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {MOCK_REPORT.transcript.map((msg, i) => (
              <TimelineEvent key={i} type={msg.type} time={msg.time} content={`"${msg.text}"`} active={i === 1} />
            ))}
          </div>
        </div>
      </div>

      <div className="card p-10 space-y-10 dark:bg-zinc-900 dark:border-zinc-800 shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <div className="flex items-center gap-2 relative z-10">
          <Sparkles className="text-sky-500" size={24} />
          <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">AI Performance Summary</h3>
        </div>
  
        <div className="grid md:grid-cols-3 gap-12 relative z-10">
          <div className="md:col-span-2 space-y-4">
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Executive Overview</p>
            <p className="text-lg text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
              {MOCK_REPORT.summary}
            </p>
          </div>
          <div className="space-y-4 bg-sky-50 dark:bg-sky-900/10 p-6 rounded-2xl border border-sky-100 dark:border-sky-900/30">
            <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Investor Readiness</p>
            <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
              Based on this session, your pitch readiness is evaluated at a <strong className="text-sky-600">{MOCK_REPORT.scores.readiness}/10</strong>. You are highly prepared for live VC panels, but focus on tightening up the unit economics explanation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
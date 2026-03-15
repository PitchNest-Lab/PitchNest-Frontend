import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, MoreVertical, Play, BarChart3, 
  Calendar, Clock, Download, Trash2, Share2, AlertCircle
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/Skeleton'; 

const PitchRow = ({ id, name, date, duration, score, type, onDelete }: { id: number, name: string, date: string, duration: string, score: number, type: string, onDelete: (id: number) => void }) => {
  const isIncomplete = score === 0;

  return (
    <div className="group flex items-center justify-between p-6 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl hover:border-sky-200 dark:hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-50 dark:hover:shadow-none transition-all">
      <div className="flex items-center gap-6 flex-1">
        <Link to={`/report?session=${id}`} className="w-12 h-12 bg-slate-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-zinc-500 group-hover:bg-sky-50 dark:group-hover:bg-sky-900/20 group-hover:text-sky-500 transition-colors">
          <Play size={24} fill="currentColor" />
        </Link>
        <div className="grid grid-cols-4 flex-1 gap-8 items-center">
          <div className="col-span-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-1">{name}</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{type}</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-300 dark:text-zinc-600" />
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-300 dark:text-zinc-600" />
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">{duration}</span>
          </div>
          <div className="flex items-center gap-4">
            {isIncomplete ? (
              <div className="flex items-center gap-2 text-slate-400">
                <AlertCircle size={14} />
                <span className="text-xs font-bold uppercase tracking-widest">Incomplete</span>
              </div>
            ) : (
              <>
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-sky-500" : "bg-amber-500"
                  )} style={{ width: `${score}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">{score}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-8">
        <Link to={`/report?session=${id}`} className="px-4 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
          View Report
        </Link>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">
              <MoreVertical size={20} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="min-w-[160px] bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-100 dark:border-zinc-800 p-2 z-50">
              <DropdownMenu.Item asChild className="outline-none">
                <Link to={`/report?session=${id}`} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer">
                  <BarChart3 size={14} />
                  View Report
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer outline-none">
                <Share2 size={14} />
                Share Pitch
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-zinc-800 my-1" />
              <DropdownMenu.Item 
                onSelect={() => onDelete(id)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg cursor-pointer outline-none"
              >
                <Trash2 size={14} />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
};

export default function MyPitchesArchive() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalPitches: 0, avgScore: 0 });
  const [searchTerm, setSearchTerm] = useState("");

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
          
          const validScores = data.map((s: any) => {
            const r = s.evaluation_report?.scores;
            return r ? Math.round(((r.delivery + r.clarity + r.scalability + r.readiness) / 40) * 100) : 0;
          }).filter(score => score > 0);
          
          setStats({
            totalPitches: data.length,
            avgScore: validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0
          });
        }
      } catch (error) {
        console.error("Failed to load sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleDelete = (idToRemove: number) => {
    setSessions(prev => prev.filter(s => s.id !== idToRemove));
    setStats(prev => ({ ...prev, totalPitches: Math.max(0, prev.totalPitches - 1) }));
  };

  const filteredSessions = sessions.filter(session => {
    const defaultName = `Pitch Session #${session.id}`;
    const targetName = session.business_name || defaultName;
    
    return targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (session.summary && session.summary.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-zinc-100 mb-2">My Pitches</h1>
          <p className="text-slate-500 dark:text-zinc-500">Your complete history of AI-powered pitch sessions and analysis.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search pitches..." 
              className="pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:text-zinc-100 min-w-[300px]"
            />
          </div>
          <button className="px-6 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <div className="col-span-3 space-y-4">
          <div className="flex items-center justify-between px-6 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
            <div className="flex items-center gap-6 flex-1">
              <div className="w-12" />
              <div className="grid grid-cols-4 flex-1 gap-8">
                <span>Pitch Name</span>
                <span>Date</span>
                <span>Duration</span>
                <span>Score</span>
              </div>
            </div>
            <div className="w-[120px]" />
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 ml-6 grid grid-cols-4 gap-8">
                     <Skeleton className="h-4 w-24" />
                     <Skeleton className="h-4 w-20" />
                     <Skeleton className="h-4 w-16" />
                     <Skeleton className="h-4 w-full rounded-full" />
                  </div>
                  <Skeleton className="w-24 h-8 rounded-lg ml-8" />
                </div>
              ))
            ) : filteredSessions.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-500">
                {searchTerm ? "No pitches match your search." : "No pitch history found. Start a new session to see it here!"}
              </div>
            ) : (
              filteredSessions.map((session) => {
                const r = session.evaluation_report?.scores;
                const score = r ? Math.round(((r.delivery + r.clarity + r.scalability + r.readiness) / 40) * 100) : 0;
                const dateObj = new Date(session.timestamp);
                
                // 🔥 Pulls real duration from the database evaluation
                const realDurationSecs = session.evaluation_report?.duration || 0;
                const simMins = Math.floor(realDurationSecs / 60); 
                const simSecs = realDurationSecs % 60;
                const realDuration = realDurationSecs > 0 ? `${simMins}m ${simSecs}s` : "0m 0s";
                
                const displayName = session.business_name || `Pitch Session #${session.id}`;
                
                return (
                  <PitchRow 
                    key={session.id}
                    id={session.id}
                    name={displayName} 
                    date={dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
                    duration={realDuration} 
                    score={score} 
                    type="Live Pitch" 
                    onDelete={handleDelete}
                  />
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="card p-8 space-y-8 dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Archive Stats</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sky-500 bg-sky-50 dark:bg-sky-900/20">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Total Pitches</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">{stats.totalPitches} Sessions</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Avg. Pitch Score</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">{stats.avgScore}/100</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Database</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">Live Sync</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-sky-500 rounded-[40px] p-8 text-white relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl font-bold">Improve Your Score</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Review your latest pitch summary on the Analytics dashboard to see where to focus your efforts.
              </p>
              <Link to="/analytics" className="w-full py-3 bg-white text-sky-600 text-xs font-bold rounded-xl hover:bg-sky-50 transition-colors inline-block text-center">
                View Full Analytics
              </Link>
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, MoreVertical, Play, BarChart3, 
  Calendar, Clock, Download, Trash2, Share2, AlertCircle, Rocket
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
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className={cn(
                "h-full rounded-full transition-all duration-1000",
                score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-sky-500" : score > 0 ? "bg-amber-500" : "bg-slate-200 dark:bg-zinc-700"
              )} style={{ width: `${score}%` }} />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">{isIncomplete ? "N/A" : score}</span>
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
                  <BarChart3 size={14} /> View Report
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer outline-none">
                <Share2 size={14} /> Share Pitch
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-zinc-800 my-1" />
              <DropdownMenu.Item onSelect={() => onDelete(id)} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg cursor-pointer outline-none">
                <Trash2 size={14} /> Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
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

// Helper to format date
function formatDate(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return "Unknown"; }
}

// Helper to format duration
function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function MyPitchesArchive() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleDelete = async (idToRemove: number) => {
    if (!window.confirm("Are you sure you want to delete this pitch session?")) return;

    try {
      const res = await fetch(`/api/sessions/${idToRemove}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== idToRemove));
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const name = session.business_name || "Untitled Pitch";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sessionScores = sessions.map(s => getOverallScore(s.evaluation_report)).filter(s => s > 0);
  const avgScore = sessionScores.length > 0 
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length) 
    : 0;

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-zinc-100 mb-2">My Pitches</h1>
          <p className="text-slate-500 dark:text-zinc-500">Your complete history of AI-powered pitch sessions and analysis.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search pitches..." 
              className="pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:text-zinc-100 min-w-full sm:min-w-[300px]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div className="hidden sm:flex items-center justify-between px-6 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
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
              <>
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </>
            ) : filteredSessions.length === 0 ? (
              <div className="p-16 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                <Rocket size={48} className="mx-auto text-slate-300 dark:text-zinc-700 mb-4 animate-pulse" />
                <p className="text-slate-500 dark:text-zinc-500 font-medium mb-4">No pitches found. Start a new boardroom session!</p>
                <Link to="/setup" className="px-6 py-2.5 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-all inline-flex items-center gap-2 text-sm shadow-lg shadow-sky-500/25">
                  <Play size={16} fill="currentColor" />
                  Start Pitching
                </Link>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const score = getOverallScore(session.evaluation_report);
                const name = session.business_name || "Untitled Pitch";
                const date = formatDate(session.timestamp);
                const duration = formatDuration(session.evaluation_report?.duration);
                const type = session.evaluation_report?.mode === 'coach' ? "Practice Coach" : "VC Panel";
                return (
                  <PitchRow 
                    key={session.id} 
                    id={session.id} 
                    name={name}
                    date={date}
                    duration={duration}
                    score={score}
                    type={type}
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
                  <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                    {isLoading ? "—" : `${sessions.length} Session${sessions.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Avg. Pitch Score</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                    {isLoading ? "—" : `${avgScore}/100`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, MoreVertical, Play, BarChart3, 
  Calendar, Clock, Download, Trash2, Share2, AlertCircle
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '../lib/utils';

const PitchRow = ({ id, name, date, duration, score, type, onDelete }: { id: number, name: string, date: string, duration: string, score: number, type: string, onDelete: (id: number) => void }) => {
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
                score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-sky-500" : "bg-amber-500"
              )} style={{ width: `${score}%` }} />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">{score}</span>
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

// 🔥 BEAUTIFUL HARDCODED DEMO DATA
const MOCK_SESSIONS = [
  { id: 101, name: "Seed Round - Y Combinator", date: "Mar 15, 2026", duration: "3m 45s", score: 92, type: "VC Panel" },
  { id: 102, name: "Angel Investor Pitch", date: "Mar 12, 2026", duration: "4m 12s", score: 85, type: "Live Pitch" },
  { id: 103, name: "PitchNest App Demo", date: "Mar 10, 2026", duration: "2m 50s", score: 78, type: "Solo Practice" },
  { id: 104, name: "Techstars Application", date: "Mar 05, 2026", duration: "5m 05s", score: 88, type: "VC Panel" }
];

export default function MyPitchesArchive() {
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [searchTerm, setSearchTerm] = useState("");

  const handleDelete = (idToRemove: number) => {
    setSessions(prev => prev.filter(s => s.id !== idToRemove));
  };

  const filteredSessions = sessions.filter(session => 
    session.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgScore = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, curr) => acc + curr.score, 0) / sessions.length) 
    : 0;

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
            <Filter size={18} /> Filter
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
            {filteredSessions.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-500">
                No pitches match your search.
              </div>
            ) : (
              filteredSessions.map((session) => (
                <PitchRow key={session.id} {...session} onDelete={handleDelete} />
              ))
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
                  <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">{sessions.length} Sessions</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Avg. Pitch Score</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">{avgScore}/100</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
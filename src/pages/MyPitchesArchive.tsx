import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FirstTimeTour } from "../components/FirstTimeTour";
import {
  Search,
  Filter,
  MoreVertical,
  Play,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Trash2,
  Share2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { Skeleton } from "../components/Skeleton";
import { LogoMark } from "../components/Logo";

const PitchRow = ({
  id,
  shareId,
  name,
  date,
  duration,
  score,
  type,
  onDelete,
  isSelected,
  onSelectToggle,
}: {
  id: number;
  shareId?: string;
  name: string;
  date: string;
  duration: string;
  score: number;
  type: string;
  onDelete: (id: number) => void;
  isSelected: boolean;
  onSelectToggle: (id: number) => void;
}) => {
  const isIncomplete = score === 0;

  const handleShare = () => {
    const targetId = shareId || id;
    const url = `${window.location.origin}/replay?session=${targetId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("Share link copied to clipboard!");
    });
  };

  return (
    <div className="group flex items-center gap-3 p-4 sm:p-6 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl hover:border-sky-200 dark:hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-50 dark:hover:shadow-none transition-all">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelectToggle(id)}
        className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-sky-500 focus:ring-sky-500/25 cursor-pointer accent-sky-500 shrink-0"
      />

      {/* Play button */}
      <Link
        to={`/report?session=${id}`}
        className="w-10 h-10 shrink-0 bg-slate-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-zinc-500 group-hover:bg-sky-50 dark:group-hover:bg-sky-900/20 group-hover:text-sky-500 transition-colors"
      >
        <Play size={20} fill="currentColor" />
      </Link>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
        {/* Name + type */}
        <div className="min-w-0 sm:flex-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
            {name}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
            {type}
          </p>
        </div>

        {/* Date + duration row on mobile, separate cols on desktop */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <Calendar
              size={13}
              className="text-slate-300 dark:text-zinc-600 shrink-0"
            />
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium whitespace-nowrap">
              {date}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock
              size={13}
              className="text-slate-300 dark:text-zinc-600 shrink-0"
            />
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              {duration}
            </span>
          </div>
        </div>

        {/* Score bar */}
        <div className="flex items-center gap-2 sm:w-28">
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                score >= 80
                  ? "bg-emerald-500"
                  : score >= 60
                    ? "bg-sky-500"
                    : score > 0
                      ? "bg-amber-500"
                      : "bg-slate-200 dark:bg-zinc-700",
              )}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 shrink-0">
            {isIncomplete ? "N/A" : score}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 ml-1">
        <Link
          to={`/report?session=${id}`}
          className="hidden sm:block px-4 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
        >
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
                <Link
                  to={`/report?session=${id}`}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                >
                  <BarChart3 size={14} /> View Report
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild className="outline-none">
                <Link
                  to={`/replay?session=${id}`}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                >
                  <Play size={14} /> View Replay
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={handleShare}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer outline-none"
              >
                <Share2 size={14} /> Share Pitch
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-zinc-800 my-1" />
              <DropdownMenu.Item
                onSelect={() => onDelete(id)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg cursor-pointer outline-none"
              >
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
  const total =
    (Number(s.delivery) || 0) +
    (Number(s.clarity) || 0) +
    (Number(s.scalability) || 0) +
    (Number(s.readiness) || 0);
  return Math.round(total / 4);
}

// Helper to format date
function formatDate(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Unknown";
  }
}

// Helper to format duration
function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function MyPitchesArchive() {
  const { authFetch } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await authFetch("/api/sessions");
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
    if (!window.confirm("Are you sure you want to delete this pitch session?"))
      return;

    try {
      const res = await authFetch(`/api/sessions/${idToRemove}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== idToRemove));
        setSelectedIds((prev) => prev.filter((x) => x !== idToRemove));
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleSelectToggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const filteredSessions = sessions.filter((session) => {
    const name = session.business_name || "Untitled Pitch";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelectAllToggle = () => {
    if (filteredSessions.length === 0) return;
    if (selectedIds.length === filteredSessions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSessions.map((s) => s.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete the ${selectedIds.length} selected pitch sessions?`,
      )
    )
      return;

    setIsDeleting(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          authFetch(`/api/sessions/${id}`, { method: "DELETE" }),
        ),
      );
      setSessions((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
      setSelectedIds([]);
    } catch (err) {
      console.error("Failed to delete sessions:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const sessionScores = sessions
    .map((s) => getOverallScore(s.evaluation_report))
    .filter((s) => s > 0);
  const avgScore =
    sessionScores.length > 0
      ? Math.round(
          sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length,
        )
      : 0;

  return (
    <div className="space-y-10">
      <FirstTimeTour
        tourKey="my-pitches"
        steps={[
          { title: "Your pitch history", body: "Every session you run is saved here with its score, so you can see how you're improving over time." },
          { title: "Open any report", body: "Tap a pitch to reopen its full report, or jump into the replay to revisit how the conversation went." },
          { title: "Keep it tidy", body: "Select pitches to delete ones you no longer need — your best runs stay one tap away." },
        ]}
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-zinc-100 mb-2">
            My Pitches
          </h1>
          <p className="text-slate-500 dark:text-zinc-500">
            Your complete history of AI-powered pitch sessions and analysis.
          </p>
        </div>
        <div className="flex gap-4 items-center">
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
            >
              {isDeleting ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Trash2 size={14} />
              )}
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <div className="relative flex-1 sm:flex-initial">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
              size={18}
            />
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
              <input
                type="checkbox"
                checked={
                  filteredSessions.length > 0 &&
                  selectedIds.length === filteredSessions.length
                }
                onChange={handleSelectAllToggle}
                className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-sky-500 focus:ring-sky-500/25 cursor-pointer accent-sky-500 shrink-0"
              />
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
                <LogoMark size="xl" className="mx-auto mb-4 opacity-40 animate-pulse" />
                <p className="text-slate-500 dark:text-zinc-500 font-medium mb-4">
                  No pitches found. Start a new boardroom session!
                </p>
                <Link
                  to="/setup"
                  className="px-6 py-2.5 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-all inline-flex items-center gap-2 text-sm shadow-lg shadow-sky-500/25"
                >
                  <Play size={16} fill="currentColor" />
                  Start Pitching
                </Link>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const score = getOverallScore(session.evaluation_report);
                const name = session.business_name || "Untitled Pitch";
                const date = formatDate(session.created_at);
                const duration = formatDuration(
                  session.evaluation_report?.duration,
                );
                const type =
                  session.evaluation_report?.mode === "coach"
                    ? "Practice Coach"
                    : "VC Panel";
                return (
                  <PitchRow
                    key={session.id}
                    id={session.id}
                    shareId={session.share_id}
                    name={name}
                    date={date}
                    duration={duration}
                    score={score}
                    type={type}
                    onDelete={handleDelete}
                    isSelected={selectedIds.includes(session.id)}
                    onSelectToggle={handleSelectToggle}
                  />
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="card p-8 space-y-8 dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              Archive Stats
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sky-500 bg-sky-50 dark:bg-sky-900/20">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    Total Pitches
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                    {isLoading
                      ? "—"
                      : `${sessions.length} Session${sessions.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    Avg. Pitch Score
                  </p>
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

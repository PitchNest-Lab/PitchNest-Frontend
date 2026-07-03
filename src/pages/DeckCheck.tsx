import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  FileSearch, FileText, Upload, Loader2, FileDown, CheckCircle2,
  AlertTriangle, ShieldAlert, Target, Sparkles, History,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { Skeleton } from "../components/Skeleton";
import { downloadPdf } from "../lib/downloadFile";

interface DeckAudit {
  id: number | null;
  deck_id: number;
  report: any;
  created_at: string;
}

const VERDICT_STYLES: Record<string, string> = {
  Invest: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
  Watch: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
  Pass: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40",
};

const SECTION_STATUS_STYLES: Record<string, string> = {
  strong: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
  weak: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
  missing: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400",
};

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

const ListCard = ({ title, items, icon: Icon, tone }: {
  title: string;
  items: string[];
  icon: any;
  tone: "emerald" | "rose" | "amber" | "indigo";
}) => {
  if (!items || items.length === 0) return null;
  const toneClasses = {
    emerald: "text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10",
    rose: "text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-900/10",
    amber: "text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10",
    indigo: "text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-900/10",
  }[tone];
  return (
    <div className={cn("rounded-2xl border p-6", toneClasses)}>
      <h3 className="font-extrabold flex items-center gap-2 mb-4 text-sm">
        <Icon size={16} /> {title}
      </h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-zinc-300">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-60" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function DeckCheck() {
  const { authFetch } = useAuth();
  const location = useLocation();
  const [decks, setDecks] = useState<any[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(
    location.state?.deckId ?? null,
  );
  const [audits, setAudits] = useState<DeckAudit[]>([]);
  const [activeAudit, setActiveAudit] = useState<DeckAudit | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load decks
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const res = await authFetch("/api/decks");
        if (res.ok) {
          const data = await res.json();
          setDecks(data);
          if (!location.state?.deckId && data.length > 0) {
            setSelectedDeckId((prev) => prev ?? data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch decks:", err);
      } finally {
        setIsLoadingDecks(false);
      }
    };
    fetchDecks();
  }, []);

  // Load audit history when the selected deck changes
  useEffect(() => {
    if (!selectedDeckId || String(selectedDeckId).startsWith("temp-")) {
      setAudits([]);
      setActiveAudit(null);
      return;
    }
    let cancelled = false;
    const fetchAudits = async () => {
      try {
        const res = await authFetch(`/api/decks/${selectedDeckId}/audits`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setAudits(data);
          setActiveAudit(data[0] || null);
        }
      } catch (err) {
        console.error("Failed to fetch audits:", err);
      }
    };
    setErrorMsg(null);
    fetchAudits();
    return () => {
      cancelled = true;
    };
  }, [selectedDeckId]);

  const handleUploadDeck = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const tempId = "temp-" + Date.now();
    const tempDeck = {
      id: tempId,
      name: file.name.replace(/\.[^/.]+$/, ""),
      size: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
      status: "DRAFT",
    };
    setDecks((prev) => [tempDeck, ...prev]);
    setSelectedDeckId(tempId as any);

    const formData = new FormData();
    formData.append("deck", file);
    try {
      const res = await authFetch("/api/upload-deck", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const savedDeck = await res.json();
      setDecks((prev) => prev.map((d) => (d.id === tempId ? savedDeck : d)));
      setSelectedDeckId(savedDeck.id);
    } catch (err) {
      console.error("Failed to upload deck:", err);
      alert("Failed to upload pitch deck. Please try again.");
      setDecks((prev) => prev.filter((d) => d.id !== tempId));
      setSelectedDeckId(null);
    }
  };

  const handleRunCheck = useCallback(async () => {
    if (!selectedDeckId || isAuditing) return;
    setIsAuditing(true);
    setErrorMsg(null);
    try {
      const res = await authFetch(`/api/decks/${selectedDeckId}/audit`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setErrorMsg(data.error || "Audit limit reached — try again in an hour.");
        return;
      }
      if (res.status === 400) {
        setErrorMsg(data.error || "This deck has no readable text to audit.");
        return;
      }
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to audit deck. Please try again.");
        return;
      }
      setActiveAudit(data);
      setAudits((prev) => [data, ...prev]);
    } catch (err) {
      console.error("Deck audit failed:", err);
      setErrorMsg("Failed to audit deck. Please check your connection and try again.");
    } finally {
      setIsAuditing(false);
    }
  }, [selectedDeckId, isAuditing, authFetch]);

  const handleDownloadPDF = useCallback(async () => {
    if (!activeAudit?.id || isDownloading) return;
    setIsDownloading(true);
    try {
      const deckName = decks.find((d) => d.id === activeAudit.deck_id)?.name || "Deck";
      await downloadPdf(
        () => authFetch(`/api/decks/audits/${activeAudit.id}/pdf`),
        `PitchNest_DeckCheck_${deckName.replace(/\s+/g, "_")}.pdf`,
      );
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Failed to download the report. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [activeAudit, isDownloading, authFetch, decks]);

  const report = activeAudit?.report;
  const score = report ? Math.min(100, Math.max(0, Math.round(Number(report.fundability_score) || 0))) : 0;
  const verdict = report?.verdict || "Watch";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-zinc-100 mb-2">Deck Check</h1>
        <p className="text-slate-500 dark:text-zinc-500 max-w-2xl">
          Upload a pitch deck and get an instant AI verdict — strengths, weaknesses, red flags and
          fixes — without running a live session. Download the result as a PDF report.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT: deck picker */}
        <div className="space-y-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-500 dark:text-zinc-400 hover:border-sky-300 dark:hover:border-sky-500/50 hover:text-sky-500 transition-all flex items-center justify-center gap-2 text-sm font-bold"
          >
            <Upload size={16} /> Upload New Deck
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.ppt,.pptx"
            className="hidden"
            onChange={handleUploadDeck}
          />

          <div className="space-y-2">
            {isLoadingDecks ? (
              <>
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </>
            ) : decks.length === 0 ? (
              <p className="p-4 text-sm text-slate-500 dark:text-zinc-500 text-center">
                No decks yet — upload one to run your first check.
              </p>
            ) : (
              decks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => setSelectedDeckId(deck.id)}
                  className={cn(
                    "w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3",
                    selectedDeckId === deck.id
                      ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10 shadow-sm"
                      : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-sky-200 dark:hover:border-sky-500/40",
                  )}
                >
                  <FileText
                    size={18}
                    className={selectedDeckId === deck.id ? "text-sky-500 shrink-0" : "text-slate-400 dark:text-zinc-500 shrink-0"}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">{deck.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                      {deck.size ? `${deck.size} MB` : ""} {deck.status === "DRAFT" ? "· uploading…" : ""}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Audit history for the selected deck */}
          {audits.length > 0 && (
            <div className="pt-2">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <History size={12} /> Past Checks
              </h4>
              <div className="space-y-1.5">
                {audits.map((a, i) => (
                  <button
                    key={a.id ?? `local-${i}`}
                    onClick={() => setActiveAudit(a)}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between gap-2 transition-all border",
                      activeAudit === a
                        ? "border-sky-300 dark:border-sky-500/50 bg-sky-50 dark:bg-sky-500/10"
                        : "border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-500 dark:text-zinc-400",
                    )}
                  >
                    <span>{formatDate(a.created_at)}</span>
                    <span className="font-bold">
                      {Math.round(Number(a.report?.fundability_score) || 0)} · {a.report?.verdict || "—"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: verdict panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <button
              onClick={handleRunCheck}
              disabled={!selectedDeckId || isAuditing || String(selectedDeckId).startsWith("temp-")}
              className="px-8 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-all flex items-center gap-2 text-sm shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuditing ? <Loader2 size={16} className="animate-spin" /> : <FileSearch size={16} />}
              {isAuditing ? "Analyzing your deck… ~20s" : "Run Check"}
            </button>
            {activeAudit?.id && (
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="px-6 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-2 text-sm shadow-sm disabled:opacity-50"
              >
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                Download Report
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-sm font-medium text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {errorMsg}
            </div>
          )}

          {!report ? (
            <div className="p-16 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl">
              <FileSearch size={48} className="mx-auto text-slate-300 dark:text-zinc-700 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-zinc-300 mb-1">
                No check yet for this deck
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-500">
                Select a deck and hit "Run Check" — the AI analyst reads it and returns a verdict in
                about 20 seconds.
              </p>
            </div>
          ) : (
            <>
              {/* Verdict + score */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-28 h-28 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F5F9" strokeWidth="6" className="dark:stroke-zinc-800" />
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke={score >= 70 ? "#10B981" : score >= 45 ? "#F59E0B" : "#F43F5E"}
                      strokeWidth="6"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 * (1 - score / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold">{score}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">/100</span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center gap-3 justify-center md:justify-start mb-3 flex-wrap">
                    <h2 className="text-xl font-extrabold">Fundability Score</h2>
                    <span className={cn("px-3 py-1 border rounded-full text-xs font-bold", VERDICT_STYLES[verdict] || VERDICT_STYLES.Watch)}>
                      Verdict: {verdict}
                    </span>
                  </div>
                  {report.one_liner && (
                    <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed italic">
                      "{report.one_liner}"
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-3">
                    Deck-only audit · no live session · {formatDate(activeAudit!.created_at)}
                  </p>
                </div>
              </div>

              {/* Section coverage */}
              {Array.isArray(report.sections) && report.sections.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-extrabold flex items-center gap-2 mb-4 text-sm">
                    <Target size={16} className="text-sky-500" /> Section Coverage
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {report.sections.map((s: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{s.section}</p>
                          <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase", SECTION_STATUS_STYLES[s.status] || SECTION_STATUS_STYLES.weak)}>
                            {s.status}
                          </span>
                        </div>
                        {s.note && <p className="text-[10px] text-slate-500 dark:text-zinc-500 leading-snug">{s.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Red flags */}
              {Array.isArray(report.red_flags) && report.red_flags.length > 0 && (
                <div className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-3xl p-6">
                  <h3 className="text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-2 mb-4 text-sm">
                    <ShieldAlert size={16} /> Red Flags & Fixes
                  </h3>
                  <div className="space-y-4">
                    {report.red_flags.map((f: any, i: number) => (
                      <div key={i} className="bg-white dark:bg-zinc-900 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4">
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-1">
                          {i + 1}. {f.flag}
                        </p>
                        {f.why && <p className="text-xs text-slate-600 dark:text-zinc-400 mb-2">{f.why}</p>}
                        {f.fix && (
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-1.5">
                            <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> Fix: {f.fix}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lists */}
              <div className="grid md:grid-cols-2 gap-6">
                <ListCard title="Strengths" items={report.strengths} icon={CheckCircle2} tone="emerald" />
                <ListCard title="Weaknesses" items={report.weaknesses} icon={AlertTriangle} tone="rose" />
                <ListCard title="Risks" items={report.risks} icon={ShieldAlert} tone="amber" />
                <ListCard title="VC Concerns" items={report.vc_concerns} icon={Sparkles} tone="indigo" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

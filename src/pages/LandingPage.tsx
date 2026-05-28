import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, PlayCircle, ArrowRight, Users, MessageSquare, BarChart3, ShieldCheck, HelpCircle, FileText, Target, TrendingUp, FileCheck, Star, ChevronDown, ChevronUp, Zap, Phone, Mail, ExternalLink, Menu, X } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ThemeToggle } from '../components/ThemeToggle';

/* ───────────────── data ───────────────── */

const testimonials = [
  { name: "Jessica Martinez", initials: "JM", company: "HealthTech AI", quote: "PitchNest helped me identify and fix critical weaknesses before my Series A. We closed $8M.", result: "Raised $8M Series A", gradient: "from-purple-500 to-blue-500" },
  { name: "David Chen", initials: "DC", company: "Quantum Labs", quote: "The AI investors asked questions I never anticipated. This saved me from embarrassment in front of real VCs.", result: "Raised $3.5M Seed", gradient: "from-blue-500 to-cyan-500" },
  { name: "Sophia Williams", initials: "SW", company: "FinFlow", quote: "Best pitch prep tool I've used. The real-time feedback is invaluable. Felt like a real VC meeting.", result: "Raised $12M Series B", gradient: "from-cyan-500 to-purple-500" },
  { name: "Alex Rivera", initials: "AR", company: "DataSync", quote: "The multi-investor debate format is genius. I heard arguments for and against my startup I'd never considered.", result: "Raised $5M Series A", gradient: "from-emerald-500 to-teal-500" },
  { name: "Priya Patel", initials: "PP", company: "CloudNest", quote: "After 3 sessions on PitchNest, I walked into my real pitch with unshakeable confidence. Worth every minute.", result: "Raised $2M Pre-Seed", gradient: "from-amber-500 to-orange-500" },
];

const startupLogos = ["HealthTech AI", "Quantum Labs", "FinFlow", "DataSync", "CloudNest", "AI Forge"];

const features = [
  { icon: Users, title: "Live AI Investor Debate", desc: "Watch AI investors discuss your startup, challenge assumptions, and build consensus in real-time.", color: "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400" },
  { icon: MessageSquare, title: "Real-Time Pitch Feedback", desc: "Get instant, actionable feedback on your pitch delivery, messaging, and presentation style.", color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" },
  { icon: HelpCircle, title: "AI Q&A Simulation", desc: "Practice answering tough investor questions with AI that adapts to your responses.", color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" },
  { icon: FileText, title: "Pitch Deck Analysis", desc: "Detailed analysis of your pitch deck structure, content, and visual effectiveness.", color: "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400" },
  { icon: Target, title: "Founder Performance Scoring", desc: "Comprehensive scoring on confidence, clarity, knowledge depth, and response quality.", color: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400" },
  { icon: TrendingUp, title: "Investor Sentiment Tracking", desc: "Real-time sentiment analysis showing how each AI investor perceives your pitch.", color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" },
  { icon: FileCheck, title: "Fundraising Readiness Report", desc: "Get a detailed report on your fundraising readiness with specific improvement areas.", color: "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400" },
  { icon: BarChart3, title: "Data-Driven Insights", desc: "Beautiful analytics that help you understand your pitch performance at a glance.", color: "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400" },
];

const readinessMetrics = [
  { label: "Pitch Clarity", pct: 92 },
  { label: "Market Knowledge", pct: 85 },
  { label: "Financial Literacy", pct: 78 },
  { label: "Response Quality", pct: 88 },
];

const faqs = [
  { q: "What is PitchNest?", a: "PitchNest is an AI-powered platform that simulates real investor pitch sessions. You present your startup idea to a panel of AI investors who listen, ask tough questions, and give you a detailed performance report." },
  { q: "How realistic are the AI investors?", a: "Our AI panel consists of distinct personas — a skeptic lead partner, a numbers-obsessed analyst, and a technical expert. They react dynamically to what you say, challenge your claims, and even debate among themselves, just like a real VC boardroom." },
  { q: "Can I upload my pitch deck?", a: "Yes! Upload your pitch deck as a PDF and the AI investors will actually read and reference it during the session, asking specific questions about your slides, financials, and market data." },
  { q: "Is PitchNest free?", a: "We're currently in early access. Join the waitlist to secure your spot and get notified when we launch. Early adopters will receive exclusive benefits." },
  { q: "What kind of feedback do I get?", a: "You receive a comprehensive evaluation report covering pitch clarity, market knowledge, financial literacy, response quality, and overall fundraising readiness — with specific, actionable improvement suggestions." },
  { q: "Can I practice multiple times?", a: "Absolutely. Each session is saved with a full transcript replay and evaluation report so you can track your improvement over time." },
];

/* ───────────────── component ───────────────── */

export default function LandingPage() {
  const [logoError, setLogoError] = useState(false);
  const [footerLogoError, setFooterLogoError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [waitlistMessage, setWaitlistMessage] = useState('');

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes('@')) { setWaitlistStatus('error'); setWaitlistMessage('Please enter a valid email address.'); return; }
    setWaitlistStatus('loading');
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: waitlistEmail }) });
      const data = await res.json();
      if (res.ok) { setWaitlistStatus('success'); setWaitlistEmail(''); } else { setWaitlistStatus('error'); setWaitlistMessage(data.error || 'Something went wrong.'); }
    } catch { setWaitlistStatus('error'); setWaitlistMessage('Server connection error.'); }
  };

  useEffect(() => { if (localStorage.getItem('user')) setIsLoggedIn(true); }, []);

  // Testimonial swipe carousel
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTestimonialIdx(prev => (prev + 1) % testimonials.length), 4000);
    return () => clearInterval(timer);
  }, []);

  // On mobile show only 4 features; on desktop show all 8
  const visibleFeatures = showAllFeatures ? features : features.slice(0, 4);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-100 transition-colors duration-300 overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center relative z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={cn("w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center overflow-hidden rounded-xl", logoError && "bg-sky-500 text-white shadow-lg shadow-sky-200")}>
            {!logoError ? <img src="/PitchNest Logo.png" alt="PitchNest" className="w-full h-full object-contain" onError={() => setLogoError(true)} /> : <Rocket size={20} fill="currentColor" />}
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight">PitchNest</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-zinc-400">
          <a href="#features" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Features</a>
          <a href="#why-pitchnest" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Why PitchNest</a>
          <a href="#insights" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Insights</a>
          <a href="#stories" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Stories</a>
          <a href="#faq" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <Link to="/dashboard" className="px-5 py-2.5 bg-sky-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-sky-200 dark:shadow-sky-500/20 hover:bg-sky-600 transition-all">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Login</Link>
                <Link to="/signup" className="px-5 py-2.5 bg-sky-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-sky-200 dark:shadow-sky-500/20 hover:bg-sky-600 transition-all">Start Pitching</Link>
              </>
            )}
          </div>
          <button 
            className="md:hidden p-2 text-slate-600 dark:text-zinc-400"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[72px] left-0 right-0 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 shadow-xl z-40 p-4 flex flex-col gap-4">
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-slate-600 dark:text-zinc-400 py-2">Features</a>
          <a href="#why-pitchnest" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-slate-600 dark:text-zinc-400 py-2">Why PitchNest</a>
          <a href="#insights" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-slate-600 dark:text-zinc-400 py-2">Insights</a>
          <a href="#stories" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-slate-600 dark:text-zinc-400 py-2">Stories</a>
          <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-slate-600 dark:text-zinc-400 py-2 border-b border-slate-100 dark:border-zinc-800/50 pb-4">FAQ</a>
          
          <div className="flex flex-col gap-3 pt-2">
            {isLoggedIn ? (
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center px-5 py-3 bg-sky-500 text-white text-base font-bold rounded-xl shadow-lg shadow-sky-200 dark:shadow-sky-500/20">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center px-5 py-3 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-base font-bold rounded-xl">Login</Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center px-5 py-3 bg-sky-500 text-white text-base font-bold rounded-xl shadow-lg shadow-sky-200 dark:shadow-sky-500/20">Start Pitching</Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-10 sm:pb-16 grid lg:grid-cols-2 gap-6 sm:gap-12 items-center">
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3 sm:mb-4">
              <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" /> Live AI Simulation
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-2xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-3 sm:mb-5">
            Pitch Your Startup to an <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">AI Investor Panel</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-sm sm:text-lg text-slate-500 dark:text-zinc-400 leading-relaxed mb-4 sm:mb-6 max-w-xl">
            Present your vision to AI investors that listen, ask questions, and debate your idea in real-time.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-wrap gap-2 sm:gap-3">
            <Link to={isLoggedIn ? "/dashboard" : "/signup"} className="px-4 py-2.5 sm:px-6 sm:py-3 bg-sky-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xl shadow-sky-200 dark:shadow-sky-500/20 hover:bg-sky-600 transition-all flex items-center gap-2">
              Start Pitching
            </Link>
            <a href="https://www.youtube.com" target="_blank" rel="noreferrer" className="px-4 py-2.5 sm:px-6 sm:py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2">
              <PlayCircle size={16} /> Watch Demo
            </a>
          </motion.div>

          {/* Waitlist — Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}>
          {waitlistStatus === 'success' ? (
            <div className="mt-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-2xl flex items-center gap-3 max-w-md">
              <ShieldCheck size={18} className="shrink-0" />
              <span className="text-sm font-bold">You are on the list! We will notify you for early access. 🎉</span>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold mb-3 uppercase tracking-wider">Be among the first founders to join early access!</p>
              <form onSubmit={handleWaitlistSubmit} className="flex gap-2 max-w-md bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
                <input type="email" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} placeholder="Enter your email" className="flex-1 min-w-0 bg-transparent border-none text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-600 px-3 outline-none" disabled={waitlistStatus === 'loading'} />
                <button type="submit" disabled={waitlistStatus === 'loading'} className="px-4 py-2.5 bg-sky-500 text-white text-xs font-bold rounded-xl hover:bg-sky-600 transition-all shrink-0 flex items-center gap-1">
                  {waitlistStatus === 'loading' ? '...' : 'Get Access'} <ArrowRight size={12} />
                </button>
              </form>
              {waitlistStatus === 'error' && <p className="text-xs text-rose-500 font-medium mt-2 pl-3">{waitlistMessage}</p>}
            </div>
          )}
          </motion.div>
        </div>

        {/* Hero visual — hidden on very small screens */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative hidden sm:block">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-indigo-200 dark:shadow-sky-500/10 border-4 sm:border-8 border-slate-900/5 dark:border-white/5">
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-indigo-500/20 via-sky-500/10 to-purple-500/20 flex items-center justify-center">
              <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 p-4 sm:p-6 rounded-2xl w-[85%]">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-sky-500 rounded-full flex items-center justify-center"><Users size={18} className="text-white" /></div>
                    <div>
                      <p className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">AI Investor Panel</p>
                      <p className="text-slate-500 dark:text-white/60 text-[10px] sm:text-xs">3 active personas</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <div className="w-1 h-3 sm:h-4 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-4 sm:h-6 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-2 sm:h-3 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
                {/* Mini chat bubbles */}
                <div className="space-y-2">
                  {["What's your CAC?", "How do you differentiate?", "Walk me through unit economics."].map((q, i) => (
                    <div key={i} className="bg-white/10 dark:bg-white/5 border border-slate-200/20 dark:border-white/10 rounded-xl px-3 py-2">
                      <p className="text-[10px] sm:text-xs text-slate-700 dark:text-white/80">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </motion.div>
      </section>

      {/* ── Stories (Social Proof) ── */}
      <section id="stories" className="bg-slate-50 dark:bg-zinc-900/50 py-10 sm:py-14 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400">
              <TrendingUp className="w-3 h-3 text-green-500" /> Trusted by 500+ startup founders
            </div>
            <h2 className="text-xl sm:text-3xl font-bold mb-2">Founders are raising faster</h2>
            <p className="text-xs sm:text-base text-slate-500 dark:text-zinc-400 max-w-lg mx-auto">Join successful founders who perfected their pitch with AI</p>
          </div>

          {/* Startup logos */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
            {startupLogos.map(logo => (
              <span key={logo} className="px-2.5 py-1 sm:px-4 sm:py-1.5 text-[9px] sm:text-[11px] font-semibold text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-800 rounded-md border border-slate-100 dark:border-zinc-700">{logo}</span>
            ))}
          </div>

          {/* Testimonials — swipe carousel */}
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${testimonialIdx * (100 / 3)}%)` }}
            >
              {testimonials.map((t, idx) => (
                <div key={t.name} className="w-full sm:w-1/3 shrink-0 px-1.5 sm:px-2">
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 p-4 sm:p-5 h-full">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs sm:text-sm font-bold shrink-0", t.gradient)}>{t.initials}</div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs sm:text-sm truncate">{t.name}</h4>
                        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500 truncate">{t.company}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-2">{[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-yellow-500 text-yellow-500" />)}</div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed mb-3">"{t.quote}"</p>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-2.5 h-2.5" /><span className="text-[9px] sm:text-xs font-medium">{t.result}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setTestimonialIdx(i)} className={cn("h-1.5 rounded-full transition-all duration-300", i === testimonialIdx ? "w-6 bg-sky-500" : "w-1.5 bg-slate-300 dark:bg-zinc-700")} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features — 4 columns ── */}
      <section id="features" className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-10">
            <span className="text-sky-600 dark:text-sky-400 font-bold text-[10px] sm:text-sm uppercase tracking-widest">Capabilities</span>
            <h2 className="text-xl sm:text-3xl font-bold mt-1.5 sm:mt-3 mb-2 sm:mb-3">Everything you need to nail your pitch</h2>
            <p className="text-xs sm:text-base text-slate-500 dark:text-zinc-400 max-w-lg mx-auto">Train with the most advanced AI-powered pitch simulation platform</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {visibleFeatures.map((f, i) => (
              <motion.div key={f.title} whileHover={{ y: -3 }} className="bg-white dark:bg-zinc-900 p-3.5 sm:p-5 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800 transition-colors">
                <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2.5 sm:mb-3", f.color)}>
                  <f.icon size={16} />
                </div>
                <h3 className="text-xs sm:text-base font-bold mb-1">{f.title}</h3>
                <p className="text-[10px] sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Show more on mobile */}
          {!showAllFeatures && (
            <button onClick={() => setShowAllFeatures(true)} className="mt-6 mx-auto flex items-center gap-1 text-sm font-bold text-sky-500 hover:text-sky-600 transition-colors lg:hidden">
              Show all features <ChevronDown size={16} />
            </button>
          )}
          {showAllFeatures && (
            <button onClick={() => setShowAllFeatures(false)} className="mt-6 mx-auto flex items-center gap-1 text-sm font-bold text-sky-500 hover:text-sky-600 transition-colors lg:hidden">
              Show less <ChevronUp size={16} />
            </button>
          )}
        </div>
      </section>

      {/* ── How It Works — 3 columns ── */}
      <section id="how-it-works" className="py-10 sm:py-14 bg-slate-50 dark:bg-zinc-900/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-3xl font-bold text-center mb-6 sm:mb-10">Master your pitch in 3 steps</h2>
          <div className="grid grid-cols-3 gap-4 sm:gap-8 relative">
            <div className="hidden sm:block absolute top-6 left-[15%] right-[15%] h-px bg-slate-200 dark:bg-zinc-800 -z-10" />
            {[
              { step: 1, title: "Start a pitch session", desc: "Upload your deck and select your AI investor panel difficulty level." },
              { step: 2, title: "Present your idea", desc: "Present via voice or video. Our AI analyzes your narrative in real-time." },
              { step: 3, title: "Get investor feedback", desc: "Receive a comprehensive report with scores and a recording of the debate." }
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white dark:bg-zinc-900 border-2 border-sky-500 text-sky-500 rounded-full flex items-center justify-center text-sm sm:text-lg font-bold mx-auto mb-2.5 sm:mb-5 shadow-md shadow-sky-100 dark:shadow-sky-500/10">{item.step}</div>
                <h3 className="text-xs sm:text-base font-bold mb-1 sm:mb-2">{item.title}</h3>
                <p className="text-[10px] sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why PitchNest — 2/3 columns ── */}
      <section id="why-pitchnest" className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-10">
            <span className="text-sky-600 dark:text-sky-400 font-bold text-[10px] sm:text-sm uppercase tracking-widest">Why PitchNest</span>
            <h2 className="text-xl sm:text-3xl font-bold mt-1.5 sm:mt-3 mb-2 sm:mb-3">The unfair advantage for founders</h2>
            <p className="text-xs sm:text-base text-slate-500 dark:text-zinc-400 max-w-lg mx-auto">Most founders walk into their first real pitch unprepared. PitchNest changes that.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: Zap, title: "Instant feedback loop", desc: "Get real-time, AI-powered critiques the moment you finish speaking.", accent: "text-amber-500 bg-amber-50 dark:bg-amber-900/20" },
              { icon: Users, title: "Multi-persona simulation", desc: "Three distinct investor archetypes that argue, interrupt, and push back like real VCs.", accent: "text-sky-500 bg-sky-50 dark:bg-sky-900/20" },
              { icon: ShieldCheck, title: "Safe space to fail", desc: "Stumble on tough questions and recover — without burning your one shot with a real investor.", accent: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" },
              { icon: FileText, title: "Deck-aware intelligence", desc: "The AI reads your deck and asks slide-specific questions about TAM, unit economics, and GTM.", accent: "text-violet-500 bg-violet-50 dark:bg-violet-900/20" },
              { icon: TrendingUp, title: "Track your progress", desc: "Every session is recorded and scored. Watch your confidence and readiness improve over time.", accent: "text-rose-500 bg-rose-50 dark:bg-rose-900/20" },
              { icon: BarChart3, title: "Fundraising-ready reports", desc: "Share reports with co-founders, mentors, or accelerators to prove you're investor-ready.", accent: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2.5", item.accent)}>
                  <item.icon size={16} />
                </div>
                <h3 className="text-xs sm:text-base font-bold mb-1">{item.title}</h3>
                <p className="text-[10px] sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data Insights — 4 columns ── */}
      <section id="insights" className="py-10 sm:py-14 bg-slate-50 dark:bg-zinc-900/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-8">
            <span className="text-sky-600 dark:text-sky-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest">Analytics</span>
            <h2 className="text-xl sm:text-3xl font-bold mt-1.5 sm:mt-3 mb-2">Data-driven insights</h2>
            <p className="text-xs sm:text-base text-slate-500 dark:text-zinc-400 max-w-lg mx-auto">Beautiful analytics that help you understand your pitch performance</p>
          </div>

          {/* Readiness metrics — 4 columns on desktop, 2 on mobile */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xs sm:text-sm font-bold mb-3 sm:mb-4">Startup Readiness Progress</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {readinessMetrics.map(m => (
                <div key={m.label} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-lg p-3">
                  <div className="flex justify-between text-[10px] sm:text-xs mb-1.5">
                    <span className="font-medium">{m.label}</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">{m.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", m.pct >= 90 ? "bg-emerald-500" : m.pct >= 80 ? "bg-sky-500" : "bg-amber-500")}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${m.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Waitlist ── */}
      <section className="py-10 sm:py-14 bg-slate-50 dark:bg-zinc-900/50 transition-colors">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-sky-600 dark:text-sky-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest">Limited Early Access</span>
          <h2 className="text-xl sm:text-3xl font-bold mt-1.5 sm:mt-3 mb-2 sm:mb-3">Be Among the First Founders</h2>
          <p className="text-xs sm:text-base text-slate-500 dark:text-zinc-400 mb-4 sm:mb-6">Join the waitlist and get exclusive early access to practice pitching with our AI investor panel</p>

          {waitlistStatus === 'success' ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-xl flex items-center justify-center gap-2">
              <ShieldCheck size={16} /> <span className="text-xs font-bold">You're on the list! 🎉</span>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="flex gap-2 max-w-sm mx-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-1 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
              <input type="email" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} placeholder="Enter your email" className="flex-1 min-w-0 bg-transparent border-none text-xs placeholder:text-slate-400 dark:placeholder:text-zinc-600 px-2.5 outline-none" disabled={waitlistStatus === 'loading'} />
              <button type="submit" disabled={waitlistStatus === 'loading'} className="px-3 py-2 bg-sky-500 text-white text-[10px] sm:text-xs font-bold rounded-lg hover:bg-sky-600 transition-all shrink-0">
                {waitlistStatus === 'loading' ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          )}
          {waitlistStatus === 'error' && <p className="text-[10px] text-rose-500 font-medium mt-1.5">{waitlistMessage}</p>}

          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-4 text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500">
            <span>2,847 founders on the waitlist</span>
            <span>•</span>
            <span>Limited spots available</span>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500 mt-1.5">Early access closes in 7 days. Join now to secure your spot.</p>
        </div>
      </section>

      {/* ── FAQ — 2 columns on desktop ── */}
      <section id="faq" className="py-10 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-8">
            <span className="text-sky-600 dark:text-sky-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest">FAQ</span>
            <h2 className="text-xl sm:text-3xl font-bold mt-1.5 sm:mt-3 mb-2">Frequently asked questions</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="bg-gradient-to-br from-indigo-600 to-sky-500 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center text-white relative overflow-hidden shadow-2xl shadow-sky-500/20">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-4xl font-bold mb-3 sm:mb-5 leading-tight">Ready to face the panel? Start your first pitch today.</h2>
            <p className="text-xs sm:text-base text-white/80 mb-4 sm:mb-6">Don't wait for a real board meeting to find the flaws in your pitch. Iterate faster with PitchNest.</p>
            <Link to={isLoggedIn ? "/dashboard" : "/signup"} className="px-5 py-2.5 sm:px-8 sm:py-3.5 bg-white text-sky-600 text-xs sm:text-sm font-bold rounded-xl shadow-2xl hover:bg-sky-50 transition-all inline-flex items-center gap-2">
              Start Pitching Now
            </Link>
          </div>
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-50 dark:bg-zinc-900/50 py-12 sm:py-20 border-t border-slate-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10">
          {/* Brand + socials */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className={cn("w-7 h-7 flex items-center justify-center overflow-hidden rounded-lg", footerLogoError && "bg-sky-500 text-white")}>
                {!footerLogoError ? <img src="/PitchNest Logo.png" alt="PitchNest" className="w-full h-full object-contain" onError={() => setFooterLogoError(true)} /> : <Rocket size={16} fill="currentColor" />}
              </div>
              <span className="text-base font-bold">PitchNest</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">The AI-powered playground for founders to perfect their pitch.</p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a href="https://x.com/PitchNest" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-sky-500 hover:border-sky-300 dark:hover:border-sky-500 transition-colors" aria-label="X (Twitter)">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://instagram.com/PitchNest" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-pink-500 hover:border-pink-300 dark:hover:border-pink-500 transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://linkedin.com/company/PitchNest" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors" aria-label="LinkedIn">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://wa.me/2349058718400" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-green-500 hover:border-green-300 dark:hover:border-green-500 transition-colors" aria-label="WhatsApp">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              </a>
              <a href="https://tiktok.com/@PitchNest" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-zinc-400 transition-colors" aria-label="TikTok">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.83 4.83 0 0 1-1-.15z"/></svg>
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-bold mb-3 sm:mb-6 text-sm">Platform</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              <li><a href="#features" className="hover:text-sky-600 dark:hover:text-sky-400">Features</a></li>
              <li><a href="#why-pitchnest" className="hover:text-sky-600 dark:hover:text-sky-400">Why PitchNest</a></li>
              <li><a href="#stories" className="hover:text-sky-600 dark:hover:text-sky-400">Stories</a></li>
              <li><a href="#faq" className="hover:text-sky-600 dark:hover:text-sky-400">FAQ</a></li>
              <li><Link to="/login" className="hover:text-sky-600 dark:hover:text-sky-400">Login</Link></li>
              <li><Link to="/signup" className="hover:text-sky-600 dark:hover:text-sky-400">Sign Up</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-3 sm:mb-6 text-sm">Legal</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              <li><Link to="/privacy" className="hover:text-sky-600 dark:hover:text-sky-400">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-sky-600 dark:hover:text-sky-400">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Get in Touch */}
          <div>
            <h4 className="font-bold mb-3 sm:mb-6 text-sm">Get in Touch</h4>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              <li><a href="tel:09058718400" className="hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-2"><Phone size={14} className="shrink-0" /> 09058718400</a></li>
              <li><a href="mailto:pitchnest@gmail.com" className="hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-2"><Mail size={14} className="shrink-0" /> pitchnest@gmail.com</a></li>
              <li><a href="https://wa.me/2349058718400" target="_blank" rel="noreferrer" className="hover:text-green-500 flex items-center gap-2"><svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> WhatsApp</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-bold mb-3 sm:mb-6 text-sm">Newsletter</h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mb-3">Get early access updates.</p>
            <form onSubmit={handleWaitlistSubmit} className="flex gap-2">
              <input type="email" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} placeholder="Email" className="flex-1 min-w-0 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" disabled={waitlistStatus === 'loading'} />
              <button type="submit" disabled={waitlistStatus === 'loading'} className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shrink-0"><ArrowRight size={16} /></button>
            </form>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 sm:mt-16 pt-6 sm:pt-8 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500">
          <p>© {new Date().getFullYear()} PitchNest AI. All rights reserved.</p>
          <p>Built with passion for the startup ecosystem.</p>
        </div>
      </footer>
    </div>
  );
}

/* ───────────────── FAQ sub-component ───────────────── */

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 sm:p-5 text-left">
        <span className="text-sm sm:text-base font-semibold pr-4">{question}</span>
        <ChevronDown size={18} className={cn("shrink-0 text-slate-400 dark:text-zinc-500 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 -mt-1">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
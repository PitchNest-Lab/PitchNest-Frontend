import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket, PlayCircle, ArrowRight, Users, MessageSquare, BarChart3,
  ShieldCheck, HelpCircle, FileText, Target, TrendingUp, FileCheck,
  Star, ChevronDown, Zap, Phone, Mail, Menu, X
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ThemeToggle } from '../components/ThemeToggle';

const testimonials = [
  { name: "Jessica Martinez", initials: "JM", company: "HealthTech AI", quote: "PitchNest surfaced the gaps in my narrative before I walked into my Series A meetings. We closed $8M.", result: "Raised $8M Series A" },
  { name: "David Chen", initials: "DC", company: "Quantum Labs", quote: "The panel asked questions I had never prepared for. That alone was worth months of practice.", result: "Raised $3.5M Seed" },
  { name: "Sophia Williams", initials: "SW", company: "FinFlow", quote: "Real-time feedback on delivery and substance. It felt closer to a real partner meeting than anything else I've used.", result: "Raised $12M Series B" },
  { name: "Alex Rivera", initials: "AR", company: "DataSync", quote: "Hearing investors debate my thesis out loud changed how I structure every slide in my deck.", result: "Raised $5M Series A" },
  { name: "Priya Patel", initials: "PP", company: "CloudNest", quote: "Three sessions in, I stopped fumbling on unit economics. The confidence carried into every real conversation.", result: "Raised $2M Pre-Seed" },
];

const startupLogos = ["HealthTech AI", "Quantum Labs", "FinFlow", "DataSync", "CloudNest", "AI Forge"];

const features = [
  { icon: Users, title: "Live Investor Panel", desc: "Three distinct investor personas debate your startup in real time — challenging assumptions and building consensus." },
  { icon: MessageSquare, title: "Delivery Feedback", desc: "Instant analysis of your pacing, clarity, and messaging as you present." },
  { icon: HelpCircle, title: "Q&A Simulation", desc: "Adaptive follow-up questions that respond to what you actually say, not a script." },
  { icon: FileText, title: "Deck Analysis", desc: "Upload your deck and get slide-specific questions on TAM, unit economics, and GTM." },
  { icon: Target, title: "Performance Scoring", desc: "Structured scores across confidence, clarity, depth, and response quality." },
  { icon: TrendingUp, title: "Sentiment Tracking", desc: "See how each investor persona shifts during your session." },
  { icon: FileCheck, title: "Readiness Report", desc: "A detailed fundraising readiness breakdown with concrete next steps." },
  { icon: BarChart3, title: "Session Analytics", desc: "Track improvement across sessions with clear, actionable metrics." },
];

const readinessMetrics = [
  { label: "Pitch Clarity", pct: 92 },
  { label: "Market Knowledge", pct: 85 },
  { label: "Financial Literacy", pct: 78 },
  { label: "Response Quality", pct: 88 },
];

const faqs = [
  { q: "What is PitchNest?", a: "PitchNest simulates a real investor pitch session. You present to a panel of AI investors who listen, ask questions, debate your thesis, and deliver a structured performance report." },
  { q: "How realistic is the panel?", a: "Each investor has a distinct persona — a skeptical lead partner, a numbers-focused analyst, and a technical evaluator. They react to your answers, push back on claims, and debate among themselves." },
  { q: "Can I upload my pitch deck?", a: "Yes. Upload a PDF and the panel references your slides, financials, and market data during the session." },
  { q: "Is PitchNest free?", a: "We are in early access. Join the waitlist to secure your spot — early adopters receive priority access and exclusive benefits." },
  { q: "What feedback do I receive?", a: "A full evaluation covering pitch clarity, market knowledge, financial literacy, response quality, and fundraising readiness — with specific, actionable recommendations." },
  { q: "Can I practice multiple times?", a: "Every session is saved with a full transcript replay and evaluation report so you can track progress over time." },
];

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#why-pitchnest", label: "Why PitchNest" },
  { href: "#stories", label: "Stories" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingPage() {
  const [logoError, setLogoError] = useState(false);
  const [footerLogoError, setFooterLogoError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [waitlistMessage, setWaitlistMessage] = useState('');
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes('@')) {
      setWaitlistStatus('error');
      setWaitlistMessage('Please enter a valid email address.');
      return;
    }
    setWaitlistStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setWaitlistStatus('success');
        setWaitlistEmail('');
      } else {
        setWaitlistStatus('error');
        setWaitlistMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setWaitlistStatus('error');
      setWaitlistMessage('Server connection error.');
    }
  };

  useEffect(() => { if (localStorage.getItem('user')) setIsLoggedIn(true); }, []);

  useEffect(() => {
    const timer = setInterval(() => setTestimonialIdx(prev => (prev + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const visibleFeatures = showAllFeatures ? features : features.slice(0, 4);

  const Logo = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
    <div className={cn(
      "flex items-center justify-center overflow-hidden rounded-xl",
      size === 'sm' ? "w-8 h-8" : "w-10 h-10",
      logoError && "gradient-brand text-white"
    )}>
      {!logoError ? (
        <img src="/logo.svg" alt="PitchNest" className="w-full h-full object-contain" onError={() => setLogoError(true)} />
      ) : (
        <Rocket size={size === 'sm' ? 16 : 20} fill="currentColor" />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] font-sans text-slate-900 dark:text-zinc-100 transition-colors duration-300 overflow-x-hidden">

      {/* Background mesh */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none -z-10" />

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 nav-glass">
        <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">PitchNest</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn ? (
                <Link to="/dashboard" className="btn-primary text-sm px-5 py-2.5">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost">Log in</Link>
                  <Link to="/signup" className="btn-primary text-sm px-5 py-2.5">Start pitching</Link>
                </>
              )}
            </div>
            <button
              className="md:hidden p-2 text-slate-600 dark:text-zinc-400"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Transparent nav spacer for hero */}
      <div className="h-16" />

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 nav-glass z-40 p-5 flex flex-col gap-1 shadow-lg">
          {navLinks.map(link => (
            <a key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="py-3 text-base font-medium text-slate-600 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800/50">
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-4">
            {isLoggedIn ? (
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary w-full text-center">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn-secondary w-full text-center">Log in</Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary w-full text-center">Start pitching</Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 mb-8 rounded-full border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Applying for</span>
              <span className="text-[11px] font-bold uppercase tracking-widest gradient-text">Y Combinator W26</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight mb-6"
          >
            Practice your pitch with an{' '}
            <span className="gradient-text">AI investor panel</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="section-subheading mx-auto mb-10"
          >
            Present to a panel that listens, pushes back, and debates your thesis — then get a structured report on exactly where to improve before your next real meeting.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          >
            <Link to={isLoggedIn ? "/dashboard" : "/signup"} className="btn-primary w-full sm:w-auto px-8 py-3.5 text-base">
              Start pitching <ArrowRight size={18} />
            </Link>
            <a href="https://www.youtube.com" target="_blank" rel="noreferrer" className="btn-secondary w-full sm:w-auto px-8 py-3.5 text-base">
              <PlayCircle size={18} /> Watch demo
            </a>
          </motion.div>

          {/* Waitlist */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.32 }} className="max-w-md mx-auto">
            {waitlistStatus === 'success' ? (
              <div className="flex items-center justify-center gap-3 px-5 py-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck size={18} className="shrink-0" />
                <span className="text-sm font-semibold">You are on the list. We will notify you for early access.</span>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Early access waitlist</p>
                <form onSubmit={handleWaitlistSubmit} className="flex gap-2 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-sky-500/15 transition-all">
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="flex-1 min-w-0 bg-transparent border-none text-sm px-4 outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                    disabled={waitlistStatus === 'loading'}
                  />
                  <button type="submit" disabled={waitlistStatus === 'loading'} className="btn-primary shrink-0 px-5 py-2.5 text-sm">
                    {waitlistStatus === 'loading' ? 'Joining...' : 'Get access'}
                  </button>
                </form>
                {waitlistStatus === 'error' && <p className="text-xs text-rose-500 font-medium mt-2">{waitlistMessage}</p>}
              </>
            )}
          </motion.div>
        </div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 sm:mt-20 max-w-4xl mx-auto"
        >
          <div className="card p-1 rounded-2xl sm:rounded-3xl shadow-2xl shadow-indigo-500/10">
            <div className="rounded-xl sm:rounded-[22px] overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center">
                    <Users size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Investor Panel</p>
                    <p className="text-white/50 text-xs">3 personas active</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400">Live</span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { speaker: "Lead Partner", text: "Walk me through your unit economics at scale." },
                  { speaker: "Analyst", text: "Your CAC assumptions seem aggressive for this market." },
                  { speaker: "Technical", text: "What is your moat once incumbents add this feature?" },
                ].map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.15 }}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 mb-1">{msg.speaker}</p>
                    <p className="text-sm text-white/80">{msg.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Social proof ── */}
      <section id="stories" className="py-16 sm:py-24 border-y border-slate-100 dark:border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Trusted by founders</p>
            <h2 className="section-heading mb-4">Built for teams raising their next round</h2>
            <p className="section-subheading mx-auto">Founders use PitchNest to sharpen their narrative before the meetings that matter.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {startupLogos.map(logo => (
              <span key={logo} className="px-4 py-2 text-xs font-semibold text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800">
                {logo}
              </span>
            ))}
          </div>

          <div className="relative overflow-hidden">
            <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${testimonialIdx * (100 / 3)}%)` }}>
              {testimonials.map(t => (
                <div key={t.name} className="w-full sm:w-1/3 shrink-0 px-2">
                  <div className="card-hover p-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-semibold shrink-0">{t.initials}</div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate">{t.name}</h4>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{t.company}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-3">{[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}</div>
                    <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed mb-4">"{t.quote}"</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 text-xs font-semibold">
                      <TrendingUp className="w-3 h-3" />{t.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setTestimonialIdx(i)} className={cn("h-1.5 rounded-full transition-all duration-300", i === testimonialIdx ? "w-8 gradient-brand" : "w-1.5 bg-slate-300 dark:bg-zinc-700")} aria-label={`Testimonial ${i + 1}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="section-label mb-3">Platform</p>
            <h2 className="section-heading mb-4">Everything you need before the real meeting</h2>
            <p className="section-subheading mx-auto">One platform for practice, feedback, and measurable improvement.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {visibleFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card-hover p-6 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-slate-600 dark:text-zinc-300 group-hover:gradient-brand group-hover:text-white transition-all duration-300">
                  <f.icon size={18} />
                </div>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="lg:hidden flex justify-center mt-8">
            <button onClick={() => setShowAllFeatures(!showAllFeatures)} className="btn-ghost text-sky-600 dark:text-sky-400">
              {showAllFeatures ? 'Show less' : 'Show all features'} <ChevronDown size={16} className={cn(showAllFeatures && 'rotate-180', 'transition-transform')} />
            </button>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-slate-50/80 dark:bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="section-label mb-3">Process</p>
            <h2 className="section-heading">Three steps to investor-ready</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { step: "01", title: "Set up your session", desc: "Upload your deck, choose your panel difficulty, and configure your pitch parameters." },
              { step: "02", title: "Present your pitch", desc: "Deliver via voice or video while the panel analyzes your narrative in real time." },
              { step: "03", title: "Review and improve", desc: "Receive a scored report, session replay, and specific areas to refine." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <span className="text-5xl font-bold gradient-text opacity-30 block mb-4">{item.step}</span>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why PitchNest ── */}
      <section id="why-pitchnest" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="section-label mb-3">Why PitchNest</p>
            <h2 className="section-heading mb-4">Preparation is the advantage</h2>
            <p className="section-subheading mx-auto">Most founders get one shot with each investor. PitchNest makes every session count.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Zap, title: "Immediate feedback", desc: "Structured critiques the moment you finish — no waiting, no guesswork." },
              { icon: Users, title: "Multi-persona panel", desc: "Three investor archetypes that argue, interrupt, and push back like real partners." },
              { icon: ShieldCheck, title: "Safe to fail", desc: "Stumble on hard questions and recover without burning a real relationship." },
              { icon: FileText, title: "Deck-aware", desc: "The panel reads your deck and asks slide-specific questions about your business." },
              { icon: TrendingUp, title: "Track progress", desc: "Every session is scored and saved. Watch your readiness improve over time." },
              { icon: BarChart3, title: "Shareable reports", desc: "Send readiness reports to co-founders, mentors, or your accelerator." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="card-hover p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-slate-600 dark:text-zinc-300">
                  <item.icon size={18} />
                </div>
                <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Analytics preview ── */}
      <section id="insights" className="py-16 sm:py-24 bg-slate-50/80 dark:bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Analytics</p>
            <h2 className="section-heading mb-4">Measure what matters</h2>
            <p className="section-subheading mx-auto">Clear metrics that show exactly where you stand and what to improve next.</p>
          </div>
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            {readinessMetrics.map(m => (
              <div key={m.label} className="card p-5">
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-medium text-slate-700 dark:text-zinc-300">{m.label}</span>
                  <span className="font-semibold gradient-text">{m.pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full gradient-brand"
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
      </section>

      {/* ── Waitlist CTA ── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-xl mx-auto px-5 sm:px-8 text-center">
          <p className="section-label mb-3">Early access</p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">Join the waitlist</h2>
          <p className="section-subheading mx-auto mb-8">Be among the first founders to practice with our investor panel.</p>

          {waitlistStatus === 'success' ? (
            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={18} /> <span className="text-sm font-semibold">You are on the list.</span>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="flex gap-2 max-w-sm mx-auto p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <input type="email" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} placeholder="you@company.com" className="flex-1 min-w-0 bg-transparent border-none text-sm px-3 outline-none" disabled={waitlistStatus === 'loading'} />
              <button type="submit" disabled={waitlistStatus === 'loading'} className="btn-primary shrink-0 px-4 py-2 text-sm">
                {waitlistStatus === 'loading' ? 'Joining...' : 'Join waitlist'}
              </button>
            </form>
          )}
          {waitlistStatus === 'error' && <p className="text-xs text-rose-500 font-medium mt-2">{waitlistMessage}</p>}
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-6">2,847 founders on the waitlist</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-24 border-t border-slate-100 dark:border-zinc-800/60">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12">
            <p className="section-label mb-3">FAQ</p>
            <h2 className="section-heading">Common questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24">
        <div className="gradient-brand rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-semibold mb-4 leading-tight">Ready for your next pitch?</h2>
            <p className="text-base text-white/75 mb-8 leading-relaxed">Do not wait for a real board meeting to find the gaps. Iterate faster, raise with confidence.</p>
            <Link to={isLoggedIn ? "/dashboard" : "/signup"} className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-white/95 transition-all shadow-xl">
              Start pitching now <ArrowRight size={18} />
            </Link>
          </div>
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 dark:border-zinc-800 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className={cn("w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg", footerLogoError && "gradient-brand text-white")}>
                {!footerLogoError ? <img src="/logo.svg" alt="PitchNest" className="w-full h-full object-contain" onError={() => setFooterLogoError(true)} /> : <Rocket size={16} fill="currentColor" />}
              </div>
              <span className="text-base font-semibold">PitchNest</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-5">The practice environment for founders preparing to raise.</p>
            <div className="flex items-center gap-2.5">
              {[
                { href: "https://x.com/PitchNest", label: "X", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                { href: "https://linkedin.com/company/PitchNest", label: "LinkedIn", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                { href: "https://instagram.com/PitchNest", label: "Instagram", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
                { href: "https://wa.me/2349058718400", label: "WhatsApp", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="w-9 h-9 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-600 transition-colors">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-slate-500 dark:text-zinc-400">
              <li><a href="#features" className="hover:text-slate-900 dark:hover:text-zinc-100 transition-colors">Features</a></li>
              <li><a href="#why-pitchnest" className="hover:text-slate-900 dark:hover:text-zinc-100 transition-colors">Why PitchNest</a></li>
              <li><a href="#stories" className="hover:text-slate-900 dark:hover:text-zinc-100 transition-colors">Stories</a></li>
              <li><a href="#faq" className="hover:text-slate-900 dark:hover:text-zinc-100 transition-colors">FAQ</a></li>
              <li><Link to="/login" className="hover:text-slate-900 dark:hover:text-zinc-100 transition-colors">Log in</Link></li>
              <li><Link to="/signup" className="hover:text-slate-900 dark:hover:text-zinc-100 transition-colors">Sign up</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm text-slate-500 dark:text-zinc-400">
              <li><Link to="/privacy" className="hover:text-slate-900 dark:hover:text-zinc-100 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-slate-900 dark:hover:text-zinc-100 transition-colors">Terms of Service</Link></li>
              <li><Link to="/delete-account" className="hover:text-slate-900 dark:hover:text-zinc-100 transition-colors">Delete Account</Link></li>
              <li><Link to="/support" className="hover:text-slate-900 dark:hover:text-zinc-100 transition-colors">Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm text-slate-500 dark:text-zinc-400">
              <li><a href="tel:09058718400" className="hover:text-slate-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2"><Phone size={14} /> 09058718400</a></li>
              <li><a href="mailto:prestonjaysusanto@gmail.com" className="hover:text-slate-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2"><Mail size={14} /> prestonjaysusanto@gmail.com</a></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold text-sm mb-4">Newsletter</h4>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-3">Early access updates.</p>
            <form onSubmit={handleWaitlistSubmit} className="flex gap-2">
              <input type="email" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} placeholder="Email" className="input-field flex-1 py-2 text-sm" disabled={waitlistStatus === 'loading'} />
              <button type="submit" disabled={waitlistStatus === 'loading'} className="btn-primary p-2.5 shrink-0"><ArrowRight size={16} /></button>
            </form>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-12 pt-8 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-400 dark:text-zinc-500">
          <p>&copy; {new Date().getFullYear()} PitchNest. All rights reserved.</p>
          <p>Applying for Y Combinator Winter 2026</p>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left">
        <span className="text-sm sm:text-base font-semibold pr-4">{question}</span>
        <ChevronDown size={18} className={cn("shrink-0 text-slate-400 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-5 pb-5 -mt-1">
          <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

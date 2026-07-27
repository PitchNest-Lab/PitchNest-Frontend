import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlayCircle, ArrowRight, Users, MessageSquare, ShieldCheck, HelpCircle,
  FileText, Target, TrendingUp, ChevronDown, Zap, Phone, Mail, Menu, X,
  Clock, CheckCircle2, Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ThemeToggle } from '../components/ThemeToggle';
import { SmoothScroll } from '../components/landing/SmoothScroll';
import { SectionReveal } from '../components/landing/SectionReveal';
import { HeroWords, heroBlock, heroEase } from '../components/landing/HeroWords';
import { InvestorMarquee } from '../components/landing/InvestorMarquee';
import heroImage from '../assets/heroImage.jpeg';
import { StatsBand } from '../components/landing/StatsBand';
import { LogoLink, LogoMark } from '../components/Logo';

const problems = [
  { icon: Clock, title: "One shot per investor", desc: "Fumble the live Q&A and that lead is gone — you rarely get a second meeting." },
  { icon: MessageSquare, title: "Feedback is vague", desc: "Rejections come back as “not a fit right now,” with nothing on what actually went wrong." },
  { icon: Users, title: "Your circle is too nice", desc: "Friends and co-founders won't grill you the way a real partner will." },
  { icon: HelpCircle, title: "The follow-ups blindside you", desc: "It's not the pitch that's hard — it's the questions on your TAM, unit economics, and moat you didn't see coming." },
];

const solutionPoints = [
  { icon: MessageSquare, title: "A panel that pushes back", desc: "Adaptive follow-up questions based on what you actually say — not a fixed script." },
  { icon: FileText, title: "It reads your deck", desc: "Upload it and the panel asks about your numbers: TAM, unit economics, go-to-market." },
  { icon: Target, title: "An honest score, not a pep talk", desc: "Readiness graded on delivery, clarity, scalability, and overall strength — with concrete fixes." },
];

const roomFeatures = [
  { icon: Users, title: "Live AI investor panel", desc: "Three distinct personas question and debate your pitch in real time. Prefer 1-on-1? Switch to Coach mode." },
  { icon: FileText, title: "Deck-aware Q&A", desc: "Upload your deck and get slide-grounded questions on your TAM, unit economics, and GTM." },
  { icon: Zap, title: "Adaptive follow-ups", desc: "The panel reacts to what you actually say — no two sessions are the same." },
  { icon: Target, title: "Practice any room", desc: "Angel, seed VC, YC-style, PE, or Shark-Tank-style panels — tune the aggressiveness." },
  { icon: PlayCircle, title: "Full replay", desc: "Every session is recorded so you can review exactly where you lost them." },
];

const reportItems = [
  "Verdict + executive summary — invest, watch, or decline, and why, in plain language.",
  "Readiness scorecard — an overall score broken down across delivery, clarity, scalability, and readiness.",
  "Delivery analytics — filler-word %, talk ratio, confidence over time, and how many questions you fielded.",
  "Strengths & critical risks — what landed, and the red flags that will sink you if you don't fix them.",
  "Toughest questions + answer frameworks — the ones you fumbled, with a structure to nail them next time.",
  "Competitive landscape & SWOT — AI-identified competitors and gaps to exploit (estimates labeled as such).",
  "Prioritized action plan + practice drills — ranked fixes to run before your next session.",
  "Progress tracking — scores saved across sessions so you can watch your readiness climb.",
  "Shareable — send the read-only report to co-founders, advisors, or your accelerator.",
];

const reportTags = ["Delivery analytics", "Competitive SWOT", "Action plan", "Practice drills", "Shareable"];

const whyItems = [
  { icon: ShieldCheck, title: "Safe to fail", desc: "Stumble on the hard questions here, not in front of a partner. No relationship burned." },
  { icon: TrendingUp, title: "Reps, not luck", desc: "Investors get one shot at you. You get unlimited shots at getting ready." },
  { icon: Target, title: "A target to beat", desc: "Each report projects your score after the fixes — so every rep has a number to chase." },
  { icon: Zap, title: "Feedback in minutes", desc: "Structured critique the moment you finish. No waiting, no guesswork." },
  { icon: FileText, title: "Deck-aware, not generic", desc: "It interrogates your business, not pitch clichés." },
  { icon: Sparkles, title: "Free in early access", desc: "No card required. Get in before your next raise." },
];

const faqs = [
  { q: "What is PitchNest?", a: "A private rehearsal room where you pitch to an AI investor panel that questions your deck and scores your readiness — so you fix the gaps before real meetings." },
  { q: "How realistic is the panel?", a: "It asks the kinds of pointed, adaptive questions real partners do, and debates your thesis out loud. It's practice — not a prediction of any investor's decision." },
  { q: "Can I upload my pitch deck?", a: "Yes. The panel reads it and asks questions grounded in your slides and numbers." },
  { q: "Does it judge how I look on camera?", a: "Not today. PitchNest analyzes your spoken pitch and your deck. Visual delivery analysis is on our roadmap." },
  { q: "What do I get after a session?", a: "A detailed readiness report — verdict, scorecard, delivery analytics, competitive landscape and SWOT, a prioritized action plan with practice drills, and your projected score if you fix the gaps — plus a replay you can review and share." },
  { q: "Is it free?", a: "Free during early access — no card required. Your scores are saved so you can track improvement across sessions." },
];

const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#your-report", label: "Your report" },
  { href: "#why-pitchnest", label: "Why PitchNest" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => { if (localStorage.getItem('user')) setIsLoggedIn(true); }, []);

  // Pre-warm the Render backend so login/signup don't hit a cold start
  useEffect(() => { fetch('/api/health').catch(() => {}); }, []);

  useEffect(() => {
    const onScroll = (e: Event) => {
      const y = e instanceof CustomEvent ? (e.detail as number) : window.scrollY;
      setNavScrolled(y > 24);
    };
    onScroll(new CustomEvent('init', { detail: window.scrollY }));
    window.addEventListener('lenis-scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('lenis-scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-white dark:bg-[#09090B] font-sans text-slate-900 dark:text-zinc-100 transition-colors duration-300 overflow-x-hidden">

        <div className="fixed inset-0 gradient-mesh pointer-events-none -z-10" />

        {/* ── Navbar ── */}
        <header className={cn('fixed top-0 left-0 right-0 z-50 nav-glass', navScrolled && 'nav-glass-scrolled')}>
          <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex justify-between items-center">
            <LogoLink showText size="md" />

            <div className="hidden md:flex items-center gap-7">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium transition-colors text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                >
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

        <div className="h-[6.75rem]" aria-hidden />

        {isMobileMenuOpen && (
          <div className="md:hidden fixed top-[6.75rem] left-0 right-0 nav-glass z-40 p-5 flex flex-col gap-1 shadow-lg">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-3 text-base font-medium text-slate-600 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800/50"
              >
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
        <section className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-16 sm:pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } } }}>
              <motion.div variants={heroBlock} className="flex justify-center mb-6">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  For founders raising pre-seed to Series A
                </span>
              </motion.div>

              <HeroWords />

              <motion.p variants={heroBlock} className="section-subheading mx-auto mb-10">
                A rehearsal room where you pitch to an AI investor panel that listens, pushes back, and grills your deck — then hands you a scored readiness report showing exactly what to fix. Before the meeting that actually matters.
              </motion.p>

              <motion.div variants={heroBlock} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                <Link to={isLoggedIn ? "/dashboard" : "/signup"} className="btn-primary w-full sm:w-auto px-8 py-3.5 text-base">
                  Start pitching free <ArrowRight size={18} />
                </Link>
                <a href="#how-it-works" className="btn-secondary w-full sm:w-auto px-8 py-3.5 text-base">
                  <PlayCircle size={18} /> See how it works
                </a>
              </motion.div>

              <motion.p variants={heroBlock} className="text-xs text-slate-400 dark:text-zinc-500">
                No credit card · Free while in early access
              </motion.p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.45, ease: heroEase }}
            className="mt-16 sm:mt-20 max-w-4xl mx-auto"
          >
            <div className="card p-1 rounded-2xl sm:rounded-3xl shadow-2xl shadow-indigo-500/10">
              <div className="relative rounded-xl sm:rounded-[22px] overflow-hidden bg-slate-900">
                <img
                  src={heroImage}
                  alt="PitchNest live pitch session with an AI investor panel"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-300">Live</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <InvestorMarquee />
        <StatsBand />

        {/* ── The Problem ── */}
        <section id="problem" className="py-[clamp(44px,5vw,72px)] border-y border-slate-100 dark:border-zinc-800/60 scroll-mt-28">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <SectionReveal className="text-center mb-10 sm:mb-12 max-w-3xl mx-auto">
              <p className="section-label mb-3">The problem</p>
              <h2 className="section-heading mb-4">Most founders find the gaps live — when it's already too late</h2>
              <p className="section-subheading mx-auto">You walk in under-rehearsed, get caught off guard, and burn a lead you can't get back.</p>
            </SectionReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {problems.map((p, i) => (
                <SectionReveal key={p.title} delay={i * 0.06}>
                  <div className="card-hover p-6 h-full">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-4 text-rose-500 dark:text-rose-400">
                      <p.icon size={18} />
                    </div>
                    <h3 className="font-display text-base font-semibold mb-2">{p.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{p.desc}</p>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── The Solution ── */}
        <section id="solution" className="py-[clamp(44px,5vw,72px)] scroll-mt-28">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <SectionReveal className="text-center mb-10 sm:mb-12 max-w-3xl mx-auto">
              <p className="section-label mb-3">The solution</p>
              <h2 className="section-heading mb-4">Get grilled in private, so nothing surprises you in public</h2>
              <p className="section-subheading mx-auto">Pitch out loud to a panel of AI investors — a lead partner, a financial analyst, and a technical partner. They listen, interrupt with hard questions, and debate your thesis. When you're done, you get a structured readiness report with the specific fixes to make before your next real meeting.</p>
            </SectionReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {solutionPoints.map((f, i) => (
                <SectionReveal key={f.title} delay={i * 0.06}>
                  <div className="card-hover p-6 group h-full">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-slate-600 dark:text-zinc-300 group-hover:gradient-brand group-hover:text-white transition-all duration-300">
                      <f.icon size={18} />
                    </div>
                    <h3 className="font-display text-base font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="py-[clamp(44px,5vw,72px)] bg-slate-50/80 dark:bg-zinc-900/30 scroll-mt-28">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <SectionReveal className="text-center mb-10 sm:mb-12">
              <p className="section-label mb-3">How it works</p>
              <h2 className="section-heading">Three steps to investor-ready</h2>
            </SectionReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[
                { step: "01", title: "Set up your session", desc: "Add your startup, pick your investor panel and difficulty, and upload your deck." },
                { step: "02", title: "Pitch out loud", desc: "Present live while the panel listens and fires back questions in real time." },
                { step: "03", title: "Review and fix", desc: "Get your scored readiness report and session replay, then run it again until it's tight." },
              ].map((item, i) => (
                <SectionReveal key={item.step} delay={i * 0.1}>
                  <span className="font-display text-5xl font-bold gradient-text opacity-30 block mb-4">{item.step}</span>
                  <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── In the Room ── */}
        <section id="in-the-room" className="py-[clamp(44px,5vw,72px)] scroll-mt-28">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <SectionReveal className="text-center mb-10 sm:mb-12 max-w-3xl mx-auto">
              <p className="section-label mb-3">In the room</p>
              <h2 className="section-heading mb-4">A panel that actually makes you sweat</h2>
              <p className="section-subheading mx-auto">Three distinct AI investors question and debate your pitch in real time.</p>
            </SectionReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {roomFeatures.map((f, i) => (
                <SectionReveal key={f.title} delay={i * 0.06}>
                  <div className="card-hover p-6 group h-full">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-slate-600 dark:text-zinc-300 group-hover:gradient-brand group-hover:text-white transition-all duration-300">
                      <f.icon size={18} />
                    </div>
                    <h3 className="font-display text-base font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── In Your Report ── */}
        <section id="your-report" className="py-[clamp(44px,5vw,72px)] bg-slate-50/80 dark:bg-zinc-900/30 scroll-mt-28">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <SectionReveal className="text-center mb-10 sm:mb-12 max-w-3xl mx-auto">
              <p className="section-label mb-3">In your report</p>
              <h2 className="section-heading mb-4">Walk away with a battle plan, not just a score</h2>
              <p className="section-subheading mx-auto">The second you finish, PitchNest generates a detailed readiness report — the kind of prep a pitch coach would charge for.</p>
            </SectionReveal>

            <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
              <SectionReveal className="lg:col-span-2">
                <div className="card p-7 sm:p-8 lg:sticky lg:top-28">
                  <p className="section-label mb-4 flex items-center gap-2"><TrendingUp size={14} /> If you pitched again today</p>
                  <div className="flex items-end gap-3 mb-4">
                    <span className="font-display text-4xl sm:text-5xl font-bold text-slate-400 dark:text-zinc-600 line-through decoration-2">46</span>
                    <ArrowRight className="mb-2 text-slate-400 dark:text-zinc-500" size={26} />
                    <span className="font-display text-5xl sm:text-6xl font-bold gradient-text leading-none">78</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Every report projects your score once you fix the flagged gaps — so you know exactly what's on the table, and each rep has a number to chase.
                  </p>
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap gap-2">
                    {reportTags.map((t) => (
                      <span key={t} className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-xs font-medium text-slate-600 dark:text-zinc-300">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </SectionReveal>

              <SectionReveal delay={0.08} className="lg:col-span-3">
                <div className="card p-7 sm:p-8">
                  <h3 className="font-display text-lg font-semibold mb-5">What's inside every report</h3>
                  <ul className="space-y-4">
                    {reportItems.map((item) => {
                      const idx = item.indexOf(' — ');
                      const lead = idx === -1 ? item : item.slice(0, idx);
                      const rest = idx === -1 ? '' : item.slice(idx + 3);
                      return (
                        <li key={item} className="flex gap-3">
                          <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-indigo-500 dark:text-indigo-400" />
                          <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                            <span className="font-semibold text-slate-800 dark:text-zinc-100">{lead}</span>
                            {rest && <> — {rest}</>}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </SectionReveal>
            </div>
          </div>
        </section>

        {/* ── Why PitchNest ── */}
        <section id="why-pitchnest" className="py-[clamp(44px,5vw,72px)] scroll-mt-28">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <SectionReveal className="text-center mb-10 sm:mb-12 max-w-3xl mx-auto">
              <p className="section-label mb-3">Why PitchNest</p>
              <h2 className="section-heading mb-4">Preparation is the one variable you control</h2>
              <p className="section-subheading mx-auto">Investors get one shot at you. PitchNest makes sure you've already had a hundred.</p>
            </SectionReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {whyItems.map((item, i) => (
                <SectionReveal key={item.title} delay={i * 0.05}>
                  <div className="card-hover p-6 h-full">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-slate-600 dark:text-zinc-300">
                      <item.icon size={18} />
                    </div>
                    <h3 className="font-display text-base font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Early Access (honest — no fabricated testimonials) ── */}
        <section id="early-access" className="py-[clamp(44px,5vw,72px)] bg-slate-50/80 dark:bg-zinc-900/30 scroll-mt-28">
          <div className="max-w-4xl mx-auto px-5 sm:px-8">
            <SectionReveal>
              <div className="card p-8 sm:p-14 text-center relative overflow-hidden">
                <div className="relative z-10">
                  <p className="section-label mb-3">Early access</p>
                  <h2 className="section-heading mb-4">Be one of the first founders in the Nest</h2>
                  <p className="section-subheading mx-auto mb-8">
                    PitchNest is in early access and free while we build. Get in now, run unlimited practice sessions, and help shape the panel that will grill the next generation of founders.
                  </p>
                  <Link to={isLoggedIn ? "/dashboard" : "/signup"} className="btn-primary inline-flex px-8 py-3.5 text-base">
                    Claim your early-access spot <ArrowRight size={18} />
                  </Link>
                </div>
                <div className="absolute -top-24 -right-16 w-56 h-56 gradient-brand opacity-10 rounded-full blur-3xl pointer-events-none" />
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-[clamp(44px,5vw,72px)] border-t border-slate-100 dark:border-zinc-800/60 scroll-mt-28">
          <div className="max-w-3xl mx-auto px-5 sm:px-8">
            <SectionReveal className="text-center mb-12">
              <p className="section-label mb-3">FAQ</p>
              <h2 className="section-heading">Common questions</h2>
            </SectionReveal>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <SectionReveal key={i} delay={i * 0.04}>
                  <FAQItem question={faq.q} answer={faq.a} />
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
          <SectionReveal>
            <div className="gradient-brand rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden">
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="font-display text-2xl sm:text-4xl font-semibold mb-4 leading-tight">Ready for your next pitch?</h2>
                <p className="text-base text-white/75 mb-8 leading-relaxed">Don't find the gaps in a real board meeting. Rehearse, get scored, and walk in with confidence.</p>
                <Link to={isLoggedIn ? "/dashboard" : "/signup"} className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-white/95 transition-all shadow-xl">
                  Start pitching now — free <ArrowRight size={18} />
                </Link>
              </div>
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            </div>
          </SectionReveal>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-slate-50 dark:bg-zinc-900/50 py-12 sm:py-20 border-t border-slate-200 dark:border-zinc-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <LogoMark size="xs" />
                <span className="text-base font-bold">PitchNest</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">Rehearse your raise with an AI investor panel — and walk in ready.</p>
              <div className="flex items-center gap-3">
                <a href="https://facebook.com/pitchnestapp" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors" aria-label="Facebook">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="https://instagram.com/pitchnestapp" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-pink-500 hover:border-pink-300 dark:hover:border-pink-500 transition-colors" aria-label="Instagram">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                </a>
                <a href="https://x.com/pitchnestapp" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-sky-500 hover:border-sky-300 dark:hover:border-sky-500 transition-colors" aria-label="X (Twitter)">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href="https://wa.me/2349058718400" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-green-500 hover:border-green-300 dark:hover:border-green-500 transition-colors" aria-label="WhatsApp">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-3 sm:mb-6 text-sm">Platform</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                <li><a href="#how-it-works" className="hover:text-sky-600 dark:hover:text-sky-400">How it works</a></li>
                <li><a href="#your-report" className="hover:text-sky-600 dark:hover:text-sky-400">Your report</a></li>
                <li><a href="#why-pitchnest" className="hover:text-sky-600 dark:hover:text-sky-400">Why PitchNest</a></li>
                <li><a href="#faq" className="hover:text-sky-600 dark:hover:text-sky-400">FAQ</a></li>
                <li><Link to="/login" className="hover:text-sky-600 dark:hover:text-sky-400">Login</Link></li>
                <li><Link to="/signup" className="hover:text-sky-600 dark:hover:text-sky-400">Sign Up</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-3 sm:mb-6 text-sm">Legal</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                <li><Link to="/privacy" className="hover:text-sky-600 dark:hover:text-sky-400">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-sky-600 dark:hover:text-sky-400">Terms of Service</Link></li>
                <li><Link to="/delete-account" className="hover:text-sky-600 dark:hover:text-sky-400">Delete Account</Link></li>
                <li><Link to="/support" className="hover:text-sky-600 dark:hover:text-sky-400">Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-3 sm:mb-6 text-sm">Get in Touch</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                <li><a href="tel:09058718400" className="hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-2"><Phone size={14} className="shrink-0" /> 09058718400</a></li>
                <li><a href="mailto:pitchnestapp@gmail.com" className="hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-2"><Mail size={14} className="shrink-0" /> pitchnestapp@gmail.com</a></li>
                <li><a href="https://wa.me/2349058718400" target="_blank" rel="noreferrer" className="hover:text-green-500 flex items-center gap-2"><svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg> WhatsApp</a></li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h4 className="font-bold mb-3 sm:mb-6 text-sm">Get Started</h4>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mb-3">Practice your pitch with an AI investor panel today.</p>
              <Link to="/signup" className="btn-primary inline-flex text-xs sm:text-sm px-4 py-2">
                Start pitching <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 sm:mt-16 pt-6 sm:pt-8 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500">
            <p>&copy; {new Date().getFullYear()} PitchNest AI. All rights reserved.</p>
            <p>Applying for Y Combinator Winter 2026</p>
          </div>
        </footer>
      </div>
    </SmoothScroll>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left">
        <span className="font-display text-sm sm:text-base font-semibold pr-4">{question}</span>
        <ChevronDown size={18} className={cn("shrink-0 text-slate-400 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.35, ease: heroEase }}
          className="px-5 pb-5 -mt-1 overflow-hidden"
        >
          <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{answer}</p>
        </motion.div>
      )}
    </div>
  );
}

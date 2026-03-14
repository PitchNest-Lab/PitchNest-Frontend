import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, PlayCircle, ArrowRight, Users, MessageSquare, BarChart3, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ThemeToggle } from '../components/ThemeToggle';

export default function LandingPage() {
  const [logoError, setLogoError] = React.useState(false);
  const [footerLogoError, setFooterLogoError] = React.useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl",
            logoError && "bg-sky-500 text-white shadow-lg shadow-sky-200"
          )}>
            {!logoError ? (
              <img 
                src="/PitchNest Logo.png" 
                alt="PitchNest Logo" 
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Rocket size={24} fill="currentColor" />
            )}
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">PitchNest</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-zinc-400">
          <a href="#features" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link to="/login" className="text-sm font-bold text-slate-900 dark:text-zinc-100 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">Login</Link>
          <Link to="/signup" className="px-5 py-2.5 bg-sky-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-sky-200 dark:shadow-sky-500/20 hover:bg-sky-600 transition-all">
            Start Pitching
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
            Live AI Simulation
          </div>
          <h1 className="text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-8 text-slate-900 dark:text-zinc-100">
            Pitch Your Startup to an <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">AI Investor Panel</span>
          </h1>
          <p className="text-xl text-slate-500 dark:text-zinc-400 leading-relaxed mb-10 max-w-xl">
            Present your vision to a panel of AI investors that listen, ask questions, and debate your idea in real-time.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/signup" className="px-8 py-4 bg-sky-500 text-white font-bold rounded-xl shadow-xl shadow-sky-200 dark:shadow-sky-500/20 hover:bg-sky-600 transition-all flex items-center gap-2">
              Start Pitch
            </Link>
            <button className="px-8 py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2">
              <PlayCircle size={20} />
              Watch Demo
            </button>
          </div>
          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <img key={i} src={`https://picsum.photos/seed/user${i}/100/100`} className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-800" referrerPolicy="no-referrer" />
              ))}
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">Trusted by 500+ startup founders worldwide</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-indigo-200 dark:shadow-sky-500/10 border-8 border-slate-900/5 dark:border-white/5">
            <img 
              src="https://picsum.photos/seed/pitch/1200/800" 
              alt="AI Panel" 
              className="w-full aspect-[4/3] object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-8">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl w-full">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center">
                      <Users size={20} className="text-slate-900 dark:text-zinc-100" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">AI Investor Panel</p>
                      <p className="text-white/70 text-xs">Simulating 3 distinct personas</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-1 h-4 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-6 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-3 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
        </motion.div>
      </section>

      {/* Capabilities Section */}
      <section id="features" className="bg-slate-50 dark:bg-zinc-900/50 py-32 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-sky-600 dark:text-sky-400 font-bold text-xs uppercase tracking-widest">Capabilities</span>
            <h2 className="text-4xl font-bold mt-4 mb-6 text-slate-900 dark:text-zinc-100">Experience the future of fundraising</h2>
            <p className="text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto text-lg">
              Our advanced AI models simulate real investor behavior, giving you the ultimate edge in your fundraising journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: "Live AI Panel Discussion",
                desc: "Watch as multiple AI personas with distinct investment styles debate your business model in real-time.",
                color: "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400"
              },
              {
                icon: BarChart3,
                title: "Real-Time Pitch Feedback",
                desc: "Receive instant analysis on your pitch deck, delivery, and financial projections with granular scoring.",
                color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
              },
              {
                icon: ShieldCheck,
                title: "Investor Simulation",
                desc: "Prepare for the toughest questions with realistic Q&A sessions designed to stress-test your strategy.",
                color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-zinc-900 p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800 transition-colors"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8", feature.color)}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-zinc-100">{feature.title}</h3>
                <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section id="how-it-works" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-6 text-slate-900 dark:text-zinc-100">Master your pitch in 3 steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-16 relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-px bg-slate-200 dark:bg-zinc-800 -z-10" />
            
            {[
              { step: 1, title: "Start a pitch session", desc: "Upload your deck and select your AI investor panel difficulty level." },
              { step: 2, title: "Present your idea", desc: "Present via voice or video. Our AI analyzes your narrative and body language." },
              { step: 3, title: "Get AI investor feedback", desc: "Receive a comprehensive report with scores and a recording of the debate." }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 bg-white dark:bg-zinc-900 border-2 border-sky-500 text-sky-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-8 shadow-lg shadow-sky-100 dark:shadow-sky-500/10">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-zinc-100">{item.title}</h3>
                <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="bg-gradient-to-br from-indigo-600 to-sky-500 rounded-[40px] p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-sky-500/20">
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-5xl font-bold mb-8 leading-tight">Ready to face the panel? Start your first pitch today.</h2>
            <p className="text-xl text-white/80 mb-12">Don't wait for a real board meeting to find the flaws in your pitch. Iterate faster with PitchNest.</p>
            <Link to="/signup" className="px-10 py-5 bg-white text-sky-600 font-bold rounded-2xl shadow-2xl hover:bg-sky-50 transition-all inline-flex items-center gap-2">
              Start Pitching Now
            </Link>
          </div>
          {/* Decorative circles */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-zinc-900/50 py-20 border-t border-slate-200 dark:border-zinc-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className={cn(
                "w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg",
                footerLogoError && "bg-sky-500 text-white"
              )}>
                {!footerLogoError ? (
                  <img 
                    src="/PitchNest Logo.png" 
                    alt="PitchNest Logo" 
                    className="w-full h-full object-contain"
                    onError={() => setFooterLogoError(true)}
                  />
                ) : (
                  <Rocket size={20} fill="currentColor" />
                )}
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100">PitchNest</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              The ultimate AI-powered playground for founders to perfect their pitch and secure investment.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-slate-900 dark:text-zinc-100">Platform</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-zinc-400">
              <li><a href="#" className="hover:text-sky-600 dark:hover:text-sky-400">About Us</a></li>
              <li><a href="#" className="hover:text-sky-600 dark:hover:text-sky-400">Features</a></li>
              <li><a href="#" className="hover:text-sky-600 dark:hover:text-sky-400">Success Stories</a></li>
              <li><a href="#" className="hover:text-sky-600 dark:hover:text-sky-400">Career</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-slate-900 dark:text-zinc-100">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-zinc-400">
              <li><a href="#" className="hover:text-sky-600 dark:hover:text-sky-400">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-sky-600 dark:hover:text-sky-400">Terms of Service</a></li>
              <li><a href="#" className="hover:text-sky-600 dark:hover:text-sky-400">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-sky-600 dark:hover:text-sky-400">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-slate-900 dark:text-zinc-100">Newsletter</h4>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">Get the latest pitch tips and AI updates.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:text-zinc-100" />
              <button className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center text-xs text-slate-400 dark:text-zinc-500">
          <p>© 2024 PitchNest AI. All rights reserved.</p>
          <p>Built with passion for the startup ecosystem.</p>
        </div>
      </footer>
    </div>
  );
}

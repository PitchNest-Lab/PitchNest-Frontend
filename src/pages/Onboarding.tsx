import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Target, Users, TrendingUp, ChevronRight, CheckCircle2, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    startupName: '',
    industry: '',
    goal: ''
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    localStorage.setItem('pitchnest_onboarding_complete', 'true');
    localStorage.setItem('pitchnest_startup_name', formData.startupName || "My Startup");
    
    navigate('/dashboard');
  };

  // ✅ FIX: Added Skip Onboarding function
  const handleSkip = () => {
    localStorage.setItem('pitchnest_onboarding_complete', 'true');
    localStorage.setItem('pitchnest_startup_name', "My Startup");
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 font-sans transition-colors duration-300 relative">
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[800px] h-[800px] bg-sky-500/10 rounded-full blur-[120px] opacity-50" />
      </div>

      {/* ✅ FIX: Skip Button */}
      <button 
        onClick={handleSkip} 
        className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-bold transition-colors z-20"
      >
        Skip Onboarding
      </button>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo Header */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/30">
              <Rocket size={24} fill="currentColor" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">PitchNest</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8 max-w-sm mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-800">
              <div 
                className={cn("h-full bg-sky-500 transition-all duration-500", step >= i ? "w-full" : "w-0")}
              />
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[40px] p-8 md:p-12 shadow-2xl shadow-slate-200 dark:shadow-none overflow-hidden relative min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Welcome */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-3">
                    Welcome aboard, {user?.name?.split(' ')[0] || 'Founder'}! 👋
                  </h2>
                  <p className="text-slate-500 dark:text-zinc-400 text-lg mb-8 leading-relaxed">
                    Let's get your AI environment set up. What is the name of the startup or project you are pitching?
                  </p>
                  
                  <div className="relative">
                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      autoFocus
                      value={formData.startupName}
                      onChange={(e) => setFormData({...formData, startupName: e.target.value})}
                      placeholder="e.g. EcoStream SaaS" 
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-zinc-800/50 border-2 border-slate-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-zinc-900 transition-all dark:text-zinc-100 text-lg font-medium"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={handleNext} 
                    disabled={!formData.startupName.trim()}
                    className="px-8 py-4 bg-sky-500 text-white font-bold rounded-2xl hover:bg-sky-600 transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Industry */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-3">Select your Industry</h2>
                  <p className="text-slate-500 dark:text-zinc-400 text-lg mb-8 leading-relaxed">
                    This helps our AI Panel ask the right technical and market-sizing questions.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['SaaS & Enterprise', 'Fintech', 'Healthtech', 'Consumer & E-Commerce'].map((ind) => (
                      <button
                        key={ind}
                        onClick={() => setFormData({...formData, industry: ind})}
                        className={cn(
                          "p-5 rounded-2xl border-2 text-left transition-all font-bold",
                          formData.industry === ind 
                            ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400" 
                            : "border-slate-100 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-600 dark:text-zinc-300"
                        )}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(1)} className="px-6 py-4 text-slate-500 font-bold hover:text-slate-800 dark:hover:text-white transition-colors">
                    Back
                  </button>
                  <button 
                    onClick={handleNext} 
                    disabled={!formData.industry}
                    className="px-8 py-4 bg-sky-500 text-white font-bold rounded-2xl hover:bg-sky-600 transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Goals */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex-1 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-3">What is your primary goal?</h2>
                  <p className="text-slate-500 dark:text-zinc-400 text-lg mb-8 leading-relaxed">
                    We'll tailor your dashboard analytics based on what matters most to you right now.
                  </p>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'funding', title: 'Raise Funding', desc: 'I am preparing for an upcoming Seed or Series A round.', icon: Target },
                      { id: 'practice', title: 'General Practice', desc: 'I just want to improve my public speaking and delivery.', icon: Users },
                      { id: 'deck', title: 'Refine Pitch Deck', desc: 'I need AI feedback on my slide structure and content.', icon: TrendingUp },
                    ].map((goal) => (
                      <button
                        key={goal.id}
                        onClick={() => setFormData({...formData, goal: goal.id})}
                        className={cn(
                          "w-full p-5 rounded-2xl border-2 flex items-center gap-5 transition-all text-left group",
                          formData.goal === goal.id 
                            ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10" 
                            : "border-slate-100 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          formData.goal === goal.id ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                        )}>
                          <goal.icon size={20} />
                        </div>
                        <div>
                          <h4 className={cn("font-bold text-base mb-1", formData.goal === goal.id ? "text-sky-700 dark:text-sky-400" : "text-slate-900 dark:text-zinc-100")}>
                            {goal.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-400">{goal.desc}</p>
                        </div>
                        {formData.goal === goal.id && <CheckCircle2 className="ml-auto text-sky-500" size={24} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(2)} className="px-6 py-4 text-slate-500 font-bold hover:text-slate-800 dark:hover:text-white transition-colors">
                    Back
                  </button>
                  <button 
                    onClick={handleFinish} 
                    disabled={!formData.goal || isSubmitting}
                    className="px-8 py-4 bg-sky-500 text-white font-bold rounded-2xl hover:bg-sky-600 transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Setting up..." : "Enter Workspace"}
                    {!isSubmitting && <Rocket size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
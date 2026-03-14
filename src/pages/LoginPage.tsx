import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Rocket, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&w=800&q=80",
    title: "The AI Pitch Deck Evolution",
    desc: "Join 10,000+ founders using PitchNest to refine their narratives with real-time AI feedback."
  },
  {
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
    title: "Nail Your Delivery",
    desc: "Practice with multimodal AI investors that simulate high-pressure venture capital environments."
  },
  {
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
    title: "Actionable Insights",
    desc: "Get deep analytics on your pacing, clarity, and scalability after every single session."
  }
];

export default function LoginPage() {
  const [logoError, setLogoError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setServerError("");
    try {
      // 🛑 FIX: NUKE LOCAL STORAGE BEFORE LOGGING IN
      localStorage.clear();

      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error: any) {
      setServerError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6 font-sans transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1000px] bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl shadow-slate-200 dark:shadow-black/20 overflow-hidden flex flex-col lg:flex-row transition-colors"
      >
        <div className="flex-1 p-8 md:p-16">
          <div className="flex items-center gap-3 mb-12">
            <div className={cn("w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl", logoError && "bg-sky-500 text-white shadow-lg shadow-sky-200")}>
              {!logoError ? <img src="/PitchNest Logo.png" alt="Logo" className="w-full h-full object-contain" onError={() => setLogoError(true)} /> : <Rocket size={24} fill="currentColor" />}
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">PitchNest</span>
          </div>

          <h2 className="text-4xl font-bold text-slate-900 dark:text-zinc-100 mb-2">Welcome Back</h2>
          <p className="text-slate-500 dark:text-zinc-500 mb-10">Log in to your AI-powered workspace</p>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {serverError && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-sm font-bold">{serverError}</div>}

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
                <input {...register('email')} type="email" placeholder="you@startup.com" className={cn("w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-zinc-800 border rounded-2xl focus:outline-none focus:ring-2 transition-all dark:text-zinc-100", errors.email ? "border-rose-500 focus:ring-rose-500/20" : "border-slate-200 dark:border-zinc-700 focus:ring-sky-500/20")} />
              </div>
              {errors.email && <p className="text-xs font-bold text-rose-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">Password</label>
                <a href="#" className="text-xs font-bold text-sky-500 hover:text-sky-600">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
                <input {...register('password')} type={showPassword ? "text" : "password"} placeholder="••••••••" className={cn("w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-zinc-800 border rounded-2xl focus:outline-none focus:ring-2 transition-all dark:text-zinc-100", errors.password ? "border-rose-500 focus:ring-rose-500/20" : "border-slate-200 dark:border-zinc-700 focus:ring-sky-500/20")} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              {errors.password && <p className="text-xs font-bold text-rose-500">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-sky-500 text-white font-bold rounded-2xl shadow-xl hover:bg-sky-600 transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Login <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-zinc-800"></div></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-zinc-500"><span className="bg-white dark:bg-zinc-900 px-4">Or continue with</span></div>
          </div>
          <button className="w-full py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>

          <p className="text-center mt-10 text-sm text-slate-500 dark:text-zinc-500">
            Don't have an account? <Link to="/signup" className="text-sky-500 font-bold hover:text-sky-600">Sign up</Link>
          </p>
        </div>

        {/* Right Side: Image Carousel */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-sky-100 to-indigo-50 dark:from-zinc-800 dark:to-zinc-900 items-center justify-center p-16 relative overflow-hidden">
          <div className="relative z-10 text-center max-w-sm">
            <div className="rounded-[40px] overflow-hidden shadow-2xl shadow-sky-200 dark:shadow-black/20 border-8 border-white dark:border-zinc-900 mb-8 relative aspect-[3/4]">
              {SLIDES.map((slide, i) => (
                <img 
                  key={i} src={slide.image} alt="Slide" referrerPolicy="no-referrer"
                  className={cn("absolute inset-0 w-full h-full object-cover transition-opacity duration-1000", i === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0")}
                />
              ))}
            </div>
            <div className="h-24">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-3">{SLIDES[currentSlide].title}</h3>
              <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">{SLIDES[currentSlide].desc}</p>
            </div>
            <div className="mt-8 flex justify-center gap-2">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)} className={cn("h-2 rounded-full transition-all", i === currentSlide ? "w-6 bg-sky-500" : "w-2 bg-sky-200 dark:bg-zinc-700 hover:bg-sky-300")} />
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
        </div>
      </motion.div>
    </div>
  );
}
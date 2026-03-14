import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Mail, Lock, User, ArrowRight, ChevronDown, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  role: z.enum(['Founder', 'Investor', 'Advisor']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

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

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % SLIDES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'Founder' }
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    setServerError("");
    try {
      // 🛑 FIX: NUKE LOCAL STORAGE BEFORE SIGNING UP TO PREVENT DATA BLEED
      localStorage.clear(); 
      
      await signup(data.name, data.email, data.password);
      navigate('/onboarding');
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
        <div className="flex-1 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-200">
              <Rocket size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">PitchNest</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-2">Create your account</h2>
          <p className="text-slate-500 dark:text-zinc-500 mb-8 text-sm">Join the future of AI-driven startup pitching.</p>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {serverError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-bold">{serverError}</div>}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input {...register('name')} type="text" placeholder="Emmanuel Etim" className={cn("w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border rounded-xl focus:outline-none focus:ring-2 transition-all dark:text-zinc-100 text-sm", errors.name ? "border-rose-500" : "border-slate-200 dark:border-zinc-700 focus:border-sky-500")} />
              </div>
              {errors.name && <p className="text-xs font-bold text-rose-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input {...register('email')} type="email" placeholder="you@startup.com" className={cn("w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border rounded-xl focus:outline-none focus:ring-2 transition-all dark:text-zinc-100 text-sm", errors.email ? "border-rose-500" : "border-slate-200 dark:border-zinc-700 focus:border-sky-500")} />
              </div>
              {errors.email && <p className="text-xs font-bold text-rose-500">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input {...register('password')} type={showPassword ? "text" : "password"} placeholder="••••••••" className={cn("w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-zinc-800 border rounded-xl focus:outline-none focus:ring-2 transition-all dark:text-zinc-100 text-sm", errors.password ? "border-rose-500" : "border-slate-200 dark:border-zinc-700 focus:border-sky-500")} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input {...register('confirmPassword')} type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" className={cn("w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-zinc-800 border rounded-xl focus:outline-none focus:ring-2 transition-all dark:text-zinc-100 text-sm", errors.confirmPassword ? "border-rose-500" : "border-slate-200 dark:border-zinc-700 focus:border-sky-500")} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">I am a...</label>
              <div className="relative">
                <select {...register('role')} className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:border-sky-500 transition-all appearance-none cursor-pointer dark:text-zinc-100 text-sm">
                  <option value="Founder">Founder</option>
                  <option value="Investor">Investor</option>
                  <option value="Advisor">Advisor</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-sky-500 text-white text-sm font-bold rounded-xl shadow-xl hover:bg-sky-600 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 mt-4">
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <>Create Account <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>

          <p className="text-center mt-6 text-xs text-slate-500 dark:text-zinc-500">
            Already have an account? <Link to="/login" className="text-sky-500 font-bold hover:text-sky-600">Log in</Link>
          </p>
        </div>

        {/* Right Side Carousel */}
        <div className="hidden lg:flex flex-1 bg-sky-50 dark:bg-zinc-800 flex-col items-center justify-center p-12 relative overflow-hidden">
          <div className="relative z-10 w-full max-w-sm">
            <div className="rounded-[32px] overflow-hidden shadow-2xl border-8 border-white dark:border-zinc-900 mb-8 relative aspect-[4/5] bg-slate-100">
              <div 
                className="flex w-full h-full transition-transform duration-700 ease-in-out" 
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {SLIDES.map((slide, i) => (
                  <div key={i} className="min-w-full h-full shrink-0">
                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="h-24 text-center">
              <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100 mb-2 transition-all duration-300">{SLIDES[currentSlide].title}</h3>
              <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed transition-all duration-300">{SLIDES[currentSlide].desc}</p>
            </div>

            <div className="mt-4 flex justify-center gap-2">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)} className={cn("h-2 rounded-full transition-all duration-300", i === currentSlide ? "w-8 bg-sky-500" : "w-2 bg-sky-200 dark:bg-zinc-700 hover:bg-sky-300")} />
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
        </div>
      </motion.div>
    </div>
  );
}
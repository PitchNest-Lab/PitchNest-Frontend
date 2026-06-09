import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, Target, User, Upload, FileText, Camera, Mic, CheckCircle2,
  PlayCircle, Clock, Loader2, Monitor, Briefcase, AlignLeft
} from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from '../components/Skeleton';
import { useScreenCapture } from '../hooks/useScreenCapture';

const setupSchema = z.object({
  mode: z.enum(['panel', 'coach', 'solo']),
  businessName: z.string().min(2, 'Required'),
  description: z.string().min(10, 'Min 10 chars'),
  industry: z.string().min(1, 'Required'),
  investorArchetype: z.string().min(1, 'Required'),
  aggressiveness: z.number().min(0).max(100),
  riskAppetite: z.number().min(0).max(100),
  cameraEnabled: z.boolean(),
  micEnabled: z.boolean(),
  screenShareEnabled: z.boolean(),
});

type SetupFormValues = z.infer<typeof setupSchema>;

const ModeCard = ({ title, icon: Icon, active, onClick }: { title: string, icon: any, active: boolean, onClick: () => void }) => (
  <button 
    type="button" onClick={onClick}
    className={cn(
      "flex-1 p-3 sm:p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 text-center group h-20 sm:h-24 relative",
      active ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10 shadow-sm" : "border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
    )}
  >
    <Icon size={18} className={active ? "text-sky-500" : "text-slate-400 dark:text-zinc-500"} />
    <span className={cn("text-[10px] sm:text-[11px] font-bold uppercase tracking-wider", active ? "text-sky-900 dark:text-sky-400" : "text-slate-600 dark:text-zinc-400")}>{title}</span>
    {active && <CheckCircle2 size={12} className="absolute top-2 right-2 text-sky-500" />}
  </button>
);

export default function PrePitchSetup() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDecks, setAvailableDecks] = useState<any[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<any>(null);
  const deckFileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadDeck = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tempId = 'temp-' + Date.now();
    const tempDeck = {
      id: tempId,
      name: file.name.replace(/\.[^/.]+$/, ""),
      size: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
      status: "DRAFT"
    };

    setAvailableDecks(prev => [tempDeck, ...prev]);
    setSelectedDeck(tempDeck);

    const formData = new FormData();
    formData.append('deck', file);

    try {
      const res = await authFetch('/api/upload-deck', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      const savedDeck = await res.json();

      setAvailableDecks(prev => 
        prev.map(d => d.id === tempId ? {
          ...savedDeck,
          image: `https://api.dicebear.com/9.x/shapes/svg?seed=${savedDeck.id}&backgroundColor=0ea5e9,4f46e5,0f172a`
        } : d)
      );
      setSelectedDeck(savedDeck);
    } catch (err) {
      console.error("Failed to upload deck:", err);
      alert("Failed to upload pitch deck. Please try again.");
      setAvailableDecks(prev => prev.filter(d => d.id !== tempId));
      setSelectedDeck(null);
    }
  };

  const { isCapturing, startCapture, stopCapture } = useScreenCapture((frame, index) => {});

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      mode: 'panel', 
      // 🔥 FIX 1: Frictionless defaults so judges don't get stuck on validation
      businessName: 'My Startup', 
      description: 'We are building the next generation of AI tools for enterprise.', 
      industry: 'SaaS & Enterprise',
      investorArchetype: 'Seed Stage - Venture Capital', 
      aggressiveness: 60, 
      riskAppetite: 75,
      cameraEnabled: true, 
      micEnabled: true, 
      screenShareEnabled: false,
    }
  });

  const currentMode = watch('mode');
  const cameraEnabled = watch('cameraEnabled');
  const micEnabled = watch('micEnabled');
  const screenShareEnabled = watch('screenShareEnabled');
  const canScreenShare = typeof navigator?.mediaDevices?.getDisplayMedia === 'function';
  const aggressiveness = watch('aggressiveness');
  const riskAppetite = watch('riskAppetite');

  const preSelectedDeckName = location.state?.preSelectedDeck;

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const res = await authFetch('/api/decks');
        if (res.ok) {
          const data = await res.json();
          setAvailableDecks(data);
          if (preSelectedDeckName) setSelectedDeck(data.find((d: any) => d.name === preSelectedDeckName) || data[0]);
          else if (data.length > 0) setSelectedDeck(data[0]); 
        }
      } catch (err) {} finally { setIsLoading(false); }
    };
    fetchDecks();
  }, [preSelectedDeckName]);

  const toggleScreenShare = async (checked: boolean) => {
    if (checked) {
      const stream = await startCapture();
      setValue('screenShareEnabled', !!stream);
    } else {
      stopCapture();
      setValue('screenShareEnabled', false);
    }
  };

  const onSubmit = async (data: SetupFormValues) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    navigate('/room', { state: { pitchConfig: { ...data, selectedDeck } } });
  };

  return (
    <div className="max-w-6xl mx-auto min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] flex flex-col lg:overflow-hidden pb-6 md:pb-10 px-4 lg:px-0">
      <div className="flex items-center justify-between shrink-0 mb-6 mt-2 lg:mt-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-zinc-100">Pre-Pitch Configuration</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg text-xs font-bold text-slate-500">
          <Clock size={14} /> 15 Min Session
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-0 pb-16 lg:pb-0">
        
        {/* LEFT COLUMN: Setup */}
        <div className="lg:col-span-8 flex flex-col gap-6 lg:overflow-y-auto pr-0 lg:pr-2 custom-scrollbar">
          
          <div className="flex gap-2 sm:gap-4 shrink-0">
            <ModeCard title="AI Panel" icon={Users} active={currentMode === 'panel'} onClick={() => setValue('mode', 'panel')} />
            <ModeCard title="Coach" icon={Target} active={currentMode === 'coach'} onClick={() => setValue('mode', 'coach')} />
            <ModeCard title="Solo" icon={User} active={currentMode === 'solo'} onClick={() => setValue('mode', 'solo')} />
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-[24px] border border-slate-200 dark:border-zinc-800 shadow-sm shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-1">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5"><Briefcase size={14} className="text-sky-500"/> Startup Name</label>
                  {errors.businessName && <span className="text-[10px] text-rose-500 font-bold">{errors.businessName.message}</span>}
                </div>
                <input {...register('businessName')} type="text" placeholder="e.g. PitchNest AI" className={cn("w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border rounded-xl focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:text-zinc-100", errors.businessName && "border-rose-300 focus:ring-rose-500/20")} />
              </div>
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5"><AlignLeft size={14} className="text-sky-500"/> Industry & Persona</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select {...register('industry')} className="w-full sm:flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border rounded-xl dark:border-zinc-700 text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20">
                    <option value="SaaS & Enterprise">SaaS & Enterprise</option>
                    <option value="Fintech">Fintech</option>
                    <option value="Healthtech">Healthtech</option>
                    <option value="Consumer Social & Media">Consumer Social & Media</option>
                    <option value="E-commerce & Retail">E-commerce & Retail</option>
                    <option value="Artificial Intelligence & ML">Artificial Intelligence & ML</option>
                    <option value="CleanTech & Sustainability">CleanTech & Sustainability</option>
                    <option value="Biotech & Life Sciences">Biotech & Life Sciences</option>
                    <option value="DeepTech & Aerospace">DeepTech & Aerospace</option>
                    <option value="EdTech">EdTech</option>
                    <option value="Crypto & Web3">Crypto & Web3</option>
                    <option value="Hardware / IoT">Hardware / IoT</option>
                    <option value="Logistics & PropTech">Logistics & PropTech</option>
                  </select>
                  <select {...register('investorArchetype')} className="w-full sm:flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border rounded-xl dark:border-zinc-700 text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20">
                    <option value="Seed Stage - Venture Capital">Seed VC</option>
                    <option value="Angel Investor Group">Angel Group</option>
                    <option value="Growth Stage - Venture Capital">Growth Fund</option>
                    <option value="Shark Tank Judge">Shark Tank Judge</option>
                    <option value="Private Equity">Private Equity</option>
                    <option value="Strategic Corporate VC">Corporate VC</option>
                    <option value="Family Office">Family Office</option>
                    <option value="Y Combinator Partner">Y Combinator Partner</option>
                    <option value="ESG & Impact Investor">ESG & Impact Investor</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Elevator Pitch</label>
                  {errors.description && <span className="text-[10px] text-rose-500 font-bold">{errors.description.message}</span>}
                </div>
                <textarea {...register('description')} placeholder="What do you do? (Min 10 characters)" rows={2} className={cn("w-full px-3 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border rounded-xl resize-none dark:border-zinc-700 dark:text-zinc-100", errors.description && "border-rose-300 focus:ring-rose-500/20")} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-[24px] border border-slate-200 dark:border-zinc-800 shadow-sm shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300"><span>Aggressiveness</span><span className="text-sky-500">{aggressiveness}%</span></div>
              <input type="range" {...register('aggressiveness', { valueAsNumber: true })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300"><span>Risk Appetite</span><span className="text-indigo-500">{riskAppetite}%</span></div>
              <input type="range" {...register('riskAppetite', { valueAsNumber: true })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0 mt-2">
            {[ 
              { icon: Camera, label: 'Camera', state: cameraEnabled, set: (c:boolean) => setValue('cameraEnabled', c) },
              { icon: Mic, label: 'Microphone', state: micEnabled, set: (c:boolean) => setValue('micEnabled', c) },
              ...(canScreenShare ? [{ icon: Monitor, label: 'Screen', state: screenShareEnabled, set: toggleScreenShare }] : [])
            ].map((hw, i) => (
              <div key={i} className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <hw.icon size={18} className={hw.state ? "text-emerald-500" : "text-slate-400"} />
                  <span className="text-xs font-bold">{hw.label}</span>
                </div>
                <Switch.Root checked={hw.state} onCheckedChange={(checked) => hw.set(checked)} className="w-8 h-4.5 bg-slate-200 dark:bg-zinc-800 rounded-full relative data-[state=checked]:bg-emerald-500 transition-colors cursor-pointer">
                  <Switch.Thumb className="block w-3.5 h-3.5 mt-0.5 ml-0.5 bg-white rounded-full transition-transform data-[state=checked]:translate-x-3.5" />
                </Switch.Root>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: Deck & Submit */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-[300px] lg:min-h-0 min-w-0">
          <div className="flex-1 bg-slate-900 rounded-[32px] p-5 md:p-6 flex flex-col text-white min-h-0 min-w-0 overflow-hidden">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4 shrink-0">Select Deck</h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[140px] lg:min-h-0 min-w-0">
              {isLoading ? ( <><Skeleton className="h-14 bg-white/10" /><Skeleton className="h-14 bg-white/10" /></> ) : availableDecks.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-4">No decks found.</p>
              ) : (
                availableDecks.map((deck) => (
                  <div key={deck.id} onClick={() => deck.status !== 'DRAFT' && setSelectedDeck(deck)} className={cn("flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border min-w-0", selectedDeck?.id === deck.id ? "bg-sky-500/20 border-sky-500" : "border-white/10 hover:bg-white/5", deck.status === 'DRAFT' && "opacity-60 cursor-not-allowed")}>
                    <FileText size={16} className={selectedDeck?.id === deck.id ? "text-sky-400" : "text-white/40"} />
                    <div className="flex-1 overflow-hidden min-w-0">
                      <p className="text-xs font-bold truncate">{deck.name}</p>
                      <p className="text-[9px] text-white/40">
                        {deck.status === 'DRAFT' ? 'Uploading...' : `${deck.size || 0} MB`}
                      </p>
                    </div>
                    {deck.status === 'DRAFT' ? (
                      <Loader2 size={14} className="animate-spin text-sky-500" />
                    ) : selectedDeck?.id === deck.id ? (
                      <CheckCircle2 size={14} className="text-sky-500" />
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <div className="shrink-0 mt-4 space-y-4">
              <button 
                type="button"
                onClick={() => deckFileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/20 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <Upload size={14} /> Upload New
              </button>
              <input 
                type="file"
                ref={deckFileInputRef}
                onChange={handleUploadDeck}
                accept=".pdf,.ppt,.pptx"
                className="hidden"
              />
              
              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-sky-500 text-white font-bold rounded-2xl hover:bg-sky-400 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <>Enter Live Room <PlayCircle size={20} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </div>
          </div>
        </div>
        
      </form>
    </div>
  );
}
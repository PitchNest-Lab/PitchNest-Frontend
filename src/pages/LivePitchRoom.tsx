import React, { useEffect, useRef, useState } from 'react';
import { 
  Rocket, Video, VideoOff, Sparkles, Mic, MicOff, 
  VolumeX, Monitor, MonitorOff, Send, ArrowRightLeft, Loader2, AlertTriangle, MessageSquare, Timer,
  Activity, TrendingUp
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { useScreenCapture } from '../hooks/useScreenCapture';
import { useSocketContext } from '../contexts/SocketContext'; 

const VoiceWaveform = ({ isActive }: { isActive?: boolean }) => (
  <div className="flex items-center gap-[3px] h-4 px-1">
    {[...Array(4)].map((_, i) => (
      <motion.div 
        key={i}
        className={cn("w-1 rounded-full", isActive ? "bg-sky-500" : "bg-slate-200 dark:bg-zinc-800")}
        animate={isActive ? { height: ["20%", "100%", "20%"] } : { height: "20%" }}
        transition={isActive ? { duration: 0.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" } : {}}
      />
    ))}
  </div>
);

const AIPanelist = ({ name, role, isActive }: { name: string, role: string, isActive?: boolean }) => (
  <div className={cn(
    "p-3 bg-white dark:bg-zinc-900/80 border rounded-2xl shadow-sm transition-all duration-300 relative overflow-hidden flex items-center justify-between",
    isActive ? "border-sky-500 ring-1 ring-sky-500/20 shadow-md shadow-sky-100 dark:shadow-sky-900/10 scale-[1.02] bg-sky-50/50 dark:bg-sky-900/10" : "border-slate-100 dark:border-zinc-800"
  )}>
    <div className="flex items-center gap-3 relative z-10">
      <div className="relative">
        {isActive && <span className="absolute inset-0 rounded-full bg-sky-500 opacity-40 animate-ping" />}
        <div className={cn("relative w-10 h-10 rounded-full overflow-hidden border-2 transition-colors z-10 object-cover", isActive ? "border-sky-500" : "border-transparent")}>
          <img src={`https://i.pravatar.cc/150?u=${name}`} alt={name} className="w-full h-full object-cover" />
        </div>
      </div>
      <div>
        <p className={cn("text-xs font-bold", isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-900 dark:text-zinc-100")}>{name}</p>
        <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{role}</span>
      </div>
    </div>
    <VoiceWaveform isActive={isActive} />
  </div>
);

const getPersonas = (archetype: string, mode: string) => {
  if (mode === 'coach') return [{ name: "Riley", role: "Pitch Strategist" }, { name: "Taylor", role: "Comm. Expert" }];
  if (archetype === 'Angel Investor Group') return [{ name: "Elena", role: "Lead Angel" }, { name: "David", role: "Industry Vet" }, { name: "James", role: "Financial Advisor" }];
  return [{ name: "Marcus", role: "The Skeptic" }, { name: "Sarah", role: "The Analyst" }, { name: "Chen", role: "Tech Expert" }];
};

export default function LivePitchRoom() {
  const location = useLocation();
  const navigate = useNavigate();

  const [pitchConfig, setPitchConfig] = useState(() => {
    if (location.state?.pitchConfig) {
      sessionStorage.setItem('pitchConfig', JSON.stringify(location.state.pitchConfig));
      return location.state.pitchConfig;
    }
    const saved = sessionStorage.getItem('pitchConfig');
    return saved ? JSON.parse(saved) : null;
  });

  const { stream, startStream, stopStream } = useMediaRecorder();
  const { socket, isConnected } = useSocketContext();
  const { isCapturing, startCapture, stopCapture, screenStream } = useScreenCapture(() => {});

  const [roomState, setRoomState] = useState<'waiting' | 'countdown' | 'live'>('waiting');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(15 * 60); 
  
  const [mainView, setMainView] = useState<'slide' | 'camera'>('slide');
  const [chatInput, setChatInput] = useState("");
  const [activeSpeakerName, setActiveSpeakerName] = useState("");
  const [isPitching, setIsPitching] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [messages, setMessages] = useState<{id: string, text: string, type: 'user'|'ai', speaker?: string}[]>([]);
  const [isEvaluatingPitch, setIsEvaluatingPitch] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Panel is grading your pitch...");
  const [logoError, setLogoError] = useState(false);
  const [hasSentReady, setHasSentReady] = useState(false);

  const [userData, setUserData] = useState<{name: string, email?: string}>({ name: "Founder" });

  const [overallScore, setOverallScore] = useState(22);
  const [clarityScore, setClarityScore] = useState(45);
  const [confidenceScore, setConfidenceScore] = useState(15);
  const [marketFitScore, setMarketFitScore] = useState(5);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 🔥 FIX: Added Pitch Start Timer to correctly log duration in the database
  const pitchStartTimeRef = useRef<number>(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { setUserData(JSON.parse(storedUser)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!isPitching || isEvaluatingPitch) return;
    
    const elapsed = (15 * 60) - timeLeft;
    const userMsgs = messages.filter(m => m.type === 'user').length;
    const aiMsgs = messages.filter(m => m.type === 'ai').length;

    setOverallScore(Math.min(92, 22 + Math.floor(elapsed / 15) + (userMsgs * 2)));
    setClarityScore(Math.min(95, 45 + Math.floor(elapsed / 20) + (userMsgs * 3)));
    setConfidenceScore(Math.min(88, 15 + Math.floor(elapsed / 18) + (userMsgs * 4)));
    setMarketFitScore(Math.min(90, 5 + Math.floor(elapsed / 25) + (aiMsgs * 5)));
    
    if (timeLeft <= 0) {
      handleEndSession();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [isPitching, timeLeft, isEvaluatingPitch, messages]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartClick = async () => {
    try {
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
      }
    } catch (e) {
      console.error("Audio Context Unlock Failed:", e);
    }
    setRoomState('countdown');
  };

  useEffect(() => {
    if (roomState === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setRoomState('live');
        handleAutoStart();
      }
    }
  }, [roomState, countdown]);

  const handleAutoStart = async () => {
    setIsPitching(true);
    // 🔥 Start the clock!
    pitchStartTimeRef.current = Date.now();
    if (pitchConfig?.screenShareEnabled && !isCapturing) { try { startCapture(); } catch(e) {} }
    if (!stream) { try { await startStream(); } catch(e) {} }
  };

  useEffect(() => {
    if (isPitching && isConnected && socket?.readyState === WebSocket.OPEN && !hasSentReady) {
      socket.send(JSON.stringify({ type: "client_ready", config: pitchConfig }));
      setHasSentReady(true);
    }
  }, [isPitching, isConnected, socket, hasSentReady, pitchConfig]);

  useEffect(() => {
    if (isPitching && stream && !mediaRecorderRef.current) {
      chunksRef.current = [];
      try {
        const mediaRecorder = new MediaRecorder(stream, { 
          mimeType: 'video/webm;codecs=vp8',
          videoBitsPerSecond: 250000 
        });
        mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
        mediaRecorder.start(1000); 
        mediaRecorderRef.current = mediaRecorder;
      } catch (e) {}
    }
  }, [isPitching, stream]);

  useEffect(() => {
    if (!isPitching || !stream || !socket || !isConnected) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const source = audioCtx.createMediaStreamSource(stream);
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (isMicMuted) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBuffer = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      const binary = String.fromCharCode(...new Uint8Array(pcmBuffer.buffer));
      const base64Data = btoa(binary);

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ realtimeInput: { mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: base64Data }] } }));
      }
    };

    source.connect(processor);
    processor.connect(audioCtx.destination);

    return () => {
      source.disconnect();
      processor.disconnect();
      if (audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [isPitching, stream, socket, isConnected, isMicMuted]);

  useEffect(() => {
    if (!socket) return;
    
    const handleMessage = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "transcript" || data.text) {
          const rawText = data.text || data.transcript;
          let currentSpeaker = "Panelist";
          let cleanText = rawText;

          if (rawText.includes(':')) {
            const parts = rawText.split(':');
            currentSpeaker = parts[0].trim();
            cleanText = parts.slice(1).join(':').trim();
            setActiveSpeakerName(currentSpeaker); 
          }
          setMessages(prev => [...prev, { id: Date.now().toString(), text: cleanText, type: 'ai', speaker: currentSpeaker }]);
        }

        if (data.type === "audio") {
          if (!audioContextRef.current) return;
          if (audioContextRef.current.state === 'suspended') { await audioContextRef.current.resume(); }
          
          const binaryString = atob(data.data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
          
          const pcmData = new Int16Array(bytes.buffer);
          const floatData = new Float32Array(pcmData.length);
          for (let i = 0; i < pcmData.length; i++) floatData[i] = pcmData[i] / 32768;

          const audioBuffer = audioContextRef.current.createBuffer(1, floatData.length, 24000);
          audioBuffer.getChannelData(0).set(floatData);

          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          
          const startTime = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
          source.start(startTime);
          nextStartTimeRef.current = startTime + audioBuffer.duration;
          
          setIsSpeaking(true);
          source.onended = () => { 
            if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current) {
                setIsSpeaking(false);
                setActiveSpeakerName(""); 
            }
          };
        }
        
        if (data.type === "report") {
          if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
          if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
          navigate(`/report${data.sessionId ? `?session=${data.sessionId}` : ''}`); 
        }
      } catch (err) {}
    };
    
    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, navigate]);

  useEffect(() => {
    if (!isPitching || !isConnected || !socket) return;
    const visionInterval = setInterval(() => {
      if (socket.readyState !== WebSocket.OPEN) return;

      const frames: any[] = [];
      const canvas = document.createElement('canvas');
      
      if (videoRef.current) {
        canvas.width = 320; canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 320, 180);
          frames.push({ mimeType: "image/jpeg", data: canvas.toDataURL('image/jpeg', 0.4).split(',')[1] });
        }
      }
      
      if (screenRef.current && isCapturing) {
        canvas.width = 640; canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(screenRef.current, 0, 0, 640, 360);
          frames.push({ mimeType: "image/jpeg", data: canvas.toDataURL('image/jpeg', 0.5).split(',')[1] });
        }
      }
      
      if (frames.length > 0) socket.send(JSON.stringify({ realtimeInput: { mediaChunks: frames } }));
    }, 4000); 
    
    return () => clearInterval(visionInterval);
  }, [isPitching, isConnected, isCapturing, socket]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);
  useEffect(() => { if (videoRef.current && stream) videoRef.current.srcObject = stream; }, [stream, mainView]);
  useEffect(() => { if (screenRef.current && screenStream) screenRef.current.srcObject = screenStream; }, [screenStream, mainView]);

  const wakeAudio = () => { if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume(); };
  const toggleCamera = async () => { wakeAudio(); stream ? stopStream() : await startStream(); };
  const toggleMic = () => { wakeAudio(); if (stream) { stream.getAudioTracks().forEach(track => track.enabled = !track.enabled); setIsMicMuted(!isMicMuted); } };
  const toggleScreenShare = async () => { wakeAudio(); isCapturing ? stopCapture() : await startCapture(); };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    wakeAudio(); 
    if (!chatInput.trim() || !socket || !isConnected) return;
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, text: chatInput, type: 'user', speaker: userData.name }]);
    socket.send(JSON.stringify({ type: "chat_message", text: chatInput }));
    setChatInput("");
  };

  const handleEndSession = async () => {
    wakeAudio();
    setIsPitching(false);
    setIsEvaluatingPitch(true); 
    setLoadingStatus("Stopping recording...");

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stopStream();
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    if (isCapturing) stopCapture();

    const statusMessages = ["Panel is grading your pitch...", "Analyzing delivery and clarity...", "Calculating investor readiness...", "Finalizing your report..."];
    let msgIndex = 0;
    statusIntervalRef.current = setInterval(() => {
      msgIndex = (msgIndex + 1) % statusMessages.length;
      setLoadingStatus(statusMessages[msgIndex]);
    }, 4000);

    fallbackTimerRef.current = setTimeout(() => {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      navigate('/report');
    }, 35000);

    const stopAndEvaluate = async () => {
      setLoadingStatus("Uploading video to secure cloud vault...");
      if (chunksRef.current && chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('video', blob, `pitch_${Date.now()}.webm`);
        try {
          const res = await fetch('/api/upload-video', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.videoUrl && socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "set_video_url", url: data.videoUrl }));
          }
        } catch (err) {}
      }
      setLoadingStatus("Panel is grading your pitch...");
      if (socket && socket.readyState === WebSocket.OPEN) {
        // 🔥 Send real duration and the chat transcript to the backend
        const finalDuration = Math.floor((Date.now() - pitchStartTimeRef.current) / 1000);
        socket.send(JSON.stringify({ 
          type: "end_session",
          duration: finalDuration,
          transcript: messages
        }));
      }
    };

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = stopAndEvaluate;
      mediaRecorderRef.current.stop();
    } else stopAndEvaluate();
  };

  const visiblePersonas = pitchConfig ? getPersonas(pitchConfig.investorArchetype, pitchConfig.mode) : [];

  if (!pitchConfig) {
    return (
      <div className="h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
        <AlertTriangle size={64} className="text-rose-500 mb-6" />
        <h2 className="text-3xl font-bold mb-3">Setup Required</h2>
        <Link to="/setup" className="px-8 py-4 bg-sky-500 text-white font-bold rounded-2xl shadow-lg">Go to Setup</Link>
      </div>
    );
  }

  const getDeckUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith('/uploads')) {
      const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
      return `${baseUrl}${url}`;
    }
    return url;
  };

  return (
    <div className="h-screen max-h-screen bg-slate-900 dark:bg-zinc-950 text-white font-sans flex flex-col relative overflow-hidden transition-colors">
      
      <AnimatePresence>
        {roomState !== 'live' && (
          <motion.div exit={{ opacity: 0, scale: 1.1 }} className="absolute inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center">
            {roomState === 'waiting' ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-sky-500/20 text-sky-500 rounded-full flex items-center justify-center mb-6 border border-sky-500/30">
                  <Mic size={48} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Ready to Pitch?</h2>
                <p className="text-slate-400 mb-8 max-w-md">Your camera and microphone will activate securely when you start the session.</p>
                <button 
                  onClick={handleStartClick}
                  className="px-10 py-4 bg-sky-500 text-white font-bold rounded-2xl hover:bg-sky-600 transition-all text-xl shadow-[0_0_40px_rgba(14,165,233,0.3)] flex items-center gap-3"
                >
                  <Sparkles size={24} /> Enter Live Room
                </button>
              </motion.div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-400 uppercase tracking-widest mb-4">Initializing AI Panel</h2>
                <motion.div key={countdown} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5 }} className="text-9xl font-black text-sky-500 drop-shadow-[0_0_40px_rgba(14,165,233,0.5)]">
                  {countdown === 0 ? "PITCH!" : countdown}
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-6 py-3 flex justify-between items-center border-b border-white/5 bg-slate-900/50 dark:bg-zinc-950/50 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className={cn("w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg", logoError && "bg-sky-500 text-white")}>
            {!logoError ? <img src="/PitchNest Logo.png" alt="Logo" className="w-full h-full object-contain" onError={() => setLogoError(true)} /> : <Rocket size={20} fill="currentColor" />}
          </div>
          <span className="text-lg font-bold tracking-tight">PitchNest</span>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full border transition-all", isConnected ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20")}>
            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{isConnected ? "Brain Connected" : "Offline"}</span>
          </div>
        </div>

        <div className={cn(
          "flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-sm font-bold border transition-colors",
          timeLeft < 180 ? "bg-rose-500/20 text-rose-500 border-rose-500/50 animate-pulse" : "bg-slate-800 text-white border-slate-700"
        )}>
          <Timer size={16} />
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold">{userData.name}</p>
              <p className="text-[10px] text-white/40 font-medium">Founder</p>
            </div>
            <div className="relative">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white/10 relative z-10 bg-sky-100" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 min-h-0 overflow-hidden">
        
        {/* Main Left Column */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          
          {/* Top Row: Main Screen + AI Panel */}
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Main Viewing Area */}
            <div className="flex-1 relative border border-white/5 shadow-2xl group rounded-[24px] min-h-0 bg-white">
              {mainView === 'slide' ? (
                <div className="w-full h-full relative flex items-center justify-center rounded-[24px] overflow-hidden">
                  {isCapturing ? (
                    <video ref={screenRef} autoPlay muted playsInline className="w-full h-full object-contain bg-black/40" />
                  ) : pitchConfig.selectedDeck ? (
                    <iframe src={getDeckUrl(pitchConfig.selectedDeck.file_url)} className="w-full h-full border-none" title="Pitch Deck" />
                  ) : (
                    <div className="text-slate-400 text-center bg-slate-900 w-full h-full flex flex-col items-center justify-center"><MonitorOff size={64} className="mx-auto mb-2 opacity-50" /><p className="text-xs font-bold uppercase tracking-widest opacity-50">No deck selected</p></div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full relative flex items-center justify-center bg-slate-900 rounded-[24px] overflow-hidden">
                  {stream ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" /> : <VideoOff size={48} className="text-white/20" />}
                  {isPitching && <div className="absolute top-4 right-4 bg-rose-500 px-3 py-1 rounded-full text-[9px] font-bold animate-pulse shadow-lg z-10">VISION ON</div>}
                </div>
              )}

              <button 
                onClick={() => setMainView(v => v === 'slide' ? 'camera' : 'slide')}
                className="absolute top-4 left-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-white transition-all z-20 flex items-center gap-2 shadow-lg"
              >
                <ArrowRightLeft size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">Swap View</span>
              </button>
            </div>

            {/* AI Panel */}
            <div className="w-64 shrink-0 bg-white dark:bg-zinc-900 rounded-[24px] p-4 shadow-xl flex flex-col border border-slate-100 dark:border-zinc-800 min-h-0">
              <div className="mb-3 shrink-0">
                <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  {pitchConfig.mode === 'solo' ? 'Solo Practice' : 'AI Investor Panel'}
                  {isSpeaking && <Sparkles className="text-sky-500 animate-pulse" size={14} />}
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                  {pitchConfig.mode === 'solo' ? "No interruptions" : pitchConfig.investorArchetype}
                </p>
              </div>
              
              <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {pitchConfig.mode !== 'solo' && visiblePersonas.map((persona, idx) => (
                  <AIPanelist 
                    key={idx}
                    name={persona.name} 
                    role={persona.role} 
                    isActive={isSpeaking && activeSpeakerName.toLowerCase().includes(persona.name.toLowerCase())} 
                  />
                ))}
                
                {pitchConfig.mode === 'solo' && (
                  <div className="p-3 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-center text-slate-500 text-xs mt-2">
                    AI Interruption Disabled.<br/> Record your pitch uninterrupted.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transcript / Chat Area */}
          <div className="h-48 shrink-0 bg-slate-800/50 backdrop-blur-md rounded-[24px] p-4 flex flex-col border border-white/5">
            <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">
              <MessageSquare size={14} /> Live Transcript
              {isSpeaking && <span className="text-sky-400 animate-pulse ml-auto">AI is speaking...</span>}
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar mb-3">
              {messages.length === 0 ? <p className="text-white/30 text-xs text-center mt-4 font-medium">Panel is ready. Start your pitch.</p> : 
                messages.map((m) => (
                  <div key={m.id} className={cn("flex flex-col max-w-[80%]", m.type === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
                    <span className="text-[9px] font-bold uppercase text-white/40 mb-1 px-1 tracking-wider">
                      {m.speaker || (m.type === 'user' ? userData.name : "Panelist")}
                    </span>
                    <div className={cn(
                      "p-3 text-[13px] leading-relaxed",
                      m.type === 'user' ? "bg-sky-500 text-white rounded-2xl rounded-tr-sm shadow-md" : "bg-slate-700 text-slate-100 rounded-2xl rounded-tl-sm border border-slate-600 shadow-sm"
                    )}>
                      {m.text}
                    </div>
                  </div>
                ))
              }
            </div>

            <form onSubmit={handleSendChat} className="flex items-center gap-2 shrink-0 mt-auto bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-inner">
              <button 
                type="button" 
                onClick={toggleMic} 
                className={cn("p-2 rounded-lg transition-colors flex items-center justify-center", !isMicMuted ? "text-sky-400 hover:bg-slate-800" : "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30")}
                title={!isMicMuted ? "Mute Microphone" : "Unmute Microphone"}
              >
                {!isMicMuted ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <input 
                type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message or use your microphone..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white placeholder:text-slate-500 px-2 outline-none"
              />
              <button type="submit" disabled={!isConnected} className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 shadow-md">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 shrink-0 flex flex-col gap-4 min-h-0">
          
          <div className="aspect-video shrink-0 relative shadow-2xl border border-white/5 rounded-[24px] overflow-hidden bg-slate-800">
            {mainView === 'camera' ? (
              <div className="w-full h-full relative flex items-center justify-center bg-white overflow-hidden pointer-events-none">
                {isCapturing ? <video ref={screenRef} autoPlay muted playsInline className="w-full h-full object-contain" /> : 
                 pitchConfig.selectedDeck ? <iframe src={getDeckUrl(pitchConfig.selectedDeck.file_url)} className="w-full h-full border-none" title="Pitch Deck" /> :
                 <div className="text-white/20 text-center"><MonitorOff size={32} className="mx-auto mb-1" /><p className="text-[9px] font-bold uppercase tracking-widest">No Screen</p></div>}
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center rounded-[24px] overflow-hidden">
                {stream ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" /> : <VideoOff size={32} className="text-white/20" />}
              </div>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <button onClick={toggleCamera} className={cn("flex-1 py-2.5 rounded-xl border transition-all flex items-center justify-center", stream ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-rose-500/20 border-rose-500/50 text-rose-500 hover:bg-rose-500/30")}>
              {stream ? <Video size={16} /> : <VideoOff size={16} />}
            </button>
            <button onClick={toggleMic} className={cn("flex-1 py-2.5 rounded-xl border transition-all flex items-center justify-center", !isMicMuted ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-rose-500/20 border-rose-500/50 text-rose-500 hover:bg-rose-500/30")}>
              {!isMicMuted ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
            <button onClick={toggleScreenShare} className={cn("flex-1 py-2.5 rounded-xl border transition-all flex items-center justify-center", isCapturing ? "bg-sky-500 text-white border-sky-500 hover:bg-sky-600" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700")}>
              {isCapturing ? <Monitor size={16} /> : <MonitorOff size={16} />}
            </button>
          </div>

          <button 
            onClick={handleEndSession}
            disabled={!isConnected && !isPitching}
            className="w-full shrink-0 py-3 bg-rose-500 text-white text-sm font-bold rounded-xl hover:bg-rose-600 transition-all disabled:bg-slate-700 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
          >
            <VolumeX size={16} /> End Pitch Session
          </button>

          <div className="flex-1 bg-slate-800/40 rounded-[24px] p-5 border border-white/5 flex flex-col gap-5 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest shrink-0">
              <Activity size={14} /> Real-time Metrics
            </div>
            
            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5 shrink-0">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="24" className="stroke-slate-700" strokeWidth="4" fill="none" />
                  <circle cx="28" cy="28" r="24" className="stroke-sky-500 transition-all duration-1000 ease-out" strokeWidth="4" fill="none" strokeDasharray="150" strokeDashoffset={150 - (150 * overallScore) / 100} strokeLinecap="round" />
                </svg>
                <span className="absolute text-sm font-bold text-white">{overallScore}</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white mb-0.5">Overall Score</h4>
                <p className="text-[10px] text-sky-400 font-medium">Pitch in progress...</p>
              </div>
            </div>

            <div className="flex-1 space-y-4 flex flex-col justify-center">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-white/70 mb-1.5 uppercase tracking-wider">
                  <span>Clarity</span>
                  <span className="text-emerald-400 flex items-center gap-1"><TrendingUp size={10}/> {clarityScore}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out rounded-full" style={{ width: `${clarityScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold text-white/70 mb-1.5 uppercase tracking-wider">
                  <span>Confidence</span>
                  <span className="text-amber-400 flex items-center gap-1"><TrendingUp size={10}/> {confidenceScore}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 transition-all duration-1000 ease-out rounded-full" style={{ width: `${confidenceScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold text-white/70 mb-1.5 uppercase tracking-wider">
                  <span>Market Fit</span>
                  <span className="text-indigo-400 flex items-center gap-1"><TrendingUp size={10}/> {marketFitScore}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-1000 ease-out rounded-full" style={{ width: `${marketFitScore}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isEvaluatingPitch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-sky-500 mb-6" size={48} />
            <h2 className="text-3xl font-bold">{loadingStatus}</h2>
            <p className="text-sky-400 mt-2 font-medium">Please wait while Gemini evaluates your performance.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
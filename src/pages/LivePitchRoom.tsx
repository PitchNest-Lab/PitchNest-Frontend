import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Rocket, Video, VideoOff, Sparkles, Mic, MicOff, 
  VolumeX, Monitor, MonitorOff, Send, ArrowRightLeft, Loader2, AlertTriangle, MessageSquare, Timer,
  Activity, TrendingUp, Users
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { useScreenCapture } from '../hooks/useScreenCapture';
import { useSocketContext } from '../contexts/SocketContext'; 
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';

const TTS_LANG = 'en-US';
const TTS_MAX_CHARS = 420;
const TTS_MAX_SENTENCES = 2;
const TTS_STREAM_FLUSH_MS = 650;
const TTS_STREAM_SPEAK_MIN_CHARS = 120;

function normalizeWhitespace(text: string) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function trimToSentences(text: string, maxSentences: number) {
  const t = normalizeWhitespace(text);
  if (!t) return '';
  const parts = t.split(/(?<=[.!?])\s+/);
  return parts.slice(0, Math.max(1, maxSentences)).join(' ') || t;
}

function limitSpokenText(text: string) {
  const t = trimToSentences(text, TTS_MAX_SENTENCES);
  if (t.length <= TTS_MAX_CHARS) return t;
  return t.slice(0, TTS_MAX_CHARS).replace(/\s+\S*$/, '').trimEnd() + '…';
}

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

const PANELISTS_AVATARS: Record<string, string> = {
  marcus: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300&h=300",
  sarah: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300&h=300",
  chen: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300&h=300",
  elena: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300&h=300",
  david: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300&h=300",
  james: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300&h=300",
  riley: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=300",
  taylor: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300&h=300",
};

function getPanelistAvatar(name: string): string {
  const normalized = name.toLowerCase().trim();
  for (const [key, url] of Object.entries(PANELISTS_AVATARS)) {
    if (normalized.includes(key)) {
      return url;
    }
  }
  return `https://i.pravatar.cc/300?u=${normalized}`;
}

const AIPanelist = ({ name, role, isActive }: { name: string, role: string, isActive?: boolean }) => (
  <div className={cn(
    "w-full max-w-[190px] lg:max-w-none lg:w-full shrink-0 relative overflow-hidden bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md rounded-[20px] transition-all duration-500 group flex flex-col border",
    isActive ? "border-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.15)] bg-sky-50/50 dark:bg-zinc-800" : "border-slate-200 dark:border-white/5"
  )}>
    {isActive && <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 to-transparent pointer-events-none" />}
    
    <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
       {/* Realistic Avatar for Dashboard look */}
      <img src={getPanelistAvatar(name)} alt={name} className={cn("w-full h-full object-cover transition-transform duration-700", isActive ? "scale-110" : "scale-100")} />
      
      {/* Active Recording Icon top right */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/60 dark:bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-slate-200/60 dark:border-white/10">
        <Video size={10} className={isActive ? "text-sky-400" : "text-slate-500 dark:text-white/40"} />
        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
      </div>
    </div>

    <div className="p-3 flex items-center justify-between border-t border-slate-200/65 dark:border-white/5 relative bg-slate-50 dark:bg-slate-900">
      <div className="relative z-10">
        <p className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">{name}</p>
        <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400/80 uppercase tracking-widest">{role}</span>
      </div>
      <div className="opacity-70 group-hover:opacity-100 transition-opacity">
        <VoiceWaveform isActive={isActive} />
      </div>
    </div>
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
  const { user, authFetch } = useAuth();
  const canScreenShare = typeof navigator?.mediaDevices?.getDisplayMedia === 'function';

  const [roomState, setRoomState] = useState<'waiting' | 'countdown' | 'live'>('waiting');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(15 * 60); 
  
  const [mainView, setMainView] = useState<'slide' | 'camera'>('slide');
  const [chatInput, setChatInput] = useState("");
  const [activeSpeakerName, setActiveSpeakerName] = useState("");
  const [isPitching, setIsPitching] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [messages, setMessages] = useState<{id: string, text: string, type: 'user'|'ai', speaker?: string, inputMethod?: 'voice' | 'chat'}[]>([]);
  const [isEvaluatingPitch, setIsEvaluatingPitch] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Panel is grading your pitch...");
  const [logoError, setLogoError] = useState(false);
  const [hasSentReady, setHasSentReady] = useState(false);

  const [userData, setUserData] = useState<{name: string, email?: string}>({ name: "Founder" });
  const [scores, setScores] = useState<{
    clarity: number | null;
    confidence: number | null;
    marketFit: number | null;
    readiness: number | null;
  }>({ clarity: null, confidence: null, marketFit: null, readiness: null });

  // Responsive Tab State for mobile screen viewports
  const [activeMobileTab, setActiveMobileTab] = useState<'room' | 'panelists' | 'chat' | 'vitals'>('room');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pitchStartTimeRef = useRef<number>(0);

  const ttsStreamBufferRef = useRef<string>('');
  const ttsStreamFlushTimerRef = useRef<number | null>(null);
  const ttsDidStreamSpeakRef = useRef(false);
  const isAiStreamingRef = useRef(false);
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const uploadPromiseRef = useRef<Promise<any> | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      const isEn = (v: SpeechSynthesisVoice) => (v.lang || '').toLowerCase().startsWith('en');
      preferredVoiceRef.current =
        voices.find(v => isEn(v) && /google/i.test(v.name)) ||
        voices.find(v => v.lang.toLowerCase() === TTS_LANG.toLowerCase()) ||
        voices.find(isEn) || null;
    };
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => { try { window.speechSynthesis.onvoiceschanged = null; } catch {} };
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { setUserData(JSON.parse(storedUser)); } catch (e) {}
    }
  }, []);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);


  useEffect(() => {
    if (!isPitching || isEvaluatingPitch) return;
    
    if (timeLeft <= 0) {
      handleEndSession();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [isPitching, timeLeft, isEvaluatingPitch]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const stopTts = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    try { window.speechSynthesis.cancel(); } catch {}
    ttsStreamBufferRef.current = '';
    ttsDidStreamSpeakRef.current = false;
    isAiStreamingRef.current = false;
    if (ttsStreamFlushTimerRef.current) {
      window.clearTimeout(ttsStreamFlushTimerRef.current);
      ttsStreamFlushTimerRef.current = null;
    }
  }, []);

  const speakShort = useCallback((rawText: string) => {
    // Disabled to prevent double-voice bug and clash with native Gemini audio
    return;
  }, []);

  const flushTtsStreamBuffer = useCallback((): boolean => {
    const segment = normalizeWhitespace(ttsStreamBufferRef.current);
    if (!segment) return false;
    ttsStreamBufferRef.current = '';
    ttsDidStreamSpeakRef.current = true;
    speakShort(segment);
    return true;
  }, [speakShort]);

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
    pitchStartTimeRef.current = Date.now();
    if (pitchConfig?.screenShareEnabled && !isCapturing) { try { startCapture(); } catch(e) {} }
    if (!stream) { try { await startStream(); } catch(e) {} }
  };

  useEffect(() => {
    if (isPitching && isConnected && socket?.readyState === WebSocket.OPEN && !hasSentReady) {
      socket.send(JSON.stringify({ type: "client_ready", config: { ...pitchConfig, userId: user?.id } }));
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
        
        // 🔥 FIX 1: Smaller chunk size (250ms instead of 1000ms) for upload stability
        mediaRecorder.start(250); 
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
        // 🔥 FIX 2: Buffer overflow guard to stop Gemini from freezing mid-pitch
        if (socket.bufferedAmount > 1000000) {
          console.warn("WebSocket buffer full, dropping chunk");
          return;
        }
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
          let cleanText = rawText;
          
          // Determine speaker: use backend-detected speaker, or parse from text
          let currentSpeaker = data.speaker || "";
          
          if (!currentSpeaker) {
            // Try to detect speaker from text patterns
            const nameMatch = cleanText.match(/^(Marcus|Sarah|Chen|Riley|Taylor|Elena|David|James)\s+here[,.\s\u2014-]/i)
              || cleanText.match(/(?:I'm|I am|This is|It's)\s+(Marcus|Sarah|Chen|Riley|Taylor|Elena|David|James)/i);
            
            if (nameMatch && nameMatch[1]) {
              currentSpeaker = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase();
            }
          }
          
          // Strip the speaker intro from the displayed text to avoid redundancy
          cleanText = cleanText.replace(/^(Marcus|Sarah|Chen|Riley|Taylor|Elena|David|James)\s+here[,.\s\u2014-]+/i, '').trim();
          cleanText = cleanText.replace(/^(?:I'm|I am|This is|It's)\s+(?:Marcus|Sarah|Chen|Riley|Taylor|Elena|David|James)[,.\s\u2014-]+/i, '').trim();
          
          // Use last known speaker if we couldn't detect one
          if (!currentSpeaker) {
            currentSpeaker = activeSpeakerName || "Marcus";
          }
          
          // Update active speaker for pulse animation
          setActiveSpeakerName(currentSpeaker);
          
          if (cleanText) {
            setMessages(prev => [...prev, { id: Date.now().toString(), text: cleanText, type: 'ai', speaker: currentSpeaker }]);
            
            const chunk = cleanText;
            if (chunk && isAiStreamingRef.current === false) {
              stopTts();
              ttsDidStreamSpeakRef.current = false;
              isAiStreamingRef.current = true;
            }
            ttsStreamBufferRef.current += chunk;
            const buf = ttsStreamBufferRef.current;
            const hasSentenceEnd = /[.!?]\s*$/.test(buf) || normalizeWhitespace(buf).length >= TTS_STREAM_SPEAK_MIN_CHARS;
            
            if (hasSentenceEnd) {
              if (ttsStreamFlushTimerRef.current) window.clearTimeout(ttsStreamFlushTimerRef.current);
              ttsStreamFlushTimerRef.current = window.setTimeout(() => {
                ttsStreamFlushTimerRef.current = null;
                flushTtsStreamBuffer();
              }, 120);
            } else if (!ttsStreamFlushTimerRef.current) {
              ttsStreamFlushTimerRef.current = window.setTimeout(() => {
                ttsStreamFlushTimerRef.current = null;
                flushTtsStreamBuffer();
              }, TTS_STREAM_FLUSH_MS);
            }
            
            // Note: because Gemini natively handles audio, we are only using TTS as a fallback or for transcript-only mode.
            // The final flush is handled implicitly by the sentence end detection and timers.
          }
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
        
        if (data.type === "SCORE_UPDATE" && data.scores) {
          setScores(data.scores);
        }

        if (data.type === "idle_end") {
          setMessages(prev => [...prev, { 
            id: `idle-${Date.now()}`, 
            text: data.message || "Session ended due to inactivity.", 
            type: 'ai', 
            speaker: "System" 
          }]);
          // Auto-trigger end session after a brief delay
          setTimeout(() => handleEndSession(), 1500);
        }

        if (data.type === "report") {
          if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
          if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
          
          const finalizeNavigation = () => {
            const mockSessionDbRow = {
              id: data.sessionId,
              business_name: currentBusinessName,
              evaluation_report: data.data,
              created_at: new Date().toISOString(),
              video_url: currentVideoUrl || ""
            };
            navigate(`/report${data.sessionId ? `?session=${data.sessionId}` : ''}`, {
              state: { session: mockSessionDbRow }
            }); 
          };

          if (uploadPromiseRef.current) {
            setLoadingStatus("Finalizing video upload...");
            uploadPromiseRef.current.finally(finalizeNavigation);
          } else {
            finalizeNavigation();
          }
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
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, text: chatInput, type: 'user', speaker: userData.name, inputMethod: 'chat' }]);
    socket.send(JSON.stringify({ type: "chat_message", text: chatInput }));
    setChatInput("");
  };

  const handleEndSession = async () => {
    wakeAudio();
    setIsPitching(false);
    setIsEvaluatingPitch(true); 
    setLoadingStatus("Stopping recording...");

    const statusMessages = ["Panel is grading your pitch...", "Analyzing delivery and clarity...", "Calculating investor readiness...", "Finalizing your report..."];
    let msgIndex = 0;
    statusIntervalRef.current = setInterval(() => {
      msgIndex = (msgIndex + 1) % statusMessages.length;
      setLoadingStatus(statusMessages[msgIndex]);
    }, 4000);

    fallbackTimerRef.current = setTimeout(() => {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      navigate('/report');
    }, 300000); // 5 minute fallback in case of slow video upload

    const stopAndEvaluate = async () => {
      if (stream) { stream.getTracks().forEach(track => track.stop()); stopStream(); }
      if (screenStream) { screenStream.getTracks().forEach(track => track.stop()); }
      if (isCapturing) stopCapture();

      // 1. Immediately send end_session so AI can start grading without waiting for large video upload
      setLoadingStatus("Panel is grading your pitch while video uploads...");
      if (socket && socket.readyState === WebSocket.OPEN) {
        const finalDuration = Math.floor((Date.now() - pitchStartTimeRef.current) / 1000);
        socket.send(JSON.stringify({ 
          type: "end_session",
          duration: finalDuration,
          transcript: messages
        }));
      }

      // 2. Upload video in parallel
      if (chunksRef.current && chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('video', blob, `pitch_${Date.now()}.webm`);
        
        uploadPromiseRef.current = new Promise<void>(async (resolve) => {
          try {
            const res = await authFetch('/api/upload-video', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.videoUrl && socket && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: "set_video_url", url: data.videoUrl }));
            }
          } catch (err) {
            console.error("Video upload failed:", err);
          } finally {
            resolve();
          }
        });
      }
      
      chunksRef.current = [];
    };

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = stopAndEvaluate;
      mediaRecorderRef.current.stop();
    } else {
      stopAndEvaluate();
    }
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
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : 'https://pitchnest-live.onrender.com';
    return `${apiBase}${url.startsWith('/') ? url : `/${url}`}`;
  };

  return (
    <div className="h-screen max-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-white font-sans flex flex-col relative overflow-hidden transition-colors">
      
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
                  className="px-10 py-4 bg-sky-500 text-white font-bold rounded-2xl hover:bg-sky-600 transition-all text-xl shadow-[0_0_40px_rgba(14,165,233,0.3)] flex items-center gap-3 cursor-pointer"
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

      {/* Header */}
      <header className="px-4 md:px-6 py-2.5 md:py-3 flex justify-between items-center border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-zinc-950/50 backdrop-blur-md shrink-0 z-20 transition-colors">
        <div className="flex items-center gap-2 md:gap-4">
          <div className={cn("w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg bg-sky-500 text-white shadow-md", logoError && "bg-sky-500")}>
            {!logoError ? <img src="/PitchNest Logo.png" alt="Logo" className="w-full h-full object-contain" onError={() => setLogoError(true)} /> : <Rocket size={18} className="text-white" fill="currentColor" />}
          </div>
          <span className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white hidden xs:inline-block">PitchNest</span>
          
          <div className="h-5 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block" />
          <ThemeToggle />
          
          <div className="h-5 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block" />
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all", isConnected ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20")}>
            <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
            <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline-block">{isConnected ? "Brain Connected" : "Offline"}</span>
          </div>
        </div>

        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs md:text-sm font-bold border transition-colors",
          timeLeft < 180 ? "bg-rose-500/20 text-rose-500 border-rose-500/50 animate-pulse" : "bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-white border-slate-200 dark:border-zinc-850"
        )}>
          <Timer size={14} />
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{userData.name}</p>
              <p className="text-[10px] text-slate-400 dark:text-white/40 font-medium">Founder</p>
            </div>
            <div className="relative">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`} alt="Avatar" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-slate-200 dark:border-white/10 bg-sky-100" />
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* DESKTOP LAYOUT (Full grid structure, perfectly locked on lg+) */}
      {/* ============================================================== */}
      <div className="hidden lg:flex flex-1 flex-row p-3.5 gap-4 min-h-0 overflow-hidden bg-slate-100/50 dark:bg-zinc-950 transition-colors">
        
        {/* LEFT COLUMN: AI Panelists */}
        <div className="w-72 shrink-0 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl rounded-[24px] p-4 flex flex-col border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-2xl min-h-0 transition-colors">
          <div className="mb-4 shrink-0">
            <h3 className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-2 uppercase tracking-widest">
              {pitchConfig.mode === 'solo' ? 'Solo Practice' : 'AI Investor Panel'}
              {isSpeaking && <Sparkles className="text-sky-500 animate-pulse" size={14} />}
            </h3>
            <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase mt-1 tracking-wider">
              {pitchConfig.mode === 'solo' ? "No interruptions" : pitchConfig.investorArchetype}
            </p>
          </div>
          
          <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {pitchConfig.mode !== 'solo' && visiblePersonas.map((persona, idx) => (
              <AIPanelist 
                key={idx}
                name={persona.name} 
                role={persona.role} 
                isActive={isSpeaking && activeSpeakerName.toLowerCase().includes(persona.name.toLowerCase())} 
              />
            ))}
            
            {pitchConfig.mode === 'solo' && (
              <div className="p-4 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center text-slate-500 text-xs mt-2">
                AI Interruption Disabled.<br/> Record your pitch uninterrupted.
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Main Screen, Controls, Chat */}
        <div className="flex-1 flex flex-col gap-3.5 min-h-0">
          
          {/* Main Viewing Area */}
          <div className="flex-1 relative border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl group rounded-[24px] min-h-0 bg-white dark:bg-zinc-900/80 overflow-hidden backdrop-blur-lg transition-colors">
            {mainView === 'slide' ? (
              <div className="w-full h-full relative flex items-center justify-center rounded-[24px] overflow-hidden">
                {isCapturing ? (
                  <video ref={screenRef} autoPlay muted playsInline className="w-full h-full object-contain bg-black/40" />
                ) : pitchConfig.selectedDeck ? (
                  <iframe src={getDeckUrl(pitchConfig.selectedDeck.file_url)} className="w-full h-full border-none" title="Pitch Deck" />
                ) : (
                  <div className="text-slate-400 dark:text-slate-500 text-center bg-slate-100 dark:bg-slate-900 w-full h-full flex flex-col items-center justify-center"><MonitorOff size={64} className="mx-auto mb-2 opacity-50" /><p className="text-xs font-bold uppercase tracking-widest opacity-50">No deck selected</p></div>
                )}
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center rounded-[24px] overflow-hidden">
                {stream ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" /> : <VideoOff size={64} className="text-slate-300 dark:text-white/20" />}
                {isPitching && <div className="absolute top-4 right-4 bg-rose-500 px-3 py-1 rounded-full text-[9px] font-bold animate-pulse shadow-lg z-10 uppercase tracking-widest text-white">Vision On</div>}
              </div>
            )}

            <button 
              onClick={() => setMainView(v => v === 'slide' ? 'camera' : 'slide')}
              className="absolute top-4 left-4 px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 rounded-xl text-white transition-all z-20 flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <ArrowRightLeft size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">Swap View</span>
            </button>
            
            {/* Control Bar Overlay (Bottom Center) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-2 rounded-2xl shadow-xl dark:shadow-2xl z-20 transition-colors">
              <button onClick={toggleCamera} className={cn("w-12 h-12 rounded-xl transition-all flex items-center justify-center cursor-pointer", stream ? "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-zinc-700" : "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30")}>
                {stream ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button onClick={toggleMic} className={cn("w-12 h-12 rounded-xl transition-all flex items-center justify-center cursor-pointer", !isMicMuted ? "bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/20" : "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30")}>
                {!isMicMuted ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              {canScreenShare && (
                <button onClick={toggleScreenShare} className={cn("w-12 h-12 rounded-xl transition-all flex items-center justify-center cursor-pointer", isCapturing ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600" : "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-zinc-700")}>
                  {isCapturing ? <Monitor size={20} /> : <MonitorOff size={20} />}
                </button>
              )}
              <div className="w-px h-8 bg-slate-200 dark:bg-white/10 mx-2" />
              <button 
                onClick={handleEndSession}
                disabled={!isConnected && !isPitching}
                className="px-6 h-12 bg-rose-500 text-white text-sm font-bold rounded-xl hover:bg-rose-600 transition-all disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:opacity-50 shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <VolumeX size={18} /> End Pitch
              </button>
            </div>
          </div>

          {/* Transcript / Chat Area */}
          <div className="h-48 shrink-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl rounded-[24px] p-4 flex flex-col border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-2xl transition-colors">
            <div className="flex items-center gap-2 text-slate-500 dark:text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2 shrink-0">
              <MessageSquare size={14} /> Chatbox & Transcript
              {isSpeaking && <span className="text-sky-500 dark:text-sky-400 animate-pulse ml-auto font-medium">AI is responding...</span>}
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar mb-3">
              {messages.length === 0 ? <p className="text-slate-400 dark:text-white/30 text-xs text-center mt-4 font-medium tracking-wide">AI Panel is ready. Start your pitch.</p> : 
                messages.map((m) => (
                  <div key={m.id} className={cn("flex flex-col max-w-[80%]", m.type === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
                    <span className="text-[9px] font-bold uppercase text-slate-450 dark:text-white/40 mb-1 px-1 tracking-widest">
                      {m.speaker || (m.type === 'user' ? userData.name : "Panelist")}
                    </span>
                    <div className={cn(
                      "p-3.5 text-sm leading-relaxed",
                      m.type === 'user' ? "bg-sky-500 text-white rounded-2xl rounded-tr-sm shadow-md" : "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-zinc-700 shadow-sm"
                    )}>
                      {m.text}
                    </div>
                  </div>
                ))
              }
            </div>

            <form onSubmit={handleSendChat} className="flex items-center gap-3 shrink-0 mt-auto bg-slate-100/50 dark:bg-zinc-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-1.5 shadow-inner">
              <input 
                type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message to the panel..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 outline-none"
              />
              <button type="submit" disabled={!isConnected} className="px-4 py-2 bg-sky-500 text-white font-bold text-slate-100 hover:text-white text-xs uppercase tracking-wider rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 shadow-md cursor-pointer">
                Send
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Deck, Vitals, Analytics */}
        <div className="w-96 shrink-0 flex flex-col gap-3.5 min-h-0 overflow-y-auto custom-scrollbar pr-1">
          
          {/* Deck Preview Box */}
          <div className="h-36 shrink-0 relative shadow-xl dark:shadow-2xl border-4 border-slate-250 dark:border-white/10 rounded-[24px] overflow-hidden bg-white dark:bg-zinc-900 cursor-pointer group transition-transform hover:scale-[1.02]" onClick={() => setMainView(v => v === 'slide' ? 'camera' : 'slide')}>
            {mainView === 'camera' ? (
              <div className="w-full h-full relative flex items-center justify-center bg-slate-100 dark:bg-zinc-900 pointer-events-none">
                {isCapturing ? <video ref={screenRef} autoPlay muted playsInline className="w-full h-full object-contain" /> : 
                 pitchConfig.selectedDeck ? <iframe src={getDeckUrl(pitchConfig.selectedDeck.file_url)} className="w-full h-full border-none opacity-90 scale-105" title="Pitch Deck" /> :
                 <div className="text-slate-400 dark:text-white/20 text-center"><MonitorOff size={32} className="mx-auto mb-2" /><p className="text-[10px] font-bold uppercase tracking-widest">No Deck</p></div>}
              </div>
            ) : (
              <div className="w-full h-full relative flex items-center justify-center pointer-events-none">
                {stream ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" /> : <VideoOff size={32} className="text-slate-300 dark:text-white/20" />}
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
               <ArrowRightLeft className="text-white drop-shadow-xl" size={32} />
               <span className="absolute bottom-4 text-[10px] font-bold uppercase tracking-widest text-white shadow-black drop-shadow-lg">Switch to Main Screen</span>
            </div>
          </div>

          {/* Live Session Monitor */}
          <div className="bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl rounded-[24px] p-4 border border-slate-200 dark:border-white/5 shadow-xl flex flex-col shrink-0 transition-colors">
            <div className="flex items-center gap-2 text-slate-500 dark:text-white/50 text-[10px] font-bold uppercase tracking-widest shrink-0 mb-2.5">
              <Activity size={14} /> Live Session Monitor
            </div>
            
            <h4 className="text-[11px] font-bold text-slate-700 dark:text-white/80 uppercase tracking-widest mb-3">Boardroom Vitals</h4>
            
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Brain Link</span>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", isConnected ? "text-emerald-500 dark:text-emerald-450" : "text-rose-500 dark:text-rose-455")}>
                  {isConnected ? "Connected" : "Offline"}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-455 font-medium">Audio Pipeline</span>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", stream && !isMicMuted ? "text-sky-600 dark:text-sky-400" : "text-rose-500 dark:text-rose-455")}>
                  {stream && !isMicMuted ? "Active" : "Muted"}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-455 font-medium">Vision Input</span>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", stream ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500")}>
                  {stream ? "Active" : "Disabled"}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-455 font-medium">Interactive Sharing</span>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", isCapturing ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-slate-500")}>
                  {isCapturing ? "Casting" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Data Chart Area */}
          {(() => {
            const userMsgCount = messages.filter(m => m.type === 'user').length;
            const aiMsgCount = messages.filter(m => m.type === 'ai').length;
            const totalMsgCount = userMsgCount + aiMsgCount;
            const dialogueBalance = totalMsgCount > 0 ? Math.round((userMsgCount / totalMsgCount) * 100) : 50;

            return (
              <div className="bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl rounded-[24px] p-4 border border-slate-200 dark:border-white/5 flex flex-col justify-between shadow-xl min-h-[125px] transition-colors">
                <h4 className="text-[11px] font-bold text-slate-700 dark:text-white/80 uppercase tracking-widest mb-3">Data Chart</h4>
                
                <div className="flex items-end justify-between h-14 gap-3 pb-2 border-b border-slate-200 dark:border-white/10">
                  {[dialogueBalance, 100-dialogueBalance, Math.max(20, dialogueBalance-10), Math.min(90, dialogueBalance+20), 60, 45].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end group animate-all">
                      <div 
                        className="w-full rounded-t-sm transition-all duration-500 bg-gradient-to-t from-sky-600 to-sky-400 opacity-80 group-hover:opacity-100" 
                        style={{ height: `${val}%` }} 
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mt-3">
                  <span>Founder</span>
                  <span>Dynamics</span>
                  <span>Panel</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MOBILE & TABLET LAYOUT (Toggleable tab tray Zoom/Meet style)   */}
      {/* ============================================================== */}
      <div className="flex lg:hidden flex-1 flex-col p-3 md:p-4 min-h-0 overflow-hidden bg-slate-100/50 dark:bg-zinc-950 transition-colors">
          {/* Tab 1: Room Workspace (Main Pitching Screen & PIP Overlays) */}
        {activeMobileTab === 'room' && (
          <div className="flex-1 flex flex-col min-h-0 justify-start pt-2">
            
            {/* Screen Container with locked 16:9 Aspect Ratio to guarantee no distortion */}
            <div className="w-full aspect-video relative border border-slate-200 dark:border-zinc-800 shadow-xl rounded-[20px] bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center">
              
              {mainView === 'slide' ? (
                // --- SLIDE VIEW (Active) ---
                <div className="w-full h-full relative flex items-center justify-center">
                  {isCapturing ? (
                    <video ref={screenRef} autoPlay muted playsInline className="w-full h-full object-contain" />
                  ) : pitchConfig.selectedDeck ? (
                    <iframe src={getDeckUrl(pitchConfig.selectedDeck.file_url)} className="w-full h-full border-none" title="Pitch Deck" />
                  ) : (
                    <div className="text-slate-500 text-center"><MonitorOff size={40} className="mx-auto mb-2 opacity-50" /><p className="text-[10px] font-bold uppercase tracking-widest opacity-50">No deck selected</p></div>
                  )}

                  {/* Camera PIP Thumbnail Overlay (Absolute Floating zoomed Zoom-style, ALWAYS render to enable switching) */}
                  <div 
                    onClick={() => setMainView('camera')}
                    className="absolute bottom-3 right-3 w-28 h-20 sm:w-36 sm:h-24 rounded-xl border border-white/20 shadow-2xl overflow-hidden cursor-pointer z-20 hover:scale-105 transition-all bg-black/80 flex items-center justify-center"
                  >
                    {stream ? (
                      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover animate-fade-in" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-white/40">
                        <VideoOff size={16} />
                        <span className="text-[7px] font-bold uppercase tracking-wider mt-1">Camera Off</span>
                      </div>
                    )}
                    {isPitching && stream && <div className="absolute top-1.5 right-1.5 bg-rose-500 w-1.5 h-1.5 rounded-full animate-pulse" />}
                  </div>
                </div>
              ) : (
                // --- CAMERA VIEW (Active) ---
                <div className="w-full h-full relative flex items-center justify-center">
                  {stream ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" /> : <VideoOff size={48} className="text-slate-650" />}
                  {isPitching && <div className="absolute top-3 left-3 bg-rose-500 px-2 py-0.5 rounded-full text-[8px] font-bold animate-pulse text-white uppercase tracking-widest z-10">Vision</div>}

                  {/* Slides PIP Thumbnail Overlay */}
                  <div 
                    onClick={() => setMainView('slide')}
                    className="absolute bottom-3 right-3 w-28 h-20 sm:w-36 sm:h-24 rounded-xl border border-white/20 shadow-2xl overflow-hidden cursor-pointer z-20 hover:scale-105 transition-all bg-black/80 flex items-center justify-center"
                  >
                    {isCapturing ? (
                      <video ref={screenRef} autoPlay muted playsInline className="w-full h-full object-contain pointer-events-none" />
                    ) : pitchConfig.selectedDeck ? (
                      <iframe src={getDeckUrl(pitchConfig.selectedDeck.file_url)} className="w-full h-full border-none pointer-events-none opacity-80" title="Pitch Deck Preview" />
                    ) : (
                      <MonitorOff size={18} className="text-white/40" />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Google Meet & Zoom Style bottom tray controls */}
            <div className="flex items-center justify-center gap-3.5 bg-white dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200 dark:border-zinc-855 p-2.5 rounded-2xl shadow-lg max-w-sm w-full mx-auto mt-4 shrink-0 transition-colors">
              <button onClick={toggleCamera} className={cn("w-11 h-11 rounded-xl transition-all flex items-center justify-center cursor-pointer", stream ? "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-zinc-700" : "bg-rose-500/20 text-rose-500")}>
                {stream ? <Video size={18} /> : <VideoOff size={18} />}
              </button>
              <button onClick={toggleMic} className={cn("w-11 h-11 rounded-xl transition-all flex items-center justify-center cursor-pointer", !isMicMuted ? "bg-sky-500 text-white shadow-md shadow-sky-500/20 hover:bg-sky-600" : "bg-rose-500/20 text-rose-500")}>
                {!isMicMuted ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              {canScreenShare && (
                <button onClick={toggleScreenShare} className={cn("w-11 h-11 rounded-xl transition-all flex items-center justify-center cursor-pointer", isCapturing ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-white")}>
                  {isCapturing ? <Monitor size={18} /> : <MonitorOff size={18} />}
                </button>
              )}
              <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
              <button 
                onClick={handleEndSession}
                disabled={!isConnected && !isPitching}
                className="px-5 h-11 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <VolumeX size={16} /> End Pitch
              </button>
            </div>

            {/* Small informative prompt below controls */}
            <div className="text-center mt-3 text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest animate-pulse shrink-0">
              {mainView === 'slide' ? "Tap Floating camera feed to switch screen" : "Tap Floating deck to view slides"}
            </div>

            {/* Embedded Live Chat Transcript (Directly in portrait room tab, hides in landscape) */}
            <div className="flex-1 min-h-[150px] max-h-[30vh] mt-4 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200 dark:border-zinc-800/50 rounded-2xl p-3 flex flex-col shadow-inner transition-colors portrait:flex landscape:hidden">
              <div className="flex items-center gap-2 text-slate-500 dark:text-white/50 text-[9px] font-bold uppercase tracking-widest mb-2 shrink-0">
                <MessageSquare size={12} /> Live Room Chat & Transcript
                {isSpeaking && <span className="text-sky-500 dark:text-sky-400 animate-pulse ml-auto font-medium text-[8px]">AI is responding...</span>}
              </div>
              
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar mb-2 min-h-0">
                {messages.length === 0 ? (
                  <p className="text-slate-400 dark:text-white/30 text-[10px] text-center mt-4 font-bold uppercase tracking-wider opacity-60">AI Panel is ready. Start your pitch.</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={cn("flex flex-col max-w-[85%]", m.type === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
                      <span className="text-[8px] font-bold uppercase text-slate-400 dark:text-white/30 mb-0.5 px-1 tracking-wider">
                        {m.speaker || (m.type === 'user' ? userData.name : "Panelist")}
                      </span>
                      <div className={cn(
                        "p-2 text-xs leading-relaxed",
                        m.type === 'user' ? "bg-sky-500 text-white rounded-xl rounded-tr-sm shadow-sm" : "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-100 rounded-xl rounded-tl-sm border border-slate-200 dark:border-zinc-700 shadow-sm"
                      )}>
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendChat} className="flex items-center gap-2 shrink-0 mt-auto bg-slate-100/50 dark:bg-zinc-950/50 border border-slate-200 dark:border-white/10 rounded-lg p-1">
                <input 
                  type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                  placeholder="Type a message to panel..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 px-2 outline-none"
                />
                <button type="submit" disabled={!isConnected} className="px-3 py-1.5 bg-sky-500 text-white font-bold text-slate-100 hover:text-white text-[10px] uppercase tracking-wider rounded hover:bg-sky-600 transition-colors disabled:opacity-50 cursor-pointer">
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: AI Investor Panelists List (Full viewport, clean and spacious) */}
        {activeMobileTab === 'panelists' && (
          <div className="flex-1 flex flex-col min-h-0 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border border-slate-200 dark:border-zinc-800/50 rounded-3xl p-5 shadow-xl transition-colors">
            <div className="mb-5 shrink-0">
              <h3 className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                {pitchConfig.mode === 'solo' ? 'Solo Practice' : 'AI Investor Panel'}
                {isSpeaking && <Sparkles className="text-sky-500 animate-pulse" size={14} />}
              </h3>
              <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase mt-1 tracking-wider">
                {pitchConfig.mode === 'solo' ? "No interruptions" : pitchConfig.investorArchetype}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
              {pitchConfig.mode !== 'solo' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center pb-4">
                  {visiblePersonas.map((persona, idx) => (
                    <AIPanelist 
                      key={idx}
                      name={persona.name} 
                      role={persona.role} 
                      isActive={isSpeaking && activeSpeakerName.toLowerCase().includes(persona.name.toLowerCase())} 
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center text-slate-500 text-xs mt-10">
                  AI Interruption Disabled.<br/> Record your pitch uninterrupted.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Message / Chat Transcript (Native messaging layout style) */}
        {activeMobileTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200 dark:border-zinc-800/50 rounded-3xl p-4 shadow-xl transition-colors">
            <div className="flex items-center gap-2 text-slate-500 dark:text-white/50 text-[10px] font-bold uppercase tracking-widest mb-3 shrink-0">
              <MessageSquare size={14} /> Chatbox & Transcript
              {isSpeaking && <span className="text-sky-500 dark:text-sky-400 animate-pulse ml-auto font-medium">AI is speaking...</span>}
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar mb-3 min-h-0">
              {messages.length === 0 ? <p className="text-slate-400 dark:text-white/30 text-xs text-center mt-8 font-medium tracking-wide">AI Panel is ready. Start your pitch.</p> : 
                messages.map((m) => (
                  <div key={m.id} className={cn("flex flex-col max-w-[85%]", m.type === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
                    <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-white/30 mb-1 px-1 tracking-widest">
                      {m.speaker || (m.type === 'user' ? userData.name : "Panelist")}
                    </span>
                    <div className={cn(
                      "p-3 text-sm leading-relaxed",
                      m.type === 'user' ? "bg-sky-500 text-white rounded-2xl rounded-tr-sm shadow-md" : "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-zinc-700 shadow-sm"
                    )}>
                      {m.text}
                    </div>
                  </div>
                ))
              }
            </div>

            <form onSubmit={handleSendChat} className="flex items-center gap-3 shrink-0 mt-auto bg-slate-100/50 dark:bg-zinc-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-1.5 shadow-inner">
              <input 
                type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message to the panel..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 outline-none"
              />
              <button type="submit" disabled={!isConnected} className="px-4 py-2 bg-sky-500 text-white font-bold text-slate-100 hover:text-white text-xs uppercase tracking-wider rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 shadow-md cursor-pointer">
                Send
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Vitals and Charts Monitor (Clean metrics display) */}
        {activeMobileTab === 'vitals' && (
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar min-h-0">
            
            {/* Live Boardroom Vitals */}
            <div className="bg-white/70 dark:bg-zinc-900/45 backdrop-blur-xl rounded-[24px] p-5 border border-slate-200 dark:border-zinc-850 shadow-xl flex flex-col shrink-0 transition-colors">
              <div className="flex items-center gap-2 text-slate-500 dark:text-white/50 text-[10px] font-bold uppercase tracking-widest shrink-0 mb-3.5">
                <Activity size={14} /> Live Session Monitor
              </div>
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-white/80 uppercase tracking-widest mb-3.5">Boardroom Vitals</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-455 font-medium">Brain Link</span>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", isConnected ? "text-emerald-500 dark:text-emerald-450" : "text-rose-500 dark:text-rose-455")}>
                    {isConnected ? "Connected" : "Offline"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-455 font-medium">Audio Pipeline</span>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", stream && !isMicMuted ? "text-sky-600 dark:text-sky-400" : "text-rose-500 dark:text-rose-455")}>
                    {stream && !isMicMuted ? "Active" : "Muted"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-455 font-medium">Vision Input</span>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", stream ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500")}>
                    {stream ? "Active" : "Disabled"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-455 font-medium">Interactive Sharing</span>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", isCapturing ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-slate-500")}>
                    {isCapturing ? "Casting" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Dialogue Analytics Data Chart */}
            {(() => {
              const userMsgCount = messages.filter(m => m.type === 'user').length;
              const aiMsgCount = messages.filter(m => m.type === 'ai').length;
              const totalMsgCount = userMsgCount + aiMsgCount;
              const dialogueBalance = totalMsgCount > 0 ? Math.round((userMsgCount / totalMsgCount) * 100) : 50;

              return (
                <div className="bg-white/70 dark:bg-zinc-900/45 backdrop-blur-xl rounded-[24px] p-5 border border-slate-200 dark:border-zinc-850 flex flex-col justify-between shadow-xl min-h-[140px] shrink-0 transition-colors">
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-white/80 uppercase tracking-widest mb-3.5">Data Chart</h4>
                  
                  <div className="flex items-end justify-between h-20 gap-3.5 pb-2 border-b border-slate-200 dark:border-white/10">
                    {[dialogueBalance, 100-dialogueBalance, Math.max(20, dialogueBalance-10), Math.min(90, dialogueBalance+20), 60, 45].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end group animate-all">
                        <div 
                          className="w-full rounded-t-sm transition-all duration-500 bg-gradient-to-t from-sky-600 to-sky-400 opacity-80 group-hover:opacity-100" 
                          style={{ height: `${val}%` }} 
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mt-3.5">
                    <span>Founder</span>
                    <span>Dynamics</span>
                    <span>Panel</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* MOBILE BOTTOM TAB BAR TRAY (Google Meet / Zoom responsive bar) */}
      {/* ============================================================== */}
      <div className="lg:hidden flex justify-around items-center bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 py-3 px-4 shrink-0 shadow-lg z-30 transition-colors">
        <button 
          onClick={() => setActiveMobileTab('room')}
          className={cn("flex flex-col items-center gap-1 cursor-pointer transition-all", activeMobileTab === 'room' ? "text-sky-500 scale-105" : "text-slate-400 dark:text-zinc-500")}
        >
          <Video size={19} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Room</span>
        </button>
        <button 
          onClick={() => setActiveMobileTab('panelists')}
          className={cn("flex flex-col items-center gap-1 cursor-pointer transition-all", activeMobileTab === 'panelists' ? "text-sky-500 scale-105" : "text-slate-400 dark:text-zinc-500")}
        >
          <Users size={19} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Panelists</span>
        </button>
        <button 
          onClick={() => setActiveMobileTab('vitals')}
          className={cn("flex flex-col items-center gap-1 cursor-pointer transition-all", activeMobileTab === 'vitals' ? "text-sky-500 scale-105" : "text-slate-400 dark:text-zinc-500")}
        >
          <Activity size={19} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Monitor</span>
        </button>
      </div>

      <AnimatePresence>
        {isEvaluatingPitch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-gradient-to-b from-slate-950 via-slate-900 to-zinc-950 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-8">
              <Loader2 className="animate-spin text-sky-500" size={64} />
              <div className="absolute inset-0 animate-ping opacity-25 rounded-full border border-sky-400 scale-125" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight">{loadingStatus}</h2>
            <p className="text-sky-450/80 max-w-sm text-sm font-medium tracking-wide">Please wait while Gemini evaluates your pitch dynamics and calculates readiness scoring.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
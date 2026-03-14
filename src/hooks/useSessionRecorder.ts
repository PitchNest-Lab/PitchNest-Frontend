import { useState, useEffect, useRef, useCallback } from 'react';
import { SessionMetricEntry, SentimentScores, SessionRecord, TranscriptEntry } from '../types';

export const useSessionRecorder = (
  isConnected: boolean, 
  sentiment: SentimentScores, 
  volume: number,
  transcript: TranscriptEntry[]
) => {
  const [metrics, setMetrics] = useState<SessionMetricEntry[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>(`session_${Date.now()}`);
  const lastRecordedSentiment = useRef<string>("");
  const lastVolumeRecordTime = useRef<number>(0);

  // Start session timer when connected
  useEffect(() => {
    if (isConnected && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      setMetrics([]);
      lastRecordedSentiment.current = "";
      lastVolumeRecordTime.current = 0;
    }
  }, [isConnected]);

  // Record metrics
  useEffect(() => {
    if (!isConnected || !startTimeRef.current) return;

    const now = Date.now();
    const timestamp = now - startTimeRef.current;
    const sentimentStr = JSON.stringify(sentiment);
    
    // Record if sentiment changed OR if volume is significant and it's been a while
    const sentimentChanged = sentimentStr !== lastRecordedSentiment.current;
    const shouldRecordVolume = now - lastVolumeRecordTime.current > 1000; // Sample volume every 1s to keep data manageable

    if (sentimentChanged || shouldRecordVolume) {
      setMetrics(prev => [...prev, {
        timestamp,
        sentiment: { ...sentiment },
        volume: Math.round(volume * 100) / 100
      }]);
      
      if (sentimentChanged) lastRecordedSentiment.current = sentimentStr;
      if (shouldRecordVolume) lastVolumeRecordTime.current = now;
    }
  }, [isConnected, sentiment, volume]);

  const saveSession = useCallback(() => {
    if (!startTimeRef.current) {
      console.warn("Cannot save session: No start time recorded.");
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    
    const sessionRecord: SessionRecord = {
      id: sessionIdRef.current,
      startTime: new Date(startTimeRef.current).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration,
      metrics,
      transcript
    };

    try {
      const existingSessionsJson = localStorage.getItem('pitch_sessions');
      const existingSessions = existingSessionsJson ? JSON.parse(existingSessionsJson) : [];
      
      // Keep only last 10 sessions to avoid localStorage limits
      const updatedSessions = [...existingSessions, sessionRecord].slice(-10);
      
      localStorage.setItem('pitch_sessions', JSON.stringify(updatedSessions));
      localStorage.setItem('last_session_id', sessionRecord.id);
      
      console.log(`Session ${sessionRecord.id} saved. Entries: ${metrics.length}`);
      return sessionRecord.id;
    } catch (e) {
      console.error("Failed to save session to localStorage:", e);
      return null;
    }
  }, [metrics, transcript]);

  return { saveSession, sessionId: sessionIdRef.current };
};

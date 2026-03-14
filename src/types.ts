export interface SentimentScores {
  confidence: number;
  skepticism: number;
  interest: number;
}

export interface TranscriptEntry {
  id: string;
  text: string;
  type: 'user' | 'ai';
}

export interface SessionMetricEntry {
  timestamp: number; // relative to start in ms
  sentiment: SentimentScores;
  volume: number;
}

export interface SessionRecord {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  metrics: SessionMetricEntry[];
  transcript: TranscriptEntry[];
}

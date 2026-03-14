import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";
import { useLiveAudio } from './useLiveAudio';
import { mapSentimentToScore } from '../lib/sentiment';
import { SentimentScores } from '../types';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // AI is speaking
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<{ text: string; type: 'user' | 'ai'; id: string }[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<{ text: string; type: 'user' | 'ai' } | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<SentimentScores>({ confidence: 50, skepticism: 30, interest: 40 });
  
  const sessionRef = useRef<any>(null);

  const onAudioData = useCallback((base64: string) => {
    if (sessionRef.current && isConnected) {
      sessionRef.current.sendRealtimeInput({
        media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
      });
    }
  }, [isConnected]);

  const onBargeIn = useCallback(() => {
    setIsUserSpeaking(true);
    // The useLiveAudio hook already handles stopping local playback
  }, []);

  const { volume, startCapture, playChunk, stopPlayback, cleanup } = useLiveAudio(onAudioData, onBargeIn);

  useEffect(() => {
    if (volume < 0.01 && isUserSpeaking) {
      setIsUserSpeaking(false);
    }
  }, [volume, isUserSpeaking]);

  const connect = useCallback(async () => {
    if (sessionRef.current) return;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    try {
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction: `You are a panel of three diverse venture capitalists:
Dr. Aris (The Skeptic): Focused on unit economics and potential failure points. Grumpy but fair.
Sarah AI (The Analyst): Data-driven, obsessed with market size and CAC/LTV.
Marcus AI (The Visionary): Looks for "Big Picture" impact and founder-market fit.

Rules of Interaction:
1. Multimodal Awareness: You can see the user's pitch deck and their camera. Reference specific slide numbers (e.g., "I'm looking at your competition slide...").
2. Coordination: Speak one at a time, but feel free to disagree with each other. Reference what a previous panelist said (e.g., "I disagree with Sarah; I think the founder's vision outweighs the current churn rate.").
3. Output Format: For every response, you must trigger a tool call update_panelist_status with the speakerId ('aris', 'sarah', or 'marcus') so the frontend can highlight who is speaking.`,
          tools: [{
            functionDeclarations: [{
              name: "update_panelist_status",
              description: "Updates which panelist is currently speaking.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  speakerId: {
                    type: Type.STRING,
                    description: "The ID of the speaker ('aris', 'sarah', 'marcus').",
                    enum: ["aris", "sarah", "marcus"]
                  }
                },
                required: ["speakerId"]
              }
            }]
          }],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live connected");
            setIsConnected(true);
            startCapture();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Tool Calls
            if (message.toolCall) {
              for (const call of message.toolCall.functionCalls) {
                if (call.name === 'update_panelist_status') {
                  const { speakerId } = call.args as { speakerId: string };
                  setActiveSpeakerId(speakerId);
                  
                  // Send response back to Gemini (required by protocol)
                  sessionRef.current?.sendToolResponse({
                    functionResponses: [{
                      name: "update_panelist_status",
                      id: call.id,
                      response: { success: true }
                    }]
                  });
                }
              }
            }

            if (message.serverContent?.interrupted) {
              console.log("AI Interrupted by user");
              stopPlayback();
              // If AI was speaking, push current active transcript to history
              setActiveTranscript(prev => {
                if (prev && prev.type === 'ai' && prev.text.trim()) {
                  setTranscript(history => [...history, { ...prev, id: Math.random().toString(36).substr(2, 9) }]);
                }
                return null;
              });
            }

            // Handle AI Audio
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              playChunk(base64Audio);
              setIsSpeaking(true);
            }

            // Handle AI Transcription
            const modelParts = message.serverContent?.modelTurn?.parts;
            if (modelParts) {
              for (const part of modelParts) {
                if (part.text) {
                  const text = part.text.toLowerCase();
                  if (text.includes("next slide") || text.includes("next frame")) {
                    window.dispatchEvent(new CustomEvent('pitchnest:next-slide'));
                  } else if (text.includes("previous slide") || text.includes("go back")) {
                    window.dispatchEvent(new CustomEvent('pitchnest:prev-slide'));
                  }

                  setActiveTranscript(prev => {
                    const newText = prev && prev.type === 'ai' ? prev.text + part.text : part.text;
                    
                    // Update sentiment based on AI text
                    if (newText.length % 10 === 0 || part.text.length > 5) { // Throttle updates slightly
                      setSentiment(mapSentimentToScore(newText));
                    }

                    if (prev && prev.type === 'ai') {
                      return { ...prev, text: newText };
                    }
                    return { text: part.text, type: 'ai' };
                  });
                }
              }
            }

            // Handle User Transcription
            const userTurn = (message.serverContent as any)?.userTurn;
            const userParts = userTurn?.parts;
            if (userParts) {
              for (const part of userParts) {
                if (part.text) {
                  const text = part.text.toLowerCase();
                  if (text.includes("next slide") || text.includes("next frame")) {
                    window.dispatchEvent(new CustomEvent('pitchnest:next-slide'));
                  } else if (text.includes("previous slide") || text.includes("go back")) {
                    window.dispatchEvent(new CustomEvent('pitchnest:prev-slide'));
                  }

                  setActiveTranscript(prev => {
                    if (prev && prev.type === 'user') {
                      return { ...prev, text: prev.text + part.text };
                    }
                    // If we were previously showing AI text, push it to history
                    if (prev && prev.type === 'ai' && prev.text.trim()) {
                      setTranscript(history => [...history, { ...prev, id: Math.random().toString(36).substr(2, 9) }]);
                    }
                    return { text: part.text, type: 'user' };
                  });
                }
              }
            }

            if (message.serverContent?.turnComplete) {
              setIsSpeaking(false);
              setActiveSpeakerId(null);
              setActiveTranscript(prev => {
                if (prev && prev.text.trim()) {
                  setTranscript(history => [...history, { ...prev, id: Math.random().toString(36).substr(2, 9) }]);
                }
                return null;
              });
            }
          },
          onclose: () => {
            console.log("Gemini Live closed");
            setIsConnected(false);
            sessionRef.current = null;
            cleanup();
          },
          onerror: (error) => {
            console.error("Gemini Live error:", error);
          }
        }
      });

      sessionRef.current = session;
    } catch (err) {
      console.error("Failed to connect to Gemini Live:", err);
    }
  }, [startCapture, playChunk, stopPlayback, cleanup]);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    cleanup();
    setIsConnected(false);
  }, [cleanup]);

  const sendImage = useCallback((base64Data: string, slideIndex: number) => {
    if (sessionRef.current && isConnected) {
      // Send the image frame
      sessionRef.current.sendRealtimeInput({
        media: { data: base64Data, mimeType: 'image/jpeg' }
      });
      
      // Tag the frame with the current slide index so Gemini knows the context
      sessionRef.current.sendRealtimeInput({
        text: `[System: User is currently viewing Slide ${slideIndex}]`
      });
    }
  }, [isConnected]);

  return {
    isConnected,
    isSpeaking,
    isUserSpeaking,
    activeSpeakerId,
    volume,
    transcript,
    activeTranscript,
    sentiment,
    connect,
    disconnect,
    sendImage
  };
};

import { useState, useRef, useCallback } from 'react';

export const useMediaRecorder = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startStream = useCallback(async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        // 🚨 FIX: Advanced Audio Constraints added here!
        audio: {
          echoCancellation: true, // Stops the mic from hearing the AI speaking
          noiseSuppression: true, // Blocks fans, typing, and background hums
          autoGainControl: true   // Keeps your voice volume steady
        },
      });
      setStream(newStream);
      return newStream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      return null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startRecording = useCallback(() => {
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
    });

    mediaRecorderRef.current = mediaRecorder;
    setRecordedChunks([]);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    mediaRecorder.start();
    setIsRecording(true);
  }, [stream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const getBlob = useCallback(() => {
    if (recordedChunks.length === 0) return null;
    return new Blob(recordedChunks, { type: 'video/webm' });
  }, [recordedChunks]);

  return {
    stream,
    isRecording,
    startStream,
    stopStream,
    startRecording,
    stopRecording,
    getBlob,
  };
};
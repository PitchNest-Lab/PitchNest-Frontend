import { useState, useRef, useCallback } from 'react';

export const useMediaRecorder = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // ADD

  const startStream = useCallback(async () => {
    // Audio-only: camera recording is disabled for now, so we never request
    // video. This means the founder is never prompted for camera access and the
    // camera light stays off — only the microphone is acquired.
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      });
      streamRef.current = newStream;
      setStream(newStream);
      return newStream;
    } catch (err) {
      console.error("Error accessing microphone:", err);
      return null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : '',
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
  }, []);

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
    streamRef,   // ADD: expose so LivePitchRoom can use it stably
    isRecording,
    startStream,
    stopStream,
    startRecording,
    stopRecording,
    getBlob,
  };
};
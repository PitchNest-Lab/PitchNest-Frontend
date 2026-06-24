import { useState, useRef, useCallback } from 'react';

export const useMediaRecorder = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // ADD

  const startStream = useCallback(async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 360 },
          facingMode: "user"
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      });
      streamRef.current = newStream; // ADD
      setStream(newStream);
      return newStream;
    } catch (err) {
      console.warn("Error accessing video/audio devices, trying audio-only fallback...", err);
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
        });
        streamRef.current = audioOnlyStream; // ADD
        setStream(audioOnlyStream);
        return audioOnlyStream;
      } catch (err2) {
        console.error("Error accessing audio fallback device:", err2);
        return null;
      }
    }
  }, []); // CHANGE: empty deps, no longer needs stream

  // FIX: use ref instead of state — stopStream is now stable (never recreated)
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []); // CHANGE: empty deps — this function never changes identity now

  const startRecording = useCallback(() => {
    if (!streamRef.current) return; // CHANGE: use ref
    const mediaRecorder = new MediaRecorder(streamRef.current, { // CHANGE: use ref
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
  }, []); // CHANGE: empty deps — uses ref, not state

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
import { useState, useRef, useCallback } from 'react';

/**
 * VOICE ENHANCEMENT (req 2). The browser's own audio processing chain is the
 * cheapest and lowest-latency place to clean up the founder's microphone, and it
 * runs before we ever see a sample — so the WebSocket upstream and Azure STT both
 * receive the already-processed signal at no extra cost on the critical path:
 *
 *   • echoCancellation  — stops the panel's TTS coming back in through the mic,
 *                         which is what makes the AI interrupt itself
 *   • noiseSuppression  — removes steady background noise (fans, traffic, hum)
 *   • autoGainControl   — levels a founder who leans in and out of the mic
 *
 * These are hints, not requirements: a browser that does not implement one
 * silently ignores it rather than failing, which is exactly the graceful
 * degradation we want. `ENHANCED_AUDIO` is nonetheless tried first and
 * `PLAIN_AUDIO` kept as a fallback, because a device can still reject the whole
 * constraint set (OverconstrainedError on some Android/WebView builds), and
 * losing noise suppression is far better than losing the microphone.
 */
const ENHANCED_AUDIO: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

/** Audio containers in preference order. The first supported one wins. */
const AUDIO_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4', // Safari
  'audio/ogg;codecs=opus',
];

/** Pick a supported audio container, or '' to let the browser choose. */
function pickAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const candidate of AUDIO_MIME_CANDIDATES) {
    try {
      if (MediaRecorder.isTypeSupported(candidate)) return candidate;
    } catch {
      /* isTypeSupported can throw on old WebViews — try the next one */
    }
  }
  return '';
}

export const useMediaRecorder = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  /** Container the recorder actually used, so the blob is tagged truthfully. */
  const recordedMimeRef = useRef<string>('');

  const startStream = useCallback(async () => {
    // Audio-only: camera recording is disabled for now, so we never request
    // video. This means the founder is never prompted for camera access and the
    // camera light stays off — only the microphone is acquired.
    let newStream: MediaStream | null = null;
    try {
      newStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: ENHANCED_AUDIO,
      });
    } catch (err) {
      // Permission denial and "no device" must NOT be retried — the second
      // prompt fails the same way and only delays the founder. Only an
      // unsatisfiable constraint set is worth a plainer second attempt.
      const name = (err as DOMException)?.name;
      if (name === 'NotAllowedError' || name === 'NotFoundError') {
        console.error('Error accessing microphone:', err);
        return null;
      }
      console.warn(
        'Enhanced audio constraints rejected, retrying with plain audio:',
        err,
      );
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
      } catch (fallbackErr) {
        console.error('Error accessing microphone:', fallbackErr);
        return null;
      }
    }

    streamRef.current = newStream;
    setStream(newStream);
    return newStream;
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
    // Record the AUDIO TRACKS ONLY. The stream is already audio-only today, but
    // asking for the tracks explicitly means a future change that adds a camera
    // preview cannot silently start recording the founder's video.
    const audioOnly = new MediaStream(streamRef.current.getAudioTracks());
    if (audioOnly.getAudioTracks().length === 0) return;

    const mimeType = pickAudioMimeType();
    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = mimeType
        ? new MediaRecorder(audioOnly, { mimeType })
        : new MediaRecorder(audioOnly);
    } catch {
      // A supported-looking container the constructor still refuses: fall back
      // to the browser's own default rather than dropping the recording.
      mediaRecorder = new MediaRecorder(audioOnly);
    }
    recordedMimeRef.current = mediaRecorder.mimeType || mimeType || 'audio/webm';

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
    // Tag the blob with what was actually recorded. Mislabelling audio as
    // 'video/webm' made the replay page treat a perfectly good recording as a
    // video it could not play.
    const type =
      recordedChunks[0]?.type || recordedMimeRef.current || 'audio/webm';
    return new Blob(recordedChunks, { type });
  }, [recordedChunks]);

  return {
    stream,
    streamRef,
    isRecording,
    startStream,
    stopStream,
    startRecording,
    stopRecording,
    getBlob,
  };
};

import { useState, useCallback, useRef, useEffect } from 'react';

export const useScreenCapture = (onFrame?: (base64: string, slideIndex: number) => void) => {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [slideIndex, setSlideIndex] = useState(1);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const slideIndexRef = useRef(1);

  // Keep ref in sync for the interval closure
  useEffect(() => {
    slideIndexRef.current = slideIndex;
  }, [slideIndex]);

  const nextSlide = useCallback(() => {
    setSlideIndex(prev => prev + 1);
  }, []);

  const prevSlide = useCallback(() => {
    setSlideIndex(prev => Math.max(1, prev - 1));
  }, []);

  // Global listener for 'Next' command
  useEffect(() => {
    const handleNext = () => nextSlide();
    const handlePrev = () => prevSlide();
    
    window.addEventListener('pitchnest:next-slide', handleNext);
    window.addEventListener('pitchnest:prev-slide', handlePrev);
    
    return () => {
      window.removeEventListener('pitchnest:next-slide', handleNext);
      window.removeEventListener('pitchnest:prev-slide', handlePrev);
    };
  }, [nextSlide, prevSlide]);

  const stopCapture = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsCapturing(false);
  }, [screenStream]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !onFrame) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to JPEG for smaller size
      const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      onFrame(base64, slideIndexRef.current);
    }
  }, [onFrame]);

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: false
      });

      setScreenStream(stream);
      setIsCapturing(true);

      // Create hidden video element to process frames
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      videoRef.current = video;

      // Create hidden canvas
      const canvas = document.createElement('canvas');
      canvasRef.current = canvas;

      // Start interval
      intervalRef.current = setInterval(captureFrame, 2000);

      // Handle stream stop (e.g. user clicks "Stop sharing" in browser UI)
      stream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };

      return stream;
    } catch (err) {
      console.error("Error starting screen capture:", err);
      return null;
    }
  }, [captureFrame, stopCapture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (screenStream) screenStream.getTracks().forEach(track => track.stop());
    };
  }, [screenStream]);

  return {
    screenStream,
    isCapturing,
    slideIndex,
    nextSlide,
    prevSlide,
    startCapture,
    stopCapture
  };
};

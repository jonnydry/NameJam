import { useState, useEffect, useRef } from 'react';

interface UseLoadingProgressOptions {
  estimatedDuration?: number;
  onComplete?: () => void;
}

export function useLoadingProgress({ 
  estimatedDuration = 3000, 
  onComplete 
}: UseLoadingProgressOptions = {}) {
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [isComplete, setIsComplete] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start loading
  const startLoading = () => {
    startTimeRef.current = Date.now();
    setProgress(undefined); // Indeterminate initially
    setIsComplete(false);
    
    // Simulate progress stages based on typical API flow
    progressIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        
        // Simulate stages:
        // 0-300ms: Initial request (0-20%)
        // 300-800ms: API processing (20-60%)
        // 800ms+: Waiting for response (60-90%)
        if (elapsed < 300) {
          setProgress(Math.min(20, (elapsed / 300) * 20));
        } else if (elapsed < 800) {
          setProgress(20 + Math.min(40, ((elapsed - 300) / 500) * 40));
        } else {
          // Slow down after 60%
          const slowProgress = 60 + Math.min(30, ((elapsed - 800) / (estimatedDuration - 800)) * 30);
          setProgress(Math.min(90, slowProgress));
        }
      }
    }, 50);
  };

  // Complete loading
  const completeLoading = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    // Quickly animate to 100%
    let currentProgress = progress || 90;
    const completeInterval = setInterval(() => {
      currentProgress = Math.min(100, currentProgress + 5);
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(completeInterval);
        setTimeout(() => {
          setIsComplete(true);
          onComplete?.();
        }, 200); // Brief pause at 100%
      }
    }, 20);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return {
    progress,
    isComplete,
    startLoading,
    completeLoading,
    estimatedDuration
  };
}
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Hook to detect if user prefers reduced motion for accessibility
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to observe element intersection using IntersectionObserver
 */
export function useIntersection<T extends Element>(
  ref: React.RefObject<T>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return { isIntersecting, hasIntersected };
}

interface UseTypewriterOptions {
  speed?: number; // characters per second
  isActive?: boolean;
  onComplete?: () => void;
}

interface UseTypewriterReturn {
  displayText: string;
  isComplete: boolean;
  complete: () => void;
}

/**
 * Main typewriter animation hook with RAF-based timing
 */
export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
): UseTypewriterReturn {
  const {
    speed = 30, // 30 characters per second default
    isActive = true,
    onComplete
  } = options;

  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  
  const prefersReducedMotion = usePrefersReducedMotion();
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const currentIndexRef = useRef(0);
  const cursorIntervalRef = useRef<NodeJS.Timeout>();
  const isManuallyCompletedRef = useRef(false);

  // Split text into lines for multi-line support
  const lines = useMemo(() => text.split('\n'), [text]);
  const totalLength = useMemo(() => text.replace(/\n/g, '').length, [text]);

  // Calculate which line and character position based on current index
  const getDisplayTextFromIndex = useCallback((index: number) => {
    if (index <= 0) return '';
    if (index >= totalLength) return text;

    let charCount = 0;
    let result = '';
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineEnd = charCount + line.length;
      
      if (index <= lineEnd) {
        // Current line is being typed
        result += line.substring(0, index - charCount);
        break;
      } else {
        // Complete line + newline
        result += line;
        if (lineIndex < lines.length - 1) {
          result += '\n';
        }
        charCount = lineEnd;
      }
    }
    
    return result;
  }, [lines, text, totalLength]);

  // Cursor blinking animation
  useEffect(() => {
    if (isComplete || !isActive) {
      setShowCursor(false);
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
      return;
    }

    cursorIntervalRef.current = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530); // Slightly offset from typical 500ms for more natural feel

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, [isComplete, isActive]);

  // Instant complete function
  const complete = useCallback(() => {
    isManuallyCompletedRef.current = true;
    currentIndexRef.current = totalLength;
    setDisplayText(text);
    setIsComplete(true);
    setShowCursor(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    onComplete?.();
  }, [text, totalLength, onComplete]);

  // Main animation effect
  useEffect(() => {
    // Reset state when text changes
    currentIndexRef.current = 0;
    setDisplayText('');
    setIsComplete(false);
    setShowCursor(true);
    isManuallyCompletedRef.current = false;
    startTimeRef.current = undefined;

    // Handle reduced motion or inactive state
    if (prefersReducedMotion || !isActive) {
      complete();
      return;
    }

    // Handle empty text
    if (!text || totalLength === 0) {
      setIsComplete(true);
      setShowCursor(false);
      return;
    }

    const animate = (currentTime: number) => {
      if (isManuallyCompletedRef.current) return;

      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const expectedIndex = Math.floor((elapsed / 1000) * speed);
      const targetIndex = Math.min(expectedIndex, totalLength);

      if (targetIndex > currentIndexRef.current) {
        currentIndexRef.current = targetIndex;
        const newDisplayText = getDisplayTextFromIndex(currentIndexRef.current);
        setDisplayText(newDisplayText);
      }

      if (currentIndexRef.current >= totalLength) {
        setIsComplete(true);
        setShowCursor(false);
        onComplete?.();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [text, speed, isActive, prefersReducedMotion, totalLength, getDisplayTextFromIndex, onComplete, complete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, []);

  // Format display text with cursor
  const finalDisplayText = useMemo(() => {
    if (isComplete) return displayText;
    return displayText + (showCursor ? '|' : '');
  }, [displayText, showCursor, isComplete]);

  return {
    displayText: finalDisplayText,
    isComplete,
    complete,
  };
}
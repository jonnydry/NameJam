import { useRef } from 'react';
import { useTypewriter, useIntersection, usePrefersReducedMotion } from '@/hooks/use-typewriter';

interface LyricTypewriterProps {
  text: string;
  speed?: number; // characters per second (default 50)
  onComplete?: () => void;
  className?: string;
}

export default function LyricTypewriter({ 
  text, 
  speed = 50, 
  onComplete, 
  className = '' 
}: LyricTypewriterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // Use intersection observer to only start animation when visible
  const { isIntersecting, hasIntersected } = useIntersection(containerRef, {
    threshold: 0.1,
    rootMargin: '50px'
  });

  // Determine if animation should be active
  const shouldAnimate = (isIntersecting || hasIntersected) && !prefersReducedMotion;

  // Use the typewriter hook (it already handles cursor internally)
  const { displayText, isComplete, complete } = useTypewriter(text, {
    speed,
    isActive: shouldAnimate,
    onComplete
  });

  // Handle click to complete
  const handleClick = () => {
    if (!isComplete) {
      complete();
    }
  };

  // Check if text is multiline
  const isMultiline = text.includes('\n');

  return (
    <div 
      ref={containerRef}
      onClick={handleClick}
      className={`cursor-pointer transition-opacity duration-200 ${className}`}
      data-testid="lyric-typewriter-container"
      title={!isComplete ? "Click to complete" : undefined}
    >
      {isMultiline ? (
        <div className="space-y-0" data-testid="lyric-typewriter-multiline">
          {displayText.split('\n').map((line, index) => (
            <div 
              key={index}
              className={`text-lg sm:text-xl font-light leading-relaxed text-gray-100 ${
                index > 0 ? 'mt-2' : ''
              }`}
              data-testid={`lyric-typewriter-line-${index}`}
            >
              <span className="italic tracking-wide">
                {line}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <span 
          className="text-lg sm:text-xl font-light italic leading-relaxed text-gray-100 tracking-wide"
          data-testid="lyric-typewriter-single-line"
        >
          {displayText}
        </span>
      )}
    </div>
  );
}
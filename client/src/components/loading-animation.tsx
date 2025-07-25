import { useEffect, useState } from 'react';

interface LoadingAnimationProps {
  stage: 'generating' | 'verifying';
  actualProgress?: number; // 0-100, undefined means indeterminate
  estimatedDuration?: number; // milliseconds
}

export function LoadingAnimation({ stage, actualProgress, estimatedDuration = 3000 }: LoadingAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [animationTime, setAnimationTime] = useState(0);
  const [barPattern, setBarPattern] = useState<Array<{x: number, baseHeight: number, frequency: number, amplitude: number, delay: number}>>([]);
  const [startTime] = useState(Date.now());

  // Generate unique random bar pattern on mount
  useEffect(() => {
    const barCount = 40;
    const bars = [];
    
    for (let i = 0; i < barCount; i++) {
      bars.push({
        x: i * 8 + 4,
        baseHeight: Math.random() * 25 + 8, // Random base height between 8-33
        frequency: Math.random() * 0.003 + 0.001, // Random oscillation speed
        amplitude: Math.random() * 12 + 3, // Random amplitude for up/down movement
        delay: Math.random() * Math.PI * 2, // Random phase offset
      });
    }
    setBarPattern(bars);
  }, [stage]); // Regenerate pattern when stage changes

  useEffect(() => {
    // Use actual progress if provided, otherwise use time-based estimation
    if (actualProgress !== undefined) {
      setProgress(actualProgress);
    } else {
      // Indeterminate progress - slower, more realistic progression
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        setAnimationTime(elapsed);
        
        // Non-linear progress curve - starts fast, slows down
        // This creates a more realistic loading experience
        let estimatedProgress = 0;
        if (elapsed < estimatedDuration * 0.2) {
          // First 20% of time = 50% progress (fast start)
          estimatedProgress = (elapsed / (estimatedDuration * 0.2)) * 50;
        } else if (elapsed < estimatedDuration * 0.8) {
          // Next 60% of time = 40% progress (steady middle)
          const adjustedElapsed = elapsed - (estimatedDuration * 0.2);
          estimatedProgress = 50 + (adjustedElapsed / (estimatedDuration * 0.6)) * 40;
        } else {
          // Last 20% of time = 10% progress (slow end, never reaches 100%)
          const adjustedElapsed = elapsed - (estimatedDuration * 0.8);
          estimatedProgress = 90 + (adjustedElapsed / (estimatedDuration * 0.2)) * 8;
          // Cap at 98% to show we're still loading
          estimatedProgress = Math.min(estimatedProgress, 98);
        }
        
        setProgress(estimatedProgress);
        requestAnimationFrame(updateProgress);
      };
      
      const animationFrame = requestAnimationFrame(updateProgress);
      
      return () => {
        cancelAnimationFrame(animationFrame);
      };
    }
  }, [actualProgress, estimatedDuration, startTime]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {stage === 'generating' ? (
        <>
          {/* Equalizer Loading Animation */}
          <div className="relative w-80 h-20">
            <svg viewBox="0 0 320 80" className="w-full h-full">
              {/* Animated Equalizer bars */}
              {barPattern.map((bar, i) => {
                const isActive = (i / 40) * 100 <= progress;
                const isNearActive = Math.abs((i / 40) * 100 - progress) < 15;
                
                // Calculate animated height using sine wave with random parameters
                const animatedHeightModifier = Math.sin(animationTime * bar.frequency + bar.delay) * bar.amplitude;
                const currentHeight = Math.max(4, bar.baseHeight + animatedHeightModifier);
                
                // Add extra bounce for active and near-active bars
                const bounceMultiplier = isActive ? 1.4 : (isNearActive ? 1.2 : 1);
                const finalHeight = currentHeight * bounceMultiplier;
                
                return (
                  <rect
                    key={i}
                    x={bar.x}
                    y={40 - finalHeight / 2}
                    width="6"
                    height={finalHeight}
                    rx="1"
                    fill="currentColor"
                    className={
                      isActive 
                        ? "text-primary" 
                        : isNearActive 
                        ? "text-primary/50"
                        : "text-muted-foreground/30"
                    }
                    style={{
                      filter: isActive ? 'drop-shadow(0 0 6px currentColor)' : 
                             isNearActive ? 'drop-shadow(0 0 3px currentColor)' : 'none',
                      transition: 'fill 0.3s ease, filter 0.3s ease',
                    }}
                  />
                );
              })}
              
              {/* Progress bar below */}
              <rect
                x="0"
                y="70"
                width="320"
                height="3"
                fill="currentColor"
                className="text-muted-foreground/20"
                rx="1.5"
              />
              <rect
                x="0"
                y="70"
                width={progress * 3.2}
                height="3"
                fill="currentColor"
                className="text-primary"
                rx="1.5"
                style={{
                  filter: 'drop-shadow(0 0 4px currentColor)',
                }}
              />
            </svg>
          </div>
          <div className="text-lg text-foreground font-medium tracking-wide">Composing unique names...</div>
          <div className="text-sm text-muted-foreground">Mixing the perfect sound</div>
        </>
      ) : (
        <>
          {/* Verification Loading Animation with spinning record */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/10 animate-spin">
              <div className="absolute inset-2 rounded-full bg-background"></div>
              <div className="absolute inset-4 rounded-full bg-primary/20"></div>
              <div className="absolute inset-6 rounded-full bg-background"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
            </div>
          </div>
          <div className="text-lg text-foreground font-medium">Verifying availability...</div>
          <div className="text-sm text-muted-foreground">Checking music databases</div>
        </>
      )}
    </div>
  );
}

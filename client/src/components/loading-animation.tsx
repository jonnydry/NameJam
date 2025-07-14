import { useEffect, useState } from 'react';

interface LoadingAnimationProps {
  stage: 'generating' | 'verifying';
}

export function LoadingAnimation({ stage }: LoadingAnimationProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = stage === 'generating' ? 3000 : 2000;
    const startTime = Date.now();
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      }
    };
    
    requestAnimationFrame(updateProgress);
    
    return () => setProgress(0);
  }, [stage]);

  // Generate equalizer bars with varying heights
  const generateEqualizerBars = () => {
    const barCount = 40;
    const bars = [];
    
    for (let i = 0; i < barCount; i++) {
      // Create varying heights using sine waves for smooth variation
      const baseHeight = 20;
      const variation = 
        Math.sin(i * 0.3) * 15 + 
        Math.sin(i * 0.7) * 10 + 
        Math.sin(i * 1.2) * 5;
      const height = Math.max(5, baseHeight + variation);
      
      bars.push({
        x: i * 8 + 4,
        height: height,
        delay: i * 0.02,
      });
    }
    return bars;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {stage === 'generating' ? (
        <>
          {/* Equalizer Loading Animation */}
          <div className="relative w-80 h-20">
            <svg viewBox="0 0 320 80" className="w-full h-full">
              {/* Equalizer bars */}
              {generateEqualizerBars().map((bar, i) => {
                const isActive = (i / 40) * 100 <= progress;
                const isNearActive = Math.abs((i / 40) * 100 - progress) < 10;
                
                return (
                  <rect
                    key={i}
                    x={bar.x}
                    y={40 - bar.height / 2}
                    width="6"
                    height={bar.height}
                    rx="1"
                    fill="currentColor"
                    className={
                      isActive 
                        ? "text-primary" 
                        : "text-muted-foreground/30"
                    }
                    style={{
                      transform: isNearActive ? `scaleY(${1 + Math.sin(Date.now() * 0.01 + i) * 0.3})` : 'scaleY(1)',
                      transformOrigin: 'center',
                      transition: 'all 0.3s ease',
                      filter: isActive ? 'drop-shadow(0 0 4px currentColor)' : 'none',
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

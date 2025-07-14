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

  // Generate sound wave points
  const generateWavePoints = () => {
    const points = [];
    const segments = 100;
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * 320;
      // Create a varied wave pattern
      const frequency = 0.1;
      const amplitude = 15;
      const y = 40 + 
        Math.sin(i * frequency) * amplitude * Math.sin(i * 0.02) +
        Math.sin(i * frequency * 2.5) * (amplitude * 0.3) +
        Math.sin(i * frequency * 5) * (amplitude * 0.1);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {stage === 'generating' ? (
        <>
          {/* Sound Wave Loading Animation */}
          <div className="relative w-80 h-20">
            <svg viewBox="0 0 320 80" className="w-full h-full">
              {/* Background wave (full) */}
              <polyline
                points={generateWavePoints()}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted-foreground/30"
              />
              
              {/* Progress wave (animated) */}
              <polyline
                points={generateWavePoints()}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-primary"
                strokeDasharray="1000"
                strokeDashoffset={1000 - (progress * 10)}
                style={{
                  filter: 'drop-shadow(0 0 8px currentColor)',
                }}
              />
              
              {/* Progress indicator dot */}
              <circle
                cx={progress * 3.2}
                cy="40"
                r="4"
                fill="currentColor"
                className="text-primary animate-pulse"
                style={{
                  filter: 'drop-shadow(0 0 12px currentColor)',
                }}
              />
              
              {/* Simple progress bar below */}
              <rect
                x="0"
                y="70"
                width="320"
                height="2"
                fill="currentColor"
                className="text-muted-foreground/20"
                rx="1"
              />
              <rect
                x="0"
                y="70"
                width={progress * 3.2}
                height="2"
                fill="currentColor"
                className="text-primary"
                rx="1"
              />
            </svg>
          </div>
          <div className="text-lg text-foreground font-medium tracking-wide">Composing unique names...</div>
          <div className="text-sm text-muted-foreground">Tuning the creative frequencies</div>
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

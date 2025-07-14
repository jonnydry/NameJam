import { useEffect, useState, useMemo } from 'react';

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

  // Generate random notes that scroll across like Guitar Hero
  const notes = useMemo(() => {
    const noteCount = 12;
    return Array.from({ length: noteCount }, (_, i) => ({
      id: i,
      position: (i / noteCount) * 100, // Position along the timeline (0-100%)
      line: Math.floor(Math.random() * 5), // Random staff line (0-4)
    }));
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      {stage === 'generating' ? (
        <>
          {/* Guitar Hero style Musical Staff Loading Animation */}
          <div className="relative w-80 h-20 overflow-hidden">
            <svg viewBox="0 0 320 80" className="w-full h-full">
              {/* Staff lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={16 + i * 12}
                  x2="320"
                  y2={16 + i * 12}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border"
                />
              ))}
              
              {/* Progress line (vertical scanner) */}
              <line
                x1={progress * 3.2}
                y1="0"
                x2={progress * 3.2}
                y2="80"
                stroke="currentColor"
                strokeWidth="3"
                className="text-primary"
                opacity="0.8"
              />
              
              {/* Notes scrolling across */}
              {notes.map((note) => {
                const noteX = note.position * 3.2;
                const noteY = 16 + note.line * 12;
                const hasBeenHit = progress > note.position;
                const isNearHit = Math.abs(progress - note.position) < 5;
                
                return (
                  <g key={note.id} transform={`translate(${noteX}, ${noteY})`}>
                    {/* Note circle */}
                    <circle
                      r={isNearHit ? "7" : "5"}
                      fill="currentColor"
                      className={
                        hasBeenHit 
                          ? "text-primary/30" 
                          : isNearHit
                          ? "text-primary animate-pulse"
                          : "text-muted-foreground"
                      }
                    />
                    {/* Hit effect */}
                    {isNearHit && (
                      <circle
                        r="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-primary animate-ping"
                      />
                    )}
                  </g>
                );
              })}
              
              {/* Progress bar at bottom */}
              <rect
                x="0"
                y="75"
                width="320"
                height="2"
                fill="currentColor"
                className="text-muted"
                rx="1"
              />
              <rect
                x="0"
                y="75"
                width={progress * 3.2}
                height="2"
                fill="currentColor"
                className="text-primary"
                rx="1"
              />
            </svg>
          </div>
          <div className="text-lg text-foreground font-medium tracking-wide">Composing unique names...</div>
          <div className="text-sm text-muted-foreground">Hitting the right notes</div>
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

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

  // Generate random note positions (0-4 for staff lines, plus spaces between)
  const [notes] = useState(() => {
    const positions = [15, 25, 35, 45, 55, 65, 75, 85];
    return positions.map(pos => ({
      position: pos,
      // Allow half-line positions for more variety (0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4)
      line: Math.floor(Math.random() * 9) / 2,
      isWholeNote: Math.random() > 0.5,
    }));
  });

  // Calculate the current note position based on progress
  const getCurrentNoteY = (progress: number) => {
    // Find which two notes we're between
    for (let i = 0; i < notes.length - 1; i++) {
      if (progress >= notes[i].position && progress <= notes[i + 1].position) {
        // Interpolate between the two notes
        const t = (progress - notes[i].position) / (notes[i + 1].position - notes[i].position);
        const startY = 40 - (notes[i].line * 10);
        const endY = 40 - (notes[i + 1].line * 10);
        return startY + (endY - startY) * t;
      }
    }
    // Handle edge cases
    if (progress < notes[0].position) {
      return 40 - (notes[0].line * 10);
    }
    return 40 - (notes[notes.length - 1].line * 10);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {stage === 'generating' ? (
        <>
          {/* Musical Staff Loading Animation */}
          <div className="relative w-64 h-20">
            <svg viewBox="0 0 256 80" className="w-full h-full">
              {/* Staff lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={40 - i * 10}
                  x2="256"
                  y2={40 - i * 10}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-muted-foreground/30"
                />
              ))}
              
              {/* Treble clef symbol */}
              <path
                d="M 10 50 C 10 35, 20 25, 20 15 L 20 5 C 20 0, 15 -5, 10 0 C 5 5, 10 10, 15 5 L 15 25 C 15 30, 10 35, 10 40 C 10 45, 15 50, 20 45 C 25 40, 20 35, 15 40"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-muted-foreground/40"
              />
              
              {/* Notes on the staff */}
              {notes.map((note, i) => {
                const noteX = (note.position / 100) * 256;
                const noteY = 40 - note.line * 10;
                const shouldGlow = progress >= note.position - 5 && progress <= note.position + 5;
                
                return (
                  <g key={i} transform={`translate(${noteX}, ${noteY})`}>
                    {/* Note head */}
                    {note.isWholeNote ? (
                      <ellipse
                        rx="5"
                        ry="3.5"
                        fill={shouldGlow ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className={shouldGlow ? "text-primary" : "text-muted-foreground/50"}
                        transform="rotate(-20)"
                      />
                    ) : (
                      <ellipse
                        rx="4.5"
                        ry="3"
                        fill="currentColor"
                        className={shouldGlow ? "text-primary" : "text-muted-foreground/50"}
                        transform="rotate(-20)"
                      />
                    )}
                    {/* Note stem */}
                    {!note.isWholeNote && (
                      <line
                        x1="3.5"
                        y1="0"
                        x2="3.5"
                        y2={note.line < 2 ? "20" : "-20"}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className={shouldGlow ? "text-primary" : "text-muted-foreground/50"}
                      />
                    )}
                    {/* Add ledger line if note is above or below staff */}
                    {(note.line < 0 || note.line > 4) && (
                      <line
                        x1="-8"
                        y1="0"
                        x2="8"
                        y2="0"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-muted-foreground/30"
                      />
                    )}
                  </g>
                );
              })}
              
              {/* Progress indicator that follows the notes */}
              <g transform={`translate(${(progress / 100) * 256}, ${getCurrentNoteY(progress)})`}>
                {/* Glow effect */}
                <circle
                  r="12"
                  fill="currentColor"
                  className="text-primary/20"
                />
                <circle
                  r="8"
                  fill="currentColor"
                  className="text-primary/40"
                />
                <circle
                  r="5"
                  fill="currentColor"
                  className="text-primary"
                />
                {/* Trailing line effect - shows the path traveled */}
                <path
                  d={`M ${-((progress / 100) * 256)} ${-(getCurrentNoteY(progress) - 40)} 
                      Q ${-((progress / 100) * 256) / 2} ${-(getCurrentNoteY(progress) - 40)} 
                        0 0`}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  className="text-primary/30"
                  strokeLinecap="round"
                />
              </g>
              
              {/* Progress bar background */}
              <rect
                x="0"
                y="70"
                width="256"
                height="2"
                fill="currentColor"
                className="text-muted-foreground/20"
                rx="1"
              />
              
              {/* Progress bar fill */}
              <rect
                x="0"
                y="70"
                width={`${(progress / 100) * 256}`}
                height="2"
                fill="currentColor"
                className="text-primary"
                rx="1"
              />
            </svg>
          </div>
          <div className="text-lg text-foreground font-medium tracking-wide">Composing unique names...</div>
          <div className="text-sm text-muted-foreground">Following the melody of creativity</div>
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

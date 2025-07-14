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

  // Ode to Joy notes (simplified version)
  // E E F G G F E D C C D E E D D
  const odeToJoyNotes = [
    { note: 'E', line: 2 },    // E on the staff
    { note: 'E', line: 2 },
    { note: 'F', line: 1.5 },  // F between lines
    { note: 'G', line: 1 },    // G on line
    { note: 'G', line: 1 },
    { note: 'F', line: 1.5 },
    { note: 'E', line: 2 },
    { note: 'D', line: 2.5 },  // D between lines
    { note: 'C', line: 3 },    // C on line
    { note: 'C', line: 3 },
    { note: 'D', line: 2.5 },
    { note: 'E', line: 2 },
    { note: 'E', line: 2 },
    { note: 'D', line: 2.5 },
    { note: 'D', line: 2.5 },
  ];

  // Position notes evenly across the staff
  const notes = odeToJoyNotes.map((note, i) => ({
    position: (i + 1) * (90 / (odeToJoyNotes.length + 1)),
    line: note.line,
    noteName: note.note,
    isQuarterNote: true,
  }));

  // Calculate which note is currently playing
  const getCurrentNoteIndex = (progress: number) => {
    const noteProgress = (progress / 100) * notes.length;
    return Math.floor(noteProgress);
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
                const currentNoteIndex = getCurrentNoteIndex(progress);
                const isPlaying = i === currentNoteIndex;
                const hasPlayed = i < currentNoteIndex;
                
                return (
                  <g key={i} transform={`translate(${noteX}, ${noteY})`}>
                    {/* Note head */}
                    <ellipse
                      rx="4.5"
                      ry="3"
                      fill="currentColor"
                      className={
                        isPlaying ? "text-primary animate-pulse" : 
                        hasPlayed ? "text-primary/60" : 
                        "text-muted-foreground/50"
                      }
                      transform="rotate(-20)"
                    />
                    {/* Note stem */}
                    <line
                      x1="3.5"
                      y1="0"
                      x2="3.5"
                      y2={note.line < 2 ? "20" : "-20"}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={
                        isPlaying ? "text-primary" : 
                        hasPlayed ? "text-primary/60" : 
                        "text-muted-foreground/50"
                      }
                    />
                    {/* Note flag for quarter notes */}
                    {note.line < 2 && (
                      <path
                        d="M 3.5 20 Q 8 15, 7 10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        className={
                          isPlaying ? "text-primary" : 
                          hasPlayed ? "text-primary/60" : 
                          "text-muted-foreground/50"
                        }
                      />
                    )}
                  </g>
                );
              })}
              
              {/* Time signature */}
              <text 
                x="35" 
                y="28" 
                fontSize="16" 
                fontWeight="bold"
                fill="currentColor"
                className="text-muted-foreground/40 font-mono"
              >
                4
              </text>
              <text 
                x="35" 
                y="48" 
                fontSize="16" 
                fontWeight="bold"
                fill="currentColor"
                className="text-muted-foreground/40 font-mono"
              >
                4
              </text>
              
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
          <div className="text-sm text-muted-foreground">Playing Ode to Joy while we create</div>
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

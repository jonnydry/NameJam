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

  // Ode to Joy notes - correct positions on treble clef
  // E E F G G F E D C C D E E D D
  const odeToJoyNotes = [
    { note: 'E', line: 4 },    // E on first line
    { note: 'E', line: 4 },
    { note: 'F', line: 3.5 },  // F on first space
    { note: 'G', line: 3 },    // G on second line
    { note: 'G', line: 3 },
    { note: 'F', line: 3.5 },
    { note: 'E', line: 4 },
    { note: 'D', line: 4.5 },  // D below first line
    { note: 'C', line: 5 },    // C below staff (ledger line)
    { note: 'C', line: 5 },
    { note: 'D', line: 4.5 },
    { note: 'E', line: 4 },
    { note: 'E', line: 4 },
    { note: 'D', line: 4.5 },
    { note: 'D', line: 4.5 },
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
          <div className="relative w-80 h-24">
            <svg viewBox="0 0 320 96" className="w-full h-full">
              {/* Staff lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={20 + i * 12}
                  x2="320"
                  y2={20 + i * 12}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-muted-foreground/40"
                />
              ))}
              
              {/* Treble clef symbol */}
              <g transform="translate(15, 50)">
                <path
                  d="M 0 -30 C -5 -30, -8 -25, -8 -20 C -8 -15, -5 -10, 0 -10 C 5 -10, 8 -15, 8 -20 C 8 -25, 5 -30, 0 -30 M 0 -10 L 0 20 C 0 25, -3 30, -6 30 C -9 30, -12 27, -12 24 C -12 21, -9 18, -6 18 C -3 18, 0 21, 0 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-muted-foreground/50"
                />
              </g>
              
              {/* Notes on the staff */}
              {notes.map((note, i) => {
                const noteX = 50 + (note.position / 100) * 250;
                const noteY = 20 + note.line * 12;
                const currentNoteIndex = getCurrentNoteIndex(progress);
                const isPlaying = i === currentNoteIndex;
                const hasPlayed = i < currentNoteIndex;
                
                return (
                  <g key={i} transform={`translate(${noteX}, ${noteY})`}>
                    {/* Ledger line for middle C */}
                    {note.line >= 5 && (
                      <line
                        x1="-8"
                        y1="0"
                        x2="8"
                        y2="0"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-muted-foreground/40"
                      />
                    )}
                    {/* Note head */}
                    <ellipse
                      rx="5"
                      ry="4"
                      fill="currentColor"
                      className={
                        isPlaying ? "text-primary animate-pulse" : 
                        hasPlayed ? "text-primary/70" : 
                        "text-muted-foreground/60"
                      }
                      transform="rotate(-20)"
                    />
                    {/* Note stem */}
                    <line
                      x1="4.5"
                      y1="0"
                      x2="4.5"
                      y2="-25"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={
                        isPlaying ? "text-primary" : 
                        hasPlayed ? "text-primary/70" : 
                        "text-muted-foreground/60"
                      }
                    />
                  </g>
                );
              })}
              
              {/* Time signature */}
              <text 
                x="35" 
                y="40" 
                fontSize="20" 
                fontWeight="bold"
                fill="currentColor"
                className="text-muted-foreground/50 font-mono"
                textAnchor="middle"
              >
                4
              </text>
              <text 
                x="35" 
                y="60" 
                fontSize="20" 
                fontWeight="bold"
                fill="currentColor"
                className="text-muted-foreground/50 font-mono"
                textAnchor="middle"
              >
                4
              </text>
              
              {/* Progress bar background */}
              <rect
                x="0"
                y="85"
                width="320"
                height="3"
                fill="currentColor"
                className="text-muted-foreground/20"
                rx="1.5"
              />
              
              {/* Progress bar fill */}
              <rect
                x="0"
                y="85"
                width={`${(progress / 100) * 320}`}
                height="3"
                fill="currentColor"
                className="text-primary"
                rx="1.5"
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

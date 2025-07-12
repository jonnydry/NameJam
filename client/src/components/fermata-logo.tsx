interface FermataLogoProps {
  size?: "sm" | "lg" | "xl";
  className?: string;
}

export function FermataLogo({ size = "sm", className = "" }: FermataLogoProps) {
  const containerSize = size === "xl" ? "w-24 h-36" : size === "lg" ? "w-16 h-24" : "w-10 h-14";
  const svgSize = size === "xl" ? "w-24 h-36" : size === "lg" ? "w-16 h-24" : "w-10 h-14";

  return (
    <div className={`${containerSize} ${className} relative flex items-center justify-center animate-fade-in mx-auto lightbulb-container`}>
      <svg 
        viewBox="0 0 80 120" 
        className={svgSize}
        fill="none"
      >
        {/* Gradient definitions for glow effect */}
        <defs>
          <radialGradient id="bulbGlow" cx="50%" cy="35%" r="50%">
            <stop offset="0%" stopColor="currentColor" className="text-primary" stopOpacity="0.15" />
            <stop offset="50%" stopColor="currentColor" className="text-primary" stopOpacity="0.08" />
            <stop offset="100%" stopColor="currentColor" className="text-primary" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Outer glow */}
        <ellipse cx="40" cy="42" rx="35" ry="40" fill="url(#bulbGlow)" />
        
        {/* Lightbulb glass - traditional incandescent shape */}
        <path 
          d="M40 8 C20 8 5 23 5 42 C5 54 10 64 18 70 C18 70 18 72 18 75 L18 82 C18 85 20 87 23 87 L57 87 C60 87 62 85 62 82 L62 75 C62 72 62 70 62 70 C70 64 75 54 75 42 C75 23 60 8 40 8 Z" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          fill="currentColor"
          fillOpacity="0.02"
          className="text-primary"
        />
        
        {/* Glass highlight */}
        <ellipse 
          cx="40" 
          cy="28" 
          rx="16" 
          ry="12" 
          fill="currentColor" 
          fillOpacity="0.06" 
          className="text-primary"
        />
        
        {/* Metal base */}
        <path 
          d="M23 87 L23 95 C23 97 25 99 27 99 L53 99 C55 99 57 97 57 95 L57 87"
          stroke="currentColor" 
          strokeWidth="2.5" 
          fill="currentColor"
          fillOpacity="0.1"
          className="text-primary"
        />
        
        {/* Screw threads */}
        <line x1="27" y1="91" x2="53" y2="91" stroke="currentColor" strokeWidth="2" className="text-primary opacity-40" />
        <line x1="27" y1="95" x2="53" y2="95" stroke="currentColor" strokeWidth="2" className="text-primary opacity-40" />
        <line x1="29" y1="99" x2="51" y2="99" stroke="currentColor" strokeWidth="2" className="text-primary opacity-40" />
        <line x1="31" y1="103" x2="49" y2="103" stroke="currentColor" strokeWidth="2" className="text-primary opacity-40" />
        <line x1="33" y1="107" x2="47" y2="107" stroke="currentColor" strokeWidth="2" className="text-primary opacity-40" />
        
        {/* Original fermata logo content, centered in bulb */}
        <g transform="translate(40, 42)">
          {/* Question mark curve - floating above, centered */}
          <path 
            d="M-5 -12c0-5 3.75-8.75 7.5-8.75s7.5 3.75 7.5 8.75c0 3.125-2 5-3.75 7L0 -1.25c-0.75 0.75-0.75 2.5-0.75 3.75" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            className="text-muted-foreground"
          />
          
          {/* Fermata arc - positioned lower */}
          <path 
            d="M-10 9 Q0 0 10 9" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            className="text-primary"
          />
          
          {/* Single shared dot - works for both fermata and question mark */}
          <circle 
            cx="0" 
            cy="13" 
            r="2" 
            fill="currentColor"
            className="text-primary animate-pulse"
          />
        </g>
      </svg>
    </div>
  );
}

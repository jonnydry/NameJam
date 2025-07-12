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
        
        {/* Lightbulb glass - traditional incandescent shape with more interior space */}
        <path 
          d="M40 10 C22 10 8 24 8 42 C8 53 13 62 20 68 C20 68 20 70 20 72 L20 80 C20 83 22 85 25 85 L55 85 C58 85 60 83 60 80 L60 72 C60 70 60 68 60 68 C67 62 72 53 72 42 C72 24 58 10 40 10 Z" 
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
          d="M25 85 L25 93 C25 95 27 97 29 97 L51 97 C53 97 55 95 55 93 L55 85"
          stroke="currentColor" 
          strokeWidth="2.5" 
          fill="currentColor"
          fillOpacity="0.1"
          className="text-primary"
        />
        
        {/* Screw threads */}
        <line x1="29" y1="89" x2="51" y2="89" stroke="currentColor" strokeWidth="2" className="text-primary opacity-40" />
        <line x1="29" y1="93" x2="51" y2="93" stroke="currentColor" strokeWidth="2" className="text-primary opacity-40" />
        <line x1="31" y1="97" x2="49" y2="97" stroke="currentColor" strokeWidth="2" className="text-primary opacity-40" />
        <line x1="33" y1="101" x2="47" y2="101" stroke="currentColor" strokeWidth="2" className="text-primary opacity-40" />
        <line x1="35" y1="105" x2="45" y2="105" stroke="currentColor" strokeWidth="2" className="text-primary opacity-40" />
        
        {/* Original fermata logo content, with clear separation between elements */}
        <g transform="translate(40, 46)">
          {/* Question mark curve - floating high above */}
          <path 
            d="M-3 -16c0-3 2.25-5.25 4.5-5.25s4.5 2.25 4.5 5.25c0 1.875-1.2 3-2.25 4.2L0 -9c-0.45 0.45-0.45 1.5-0.45 2.25" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            className="text-muted-foreground"
          />
          
          {/* Fermata arc - positioned much lower */}
          <path 
            d="M-8 12 Q0 5 8 12" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            className="text-primary"
          />
          
          {/* Single shared dot - centered below everything */}
          <circle 
            cx="0" 
            cy="16" 
            r="1.8" 
            fill="currentColor"
            className="text-primary animate-pulse"
          />
        </g>
      </svg>
    </div>
  );
}

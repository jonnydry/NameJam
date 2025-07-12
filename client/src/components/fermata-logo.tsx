interface FermataLogoProps {
  size?: "sm" | "lg" | "xl";
  className?: string;
}

export function FermataLogo({ size = "sm", className = "" }: FermataLogoProps) {
  const containerSize = size === "xl" ? "w-32 h-40" : size === "lg" ? "w-20 h-24" : "w-12 h-14";
  const svgSize = size === "xl" ? "w-32 h-40" : size === "lg" ? "w-20 h-24" : "w-12 h-14";

  return (
    <div className={`${containerSize} ${className} relative flex items-center justify-center animate-fade-in mx-auto lightbulb-container`}>
      <svg 
        viewBox="0 0 100 120" 
        className={svgSize}
        fill="none"
      >
        {/* Gradient definitions for glow effect */}
        <defs>
          <radialGradient id="bulbGlow" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="currentColor" className="text-primary" stopOpacity="0.15" />
            <stop offset="50%" stopColor="currentColor" className="text-primary" stopOpacity="0.08" />
            <stop offset="100%" stopColor="currentColor" className="text-primary" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Outer glow */}
        <ellipse cx="50" cy="45" rx="40" ry="45" fill="url(#bulbGlow)" />
        
        {/* Lightbulb glass */}
        <path 
          d="M50 10 C30 10 15 25 15 45 C15 58 22 68 30 72 L30 85 C30 88 32 90 35 90 L65 90 C68 90 70 88 70 85 L70 72 C78 68 85 58 85 45 C85 25 70 10 50 10 Z" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          fill="currentColor"
          fillOpacity="0.02"
          className="text-primary"
        />
        
        {/* Glass highlight */}
        <ellipse 
          cx="50" 
          cy="35" 
          rx="15" 
          ry="20" 
          fill="currentColor" 
          fillOpacity="0.08" 
          className="text-primary"
        />
        
        {/* Lightbulb base/screw threads */}
        <rect x="35" y="88" width="30" height="2" fill="currentColor" className="text-primary opacity-40" />
        <rect x="37" y="92" width="26" height="2" fill="currentColor" className="text-primary opacity-40" />
        <rect x="39" y="96" width="22" height="2" fill="currentColor" className="text-primary opacity-40" />
        <rect x="41" y="100" width="18" height="2" fill="currentColor" className="text-primary opacity-40" />
        <rect x="43" y="104" width="14" height="2" fill="currentColor" className="text-primary opacity-40" />
        
        {/* Original fermata logo content, repositioned inside bulb */}
        <g transform="translate(50, 45)">
          {/* Question mark curve - floating above, centered */}
          <path 
            d="M-8 -20c0-8 6-14 12-14s12 6 12 14c0 5-3.2 8-6 11.2L0 -2c-1.2 1.2-1.2 4-1.2 6" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            className="text-muted-foreground"
          />
          
          {/* Fermata arc - positioned lower */}
          <path 
            d="M-16 15 Q0 0 16 15" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            className="text-primary"
          />
          
          {/* Single shared dot - works for both fermata and question mark */}
          <circle 
            cx="0" 
            cy="22" 
            r="3" 
            fill="currentColor"
            className="text-primary animate-pulse"
          />
        </g>
      </svg>
    </div>
  );
}

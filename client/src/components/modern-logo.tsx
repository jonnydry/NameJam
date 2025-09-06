interface ModernLogoProps {
  size?: "sm" | "lg" | "xl";
  className?: string;
  variant?: "full" | "icon-only";
}

export function ModernLogo({ size = "sm", className = "", variant = "full" }: ModernLogoProps) {
  const containerHeight = size === "xl" ? "h-20" : size === "lg" ? "h-16" : "h-12";
  const iconSize = size === "xl" ? "w-12 h-12" : size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const textSize = size === "xl" ? "text-2xl" : size === "lg" ? "text-xl" : "text-lg";
  const spacing = size === "xl" ? "gap-4" : size === "lg" ? "gap-3" : "gap-2";

  return (
    <div className={`${containerHeight} ${className} relative flex items-center justify-center ${variant === "full" ? spacing : ""} animate-fade-in`}>
      {/* Icon Component */}
      <div className={`${iconSize} relative flex items-center justify-center`}>
        <svg 
          viewBox="0 0 60 60" 
          className={iconSize}
          fill="none"
        >
          {/* Gradient definitions for modern glow */}
          <defs>
            <radialGradient id="modernGlow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="currentColor" className="text-primary" stopOpacity="0.2" />
              <stop offset="50%" stopColor="currentColor" className="text-primary" stopOpacity="0.1" />
              <stop offset="100%" stopColor="currentColor" className="text-primary" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bulbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" className="text-primary" stopOpacity="0.05" />
              <stop offset="100%" stopColor="currentColor" className="text-primary" stopOpacity="0.02" />
            </linearGradient>
            <filter id="modernFilter">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background glow */}
          <circle cx="30" cy="30" r="28" fill="url(#modernGlow)" className="animate-pulse" opacity="0.6" />
          
          {/* Geometric lightbulb - simplified hexagonal shape */}
          <path 
            d="M30 8 L22 14 L22 26 C22 32 25 36 30 38 C35 36 38 32 38 26 L38 14 Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="url(#bulbGradient)"
            className="text-primary"
            filter="url(#modernFilter)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Geometric base - simplified rectangle */}
          <rect 
            x="26" 
            y="38" 
            width="8" 
            height="6" 
            rx="1"
            stroke="currentColor" 
            strokeWidth="2" 
            fill="currentColor"
            fillOpacity="0.03"
            className="text-primary"
            strokeLinecap="round"
          />
          
          {/* Abstract fermata - geometric interpretation */}
          <g className="text-primary" filter="url(#modernFilter)">
            {/* Main arc - simplified to clean curve */}
            <path 
              d="M24 22 Q30 18 36 22" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              fill="none"
              strokeLinecap="round"
              className="animate-pulse"
            />
            
            {/* Dot - simplified to circle */}
            <circle 
              cx="30" 
              cy="28" 
              r="2" 
              fill="currentColor"
              className="animate-pulse"
            />
          </g>
          
          {/* Highlight accent - geometric */}
          <path 
            d="M26 16 L28 14 L30 16" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            fill="none"
            className="text-primary"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
          />
        </svg>
      </div>
      
      {/* Typography - Monospace Integration */}
      {variant === "full" && (
        <div className={`font-mono ${textSize} font-bold tracking-wider flex items-center`}>
          <span className="text-primary relative">
            Name
            {/* Subtle underline accent that echoes the fermata curve */}
            <svg 
              className="absolute -bottom-1 left-0 w-full h-1" 
              viewBox="0 0 100 8" 
              fill="none"
            >
              <path 
                d="M0 4 Q50 0 100 4" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                fill="none"
                className="text-primary"
                opacity="0.3"
              />
            </svg>
          </span>
          <span className="text-muted-foreground ml-1">Jam</span>
        </div>
      )}
    </div>
  );
}
interface FermataLogoProps {
  size?: "sm" | "lg" | "xl";
  className?: string;
}

export function FermataLogo({ size = "sm", className = "" }: FermataLogoProps) {
  const containerSize = size === "xl" ? "w-24 h-36" : size === "lg" ? "w-16 h-24" : "w-10 h-14";
  const svgSize = size === "xl" ? "w-24 h-36" : size === "lg" ? "w-16 h-24" : "w-10 h-14";

  return (
    <div 
      className={`${containerSize} ${className} relative flex items-center justify-center fermata-clean group`}
      data-testid="fermata-logo"
    >
      <svg 
        viewBox="0 0 80 120" 
        className={`${svgSize} fermata-svg-clean motion-safe:animate-fermata-pulse group-hover:scale-[1.01] group-hover:rotate-1 transition-transform duration-300`}
        fill="none"
      >
        <defs>
          {/* Simple subtle inner highlight gradient */}
          <radialGradient id="innerGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
            <stop offset="70%" stopColor="currentColor" stopOpacity="0.05" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Subtle inner highlight */}
        <path 
          d="M40 12 C23 12 9 26 9 44 C9 55 14 64 21 70 C21 70 21 72 21 74 L21 82 C21 85 23 87 26 87 L54 87 C57 87 59 85 59 82 L59 74 C59 72 59 70 59 70 C66 64 71 55 71 44 C71 26 57 12 40 12 Z" 
          fill="url(#innerGlow)"
          className="text-primary"
        />
        
        {/* Clean lightbulb outline */}
        <path 
          d="M40 10 C22 10 8 24 8 42 C8 53 13 62 20 68 C20 68 20 70 20 72 L20 80 C20 83 22 85 25 85 L55 85 C58 85 60 83 60 80 L60 72 C60 70 60 68 60 68 C67 62 72 53 72 42 C72 24 58 10 40 10 Z" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none"
          className="text-primary"
        />
        
        {/* Simple base */}
        <rect 
          x="25" 
          y="85" 
          width="30" 
          height="15" 
          rx="3"
          stroke="currentColor" 
          strokeWidth="1.5" 
          fill="none"
          className="text-primary opacity-80"
        />
        
        {/* Clean fermata symbol */}
        <g transform="translate(40, 50)" className="text-primary">
          {/* Fermata arc */}
          <path 
            d="M-10 8 Q0 0 10 8" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Fermata dot */}
          <circle 
            cx="0" 
            cy="12" 
            r="1.5" 
            fill="currentColor"
          />
        </g>
      </svg>
    </div>
  );
}
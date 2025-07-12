interface FermataLogoProps {
  size?: "sm" | "lg" | "xl";
  className?: string;
}

export function FermataLogo({ size = "sm", className = "" }: FermataLogoProps) {
  const containerSize = size === "xl" ? "w-24 h-24" : size === "lg" ? "w-16 h-16" : "w-10 h-10";
  const svgSize = size === "xl" ? "w-20 h-20" : size === "lg" ? "w-14 h-14" : "w-9 h-9";

  return (
    <div className={`${containerSize} ${className} relative flex items-center justify-center animate-fade-in mx-auto`}>
      <svg 
        viewBox="0 0 32 32" 
        className={svgSize}
        fill="none"
      >
        {/* Question mark curve - floating above, centered */}
        <path 
          d="M13 6c0-2 1.5-3.5 3-3.5s3 1.5 3 3.5c0 1.2-0.8 2-1.5 2.8L16 10.5c-.3.3-.3 1-.3 1.5" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
          className="text-muted-foreground"
        />
        
        {/* Fermata arc - positioned lower */}
        <path 
          d="M8 22 Q16 14 24 22" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
          className="text-primary"
        />
        
        {/* Single shared dot - works for both fermata and question mark */}
        <circle 
          cx="16" 
          cy="26" 
          r="2" 
          fill="currentColor"
          className="text-primary animate-pulse"
        />
      </svg>
    </div>
  );
}

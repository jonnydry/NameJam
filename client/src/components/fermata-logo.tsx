interface FermataLogoProps {
  size?: "sm" | "lg";
  className?: string;
}

export function FermataLogo({ size = "sm", className = "" }: FermataLogoProps) {
  const isLarge = size === "lg";
  const containerSize = isLarge ? "w-16 h-16" : "w-10 h-10";

  return (
    <div className={`${containerSize} ${className} relative flex items-center justify-center animate-fade-in mx-auto`}>
      <svg 
        viewBox="0 0 32 32" 
        className={`${isLarge ? 'w-14 h-14' : 'w-9 h-9'}`}
        fill="none"
      >
        {/* Question mark curve - without the dot */}
        <path 
          d="M12 8c0-2.5 2-4.5 4.5-4.5S21 5.5 21 8c0 1.5-1 2.5-2 3.5L17 13.5c-.5.5-.5 1.5-.5 2.5" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round"
          className="text-muted-foreground"
        />
        
        {/* Fermata arc - positioned above */}
        <path 
          d="M8 20 Q16 12 24 20" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
          className="text-primary"
        />
        
        {/* Single shared dot - works for both fermata and question mark */}
        <circle 
          cx="16" 
          cy="24" 
          r="2" 
          fill="currentColor"
          className="text-primary animate-pulse"
        />
      </svg>
    </div>
  );
}

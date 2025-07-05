interface FermataLogoProps {
  size?: "sm" | "lg";
  className?: string;
}

export function FermataLogo({ size = "sm", className = "" }: FermataLogoProps) {
  const isLarge = size === "lg";
  const containerSize = isLarge ? "w-16 h-16" : "w-10 h-10";

  return (
    <div className={`${containerSize} ${className} relative flex items-center justify-center animate-fade-in`}>
      {/* Question mark (base) */}
      <svg 
        viewBox="0 0 24 24" 
        className={`${isLarge ? 'w-12 h-12' : 'w-8 h-8'} text-muted-foreground absolute`}
        fill="currentColor"
      >
        <path d="M11.07 12.85c.77-1.39 2.25-2.21 3.11-3.44.91-1.29.4-3.7-2.18-3.7-1.69 0-2.52 1.28-2.87 2.34L6.54 6.96C7.25 4.83 9.18 3 11.99 3c2.35 0 3.96 1.07 4.78 2.41.7 1.15.6 3.18-.4 4.95-.98 1.71-2.24 2.73-2.73 4.14-.35 1.01-.17 2.24-.17 2.24l-2.93 0s-.18-1.16.53-3.79z"/>
        <circle cx="12" cy="20.5" r="1.5"/>
      </svg>
      
      {/* Fermata symbol (hovering above) */}
      <div className={`absolute ${isLarge ? '-top-2' : '-top-1'} ${isLarge ? 'w-8' : 'w-6'}`}>
        <svg 
          viewBox="0 0 32 16" 
          className="w-full text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {/* Fermata arc */}
          <path d="M4 12 Q16 2 28 12" strokeLinecap="round"/>
          {/* Fermata dot */}
          <circle cx="16" cy="14" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
      </div>
    </div>
  );
}

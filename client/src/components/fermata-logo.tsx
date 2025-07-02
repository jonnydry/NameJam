interface FermataLogoProps {
  size?: "sm" | "lg";
  className?: string;
}

export function FermataLogo({ size = "sm", className = "" }: FermataLogoProps) {
  const isLarge = size === "lg";
  const containerSize = isLarge ? "w-24 h-24" : "w-10 h-10";
  const symbolSize = isLarge ? "w-8 h-6" : "w-4 h-3";
  
  return (
    <div className={`${containerSize} bg-musical-purple rounded-full flex items-center justify-center text-white shadow-lg mx-auto ${className}`}>
      <div className={`fermata-symbol ${symbolSize} relative`}>
        <div className="fermata-arc absolute top-0 left-0 w-full border-white border-solid border-2 border-b-0 rounded-t-full" 
             style={{ height: isLarge ? '16px' : '8px' }} />
        <div className="fermata-dot absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-white rounded-full"
             style={{ 
               width: isLarge ? '6px' : '3px', 
               height: isLarge ? '6px' : '3px' 
             }} />
      </div>
    </div>
  );
}

import logoImage from '@assets/Name_Jam_LogoPrototype_1758236971271.png';

interface FermataLogoProps {
  size?: "sm" | "lg" | "xl";
  className?: string;
}

export function FermataLogo({ size = "sm", className = "" }: FermataLogoProps) {
  const containerSize = size === "xl" ? "w-24 h-36" : size === "lg" ? "w-16 h-24" : "w-10 h-14";
  const imageSize = size === "xl" ? "w-24 h-24" : size === "lg" ? "w-16 h-16" : "w-10 h-10";

  return (
    <div className={`${containerSize} ${className} relative flex items-center justify-center animate-fade-in mx-auto lightbulb-container`}>
      <img 
        src={logoImage}
        alt="NameJam Logo"
        className={`${imageSize} object-contain`}
      />
    </div>
  );
}

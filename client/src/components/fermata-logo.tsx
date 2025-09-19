import logoImage from '@assets/generated_images/Professional_lightbulb_logo_with_fermata_and_question_mark_879a3b29.png';

interface FermataLogoProps {
  size?: "sm" | "lg" | "xl";
  className?: string;
}

export function FermataLogo({ size = "sm", className = "" }: FermataLogoProps) {
  const containerSize = size === "xl" ? "w-24 h-36" : size === "lg" ? "w-16 h-24" : "w-10 h-14";
  const imageSize = size === "xl" ? "w-24 h-36" : size === "lg" ? "w-16 h-24" : "w-10 h-14";

  return (
    <div 
      className={`${containerSize} ${className} relative flex items-center justify-center fermata-clean group`}
      data-testid="fermata-logo"
    >
      <img 
        src={logoImage}
        alt="NameJam logo - lightbulb with fermata and question mark"
        className={`${imageSize} object-contain motion-safe:animate-fermata-pulse group-hover:scale-[1.01] group-hover:rotate-1 transition-transform duration-300`}
      />
    </div>
  );
}
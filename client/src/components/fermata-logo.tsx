interface FermataLogoProps {
  size?: "sm" | "lg" | "xl";
  className?: string;
}

export function FermataLogo({ size = "sm", className = "" }: FermataLogoProps) {
  const containerSize = size === "xl" ? "w-24 h-36" : size === "lg" ? "w-16 h-24" : "w-10 h-14";
  const svgSize = size === "xl" ? "w-24 h-36" : size === "lg" ? "w-16 h-24" : "w-10 h-14";
  const sizeClass = size === "xl" ? "fermata-xl" : size === "lg" ? "fermata-lg" : "fermata-sm";

  return (
    <div 
      className={`${containerSize} ${className} ${sizeClass} relative flex items-center justify-center animate-fade-in mx-auto lightbulb-container fermata-advanced`}
      data-testid="fermata-logo"
    >
      <svg 
        viewBox="0 0 80 120" 
        className={`${svgSize} fermata-svg`}
        fill="none"
      >
        {/* Advanced gradient and filter definitions */}
        <defs>
          {/* Warm incandescent light gradient (2700K-3000K) */}
          <radialGradient id="warmLight" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#ffcc66" stopOpacity="0.8" />
            <stop offset="15%" stopColor="#ffb347" stopOpacity="0.6" />
            <stop offset="30%" stopColor="#ff9933" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#ff8822" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ff6600" stopOpacity="0" />
          </radialGradient>
          
          {/* Glass material gradient with multiple layers */}
          <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="30%" stopColor="#e0f7ff" stopOpacity="0.08" />
            <stop offset="60%" stopColor="#b3e5fc" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#81d4fa" stopOpacity="0.02" />
          </linearGradient>
          
          {/* Metallic base gradient */}
          <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0e0e0" stopOpacity="0.6" />
            <stop offset="25%" stopColor="#bdbdbd" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#9e9e9e" stopOpacity="0.4" />
            <stop offset="75%" stopColor="#757575" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#616161" stopOpacity="0.2" />
          </linearGradient>
          
          {/* Caustic light pattern */}
          <radialGradient id="causticPattern" cx="40%" cy="30%" r="40%">
            <stop offset="0%" stopColor="#fff8dc" stopOpacity="0.4" />
            <stop offset="25%" stopColor="#ffd700" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ffb347" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ff9933" stopOpacity="0" />
          </radialGradient>
          
          {/* Rim lighting gradient */}
          <radialGradient id="rimLight" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="transparent" stopOpacity="0" />
            <stop offset="95%" stopColor="#00b8ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.5" />
          </radialGradient>
          
          {/* Complex lighting filter */}
          <filter id="advancedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feOffset dx="0" dy="2" result="offsetBlur"/>
            <feSpecularLighting result="specOut" in="coloredBlur" surfaceScale="5" specularConstant=".75" specularExponent="20" lightingColor="#fff8dc">
              <fePointLight x="40" y="40" z="200"/>
            </feSpecularLighting>
            <feComposite in="specOut" in2="coloredBlur" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="specOut2"/>
            <feComposite in="specOut2" in2="SourceAlpha" operator="in" result="specOut3"/>
            <feMerge>
              <feMergeNode in="offsetBlur"/>
              <feMergeNode in="SourceGraphic"/>
              <feMergeNode in="specOut3"/>
            </feMerge>
          </filter>
          
          {/* Chromatic aberration filter for glass realism */}
          <filter id="chromaticAberration">
            <feOffset in="SourceGraphic" dx="-0.5" dy="0" result="redOffset">
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
            </feOffset>
            <feOffset in="SourceGraphic" dx="0.5" dy="0" result="blueOffset">
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
            </feOffset>
            <feBlend mode="screen" in="redOffset" in2="SourceGraphic"/>
            <feBlend mode="screen" in2="blueOffset"/>
          </filter>
          
          {/* Surface texture pattern */}
          <pattern id="glassTexture" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="transparent"/>
            <circle cx="2" cy="2" r="0.5" fill="white" opacity="0.05"/>
          </pattern>
        </defs>
        
        {/* Multiple glow layers for depth */}
        <ellipse cx="40" cy="42" rx="42" ry="47" fill="url(#warmLight)" className="fermata-outer-glow" opacity="0.6" />
        <ellipse cx="40" cy="42" rx="38" ry="43" fill="url(#causticPattern)" className="fermata-caustic" opacity="0.4" />
        <ellipse cx="40" cy="42" rx="35" ry="40" fill="url(#rimLight)" className="fermata-rim" opacity="0.5" />
        
        {/* Lightbulb glass with multi-layer effects */}
        <g className="fermata-bulb-group">
          {/* Base glass layer */}
          <path 
            d="M40 10 C22 10 8 24 8 42 C8 53 13 62 20 68 C20 68 20 70 20 72 L20 80 C20 83 22 85 25 85 L55 85 C58 85 60 83 60 80 L60 72 C60 70 60 68 60 68 C67 62 72 53 72 42 C72 24 58 10 40 10 Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="url(#glassGradient)"
            className="text-primary fermata-glass-base"
            filter="url(#advancedGlow)"
          />
          
          {/* Glass texture overlay */}
          <path 
            d="M40 10 C22 10 8 24 8 42 C8 53 13 62 20 68 C20 68 20 70 20 72 L20 80 C20 83 22 85 25 85 L55 85 C58 85 60 83 60 80 L60 72 C60 70 60 68 60 68 C67 62 72 53 72 42 C72 24 58 10 40 10 Z" 
            fill="url(#glassTexture)"
            opacity="0.3"
            className="fermata-texture"
          />
          
          {/* Inner glow layer */}
          <path 
            d="M40 10 C22 10 8 24 8 42 C8 53 13 62 20 68 C20 68 20 70 20 72 L20 80 C20 83 22 85 25 85 L55 85 C58 85 60 83 60 80 L60 72 C60 70 60 68 60 68 C67 62 72 53 72 42 C72 24 58 10 40 10 Z" 
            fill="url(#warmLight)"
            opacity="0.15"
            className="fermata-inner-glow"
          />
        </g>
        
        {/* Filament details */}
        <g className="fermata-filament" opacity="0.4">
          <path d="M35 35 Q40 45 45 35" stroke="#ffb347" strokeWidth="0.5" fill="none" className="fermata-filament-wire" />
          <path d="M35 40 Q40 50 45 40" stroke="#ffb347" strokeWidth="0.5" fill="none" className="fermata-filament-wire" />
          <path d="M35 45 Q40 55 45 45" stroke="#ffb347" strokeWidth="0.5" fill="none" className="fermata-filament-wire" />
          <line x1="35" y1="35" x2="35" y2="55" stroke="#ff9933" strokeWidth="1" className="fermata-filament-support" />
          <line x1="45" y1="35" x2="45" y2="55" stroke="#ff9933" strokeWidth="1" className="fermata-filament-support" />
        </g>
        
        {/* Multiple glass reflections and highlights */}
        <g className="fermata-reflections">
          {/* Primary highlight */}
          <ellipse 
            cx="32" 
            cy="25" 
            rx="12" 
            ry="8" 
            fill="#ffffff" 
            fillOpacity="0.25" 
            className="fermata-highlight-primary"
            transform="rotate(-15 32 25)"
          />
          
          {/* Secondary highlight */}
          <ellipse 
            cx="48" 
            cy="30" 
            rx="8" 
            ry="6" 
            fill="#e3f2fd" 
            fillOpacity="0.15" 
            className="fermata-highlight-secondary"
            transform="rotate(20 48 30)"
          />
          
          {/* Tertiary shimmer */}
          <ellipse 
            cx="40" 
            cy="35" 
            rx="6" 
            ry="4" 
            fill="#bbdefb" 
            fillOpacity="0.1" 
            className="fermata-shimmer"
          />
          
          {/* Edge reflection */}
          <path 
            d="M12 30 Q10 42 12 54" 
            stroke="#ffffff" 
            strokeWidth="1" 
            fill="none"
            strokeOpacity="0.2"
            className="fermata-edge-reflection"
          />
        </g>
        
        {/* Enhanced metallic base with realistic materials */}
        <g className="fermata-base-group">
          {/* Base shadow */}
          <ellipse cx="40" cy="97" rx="12" ry="3" fill="#000000" fillOpacity="0.3" className="fermata-base-shadow" />
          
          {/* Metal base with gradient */}
          <path 
            d="M25 85 L25 93 C25 95 27 97 29 97 L51 97 C53 97 55 95 55 93 L55 85"
            stroke="#757575" 
            strokeWidth="2" 
            fill="url(#metalGradient)"
            className="fermata-metal-base"
          />
          
          {/* Metal reflection */}
          <path 
            d="M28 86 L28 92 C28 93 29 94 30 94 L50 94 C51 94 52 93 52 92 L52 86"
            fill="#ffffff"
            fillOpacity="0.1"
            className="fermata-metal-reflection"
          />
        </g>
        
        {/* Enhanced screw threads with depth and shadows */}
        <g className="fermata-threads">
          {/* Thread grooves with shadows */}
          <line x1="29" y1="89" x2="51" y2="89" stroke="#424242" strokeWidth="1.5" opacity="0.6" />
          <line x1="29" y1="89.5" x2="51" y2="89.5" stroke="#ffffff" strokeWidth="0.5" opacity="0.2" />
          
          <line x1="29" y1="93" x2="51" y2="93" stroke="#424242" strokeWidth="1.5" opacity="0.6" />
          <line x1="29" y1="93.5" x2="51" y2="93.5" stroke="#ffffff" strokeWidth="0.5" opacity="0.2" />
          
          <line x1="31" y1="97" x2="49" y2="97" stroke="#424242" strokeWidth="1.5" opacity="0.5" />
          <line x1="31" y1="97.5" x2="49" y2="97.5" stroke="#ffffff" strokeWidth="0.5" opacity="0.15" />
          
          <line x1="33" y1="101" x2="47" y2="101" stroke="#424242" strokeWidth="1.5" opacity="0.4" />
          <line x1="33" y1="101.5" x2="47" y2="101.5" stroke="#ffffff" strokeWidth="0.5" opacity="0.1" />
          
          <line x1="35" y1="105" x2="45" y2="105" stroke="#424242" strokeWidth="1.5" opacity="0.3" />
          <line x1="35" y1="105.5" x2="45" y2="105.5" stroke="#ffffff" strokeWidth="0.5" opacity="0.08" />
          
          {/* Bottom cap */}
          <ellipse cx="40" cy="107" rx="5" ry="2" fill="#616161" fillOpacity="0.4" />
          <ellipse cx="40" cy="107" rx="3" ry="1" fill="#9e9e9e" fillOpacity="0.3" />
        </g>
        
        {/* Enhanced fermata logo content with glow */}
        <g transform="translate(40, 46)" className="fermata-symbol-group">
          {/* Question mark with enhanced visibility */}
          <g className="fermata-question">
            <path 
              d="M-3 -16c0-3 2.25-5.25 4.5-5.25s4.5 2.25 4.5 5.25c0 1.875-1.2 3-2.25 4.2L0 -9c-0.45 0.45-0.45 1.5-0.45 2.25" 
              stroke="#ffffff" 
              strokeWidth="3" 
              strokeLinecap="round"
              opacity="0.2"
              className="fermata-question-shadow"
            />
            <path 
              d="M-3 -16c0-3 2.25-5.25 4.5-5.25s4.5 2.25 4.5 5.25c0 1.875-1.2 3-2.25 4.2L0 -9c-0.45 0.45-0.45 1.5-0.45 2.25" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              className="text-muted-foreground fermata-question-main"
            />
          </g>
          
          {/* Fermata arc with enhanced glow */}
          <g className="fermata-arc-group">
            <path 
              d="M-8 12 Q0 5 8 12" 
              stroke="#00b8ff" 
              strokeWidth="4" 
              strokeLinecap="round"
              opacity="0.3"
              className="fermata-arc-shadow"
            />
            <path 
              d="M-8 12 Q0 5 8 12" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              className="text-primary fermata-arc-main"
            />
          </g>
          
          {/* Enhanced glowing dot */}
          <g className="fermata-dot-group">
            <circle 
              cx="0" 
              cy="16" 
              r="3" 
              fill="#00b8ff"
              opacity="0.2"
              className="fermata-dot-glow"
            />
            <circle 
              cx="0" 
              cy="16" 
              r="1.8" 
              fill="currentColor"
              className="text-primary fermata-dot-core"
            />
            <circle 
              cx="0" 
              cy="16" 
              r="0.8" 
              fill="#ffffff"
              opacity="0.6"
              className="fermata-dot-highlight"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
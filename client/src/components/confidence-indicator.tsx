import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ConfidenceIndicatorProps {
  confidence?: number; // 0-1 score
  confidenceLevel?: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
  explanation?: string;
  status: 'available' | 'similar' | 'taken';
}

export function ConfidenceIndicator({ confidence, confidenceLevel, explanation, status }: ConfidenceIndicatorProps) {
  // If no confidence data, show a fallback
  if (confidence === undefined || confidenceLevel === undefined) {
    return null;
  }

  const percentage = Math.round(confidence * 100);
  
  // Determine colors based on confidence level and status
  const getConfidenceColor = () => {
    if (status === 'available') {
      // For available names, high confidence = good (green)
      switch (confidenceLevel) {
        case 'very-high': return 'text-green-400 bg-green-400/20';
        case 'high': return 'text-green-400 bg-green-400/20';
        case 'medium': return 'text-yellow-400 bg-yellow-400/20';
        case 'low': return 'text-orange-400 bg-orange-400/20';
        case 'very-low': return 'text-red-400 bg-red-400/20';
      }
    } else {
      // For taken/similar names, high confidence = concerning (red)
      switch (confidenceLevel) {
        case 'very-high': return 'text-red-400 bg-red-400/20';
        case 'high': return 'text-red-400 bg-red-400/20';
        case 'medium': return 'text-yellow-400 bg-yellow-400/20';
        case 'low': return 'text-orange-400 bg-orange-400/20';
        case 'very-low': return 'text-green-400 bg-green-400/20';
      }
    }
  };

  const getProgressBarColor = () => {
    if (status === 'available') {
      switch (confidenceLevel) {
        case 'very-high': return 'bg-green-400';
        case 'high': return 'bg-green-400';
        case 'medium': return 'bg-yellow-400';
        case 'low': return 'bg-orange-400';
        case 'very-low': return 'bg-red-400';
      }
    } else {
      switch (confidenceLevel) {
        case 'very-high': return 'bg-red-400';
        case 'high': return 'bg-red-400';
        case 'medium': return 'bg-yellow-400';
        case 'low': return 'bg-orange-400';
        case 'very-low': return 'bg-green-400';
      }
    }
  };

  const confidenceText = status === 'available' 
    ? `${percentage}% confident available`
    : `${percentage}% confident ${status}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            {/* Confidence percentage badge */}
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getConfidenceColor()}`}>
              {percentage}%
            </span>
            
            {/* Progress bar */}
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden max-w-[60px]">
              <div 
                className={`h-full transition-all duration-300 ${getProgressBarColor()}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px] bg-gray-800 border-gray-700">
          <div className="space-y-1">
            <p className="font-medium">{confidenceText}</p>
            {explanation && (
              <p className="text-sm text-gray-300">{explanation}</p>
            )}
            <p className="text-xs text-gray-400">
              Based on matches across music databases
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
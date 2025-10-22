import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
  label?: string;
}

export function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = "md",
  showValue = false,
  className,
  label
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm", 
    lg: "text-base"
  };

  const handleClick = (value: number) => {
    if (readonly || !onRatingChange) return;
    onRatingChange(value);
  };

  const handleMouseEnter = (value: number) => {
    if (readonly) return;
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {label && (
        <span className={cn("text-muted-foreground mr-2", textSizes[size])}>
          {label}:
        </span>
      )}
      
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;
          
          return (
            <button
              key={index}
              type="button"
              className={cn(
                "transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded",
                readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
              )}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              data-testid={`star-${starValue}`}
              title={readonly ? undefined : `Rate ${starValue} star${starValue !== 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-colors",
                  isFilled 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "text-gray-300 hover:text-yellow-300"
                )}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className={cn("text-muted-foreground ml-2", textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
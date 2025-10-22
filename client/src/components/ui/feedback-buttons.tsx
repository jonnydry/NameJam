import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackButtonsProps {
  onFeedback: (isPositive: boolean) => void;
  initialValue?: boolean | null;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FeedbackButtons({ 
  onFeedback, 
  initialValue = null, 
  disabled = false, 
  size = "md",
  className 
}: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<boolean | null>(initialValue);

  const handleFeedback = (isPositive: boolean) => {
    // Toggle if clicking the same button, otherwise set new value
    const newValue = feedback === isPositive ? null : isPositive;
    setFeedback(newValue);
    onFeedback(newValue !== null ? newValue : isPositive);
  };

  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-8 w-8", 
    lg: "h-10 w-10"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant={feedback === true ? "default" : "outline"}
        size="sm"
        className={cn(
          sizeClasses[size],
          "p-0 transition-all",
          feedback === true && "bg-green-500 hover:bg-green-600 border-green-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => handleFeedback(true)}
        disabled={disabled}
        data-testid="feedback-thumbs-up"
        title="This is helpful"
      >
        <ThumbsUp className={cn(iconSizes[size], feedback === true && "text-white")} />
      </Button>
      
      <Button
        variant={feedback === false ? "default" : "outline"}
        size="sm"
        className={cn(
          sizeClasses[size],
          "p-0 transition-all",
          feedback === false && "bg-red-500 hover:bg-red-600 border-red-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => handleFeedback(false)}
        disabled={disabled}
        data-testid="feedback-thumbs-down"
        title="This is not helpful"
      >
        <ThumbsDown className={cn(iconSizes[size], feedback === false && "text-white")} />
      </Button>
    </div>
  );
}
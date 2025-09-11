import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "./star-rating";
import { FeedbackButtons } from "./feedback-buttons";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Sparkles, Brain, Target } from "lucide-react";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentName: string;
  contentType: "name" | "lyric" | "bandBio";
  genre?: string;
  mood?: string;
  wordCount?: number;
  onFeedbackSubmitted?: () => void;
}

export function FeedbackModal({
  open,
  onOpenChange,
  contentName,
  contentType,
  genre,
  mood,
  wordCount,
  onFeedbackSubmitted
}: FeedbackModalProps) {
  const [thumbsRating, setThumbsRating] = useState<boolean | null>(null);
  const [starRating, setStarRating] = useState(0);
  const [creativityRating, setCreativityRating] = useState(0);
  const [memorabilityRating, setMemorabilityRating] = useState(0);
  const [relevanceRating, setRelevanceRating] = useState(0);
  const [textComment, setTextComment] = useState("");

  const { toast } = useToast();

  const submitFeedbackMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/feedback', {
        contentType,
        contentName,
        thumbsRating,
        starRating: starRating > 0 ? starRating : undefined,
        creativityRating: creativityRating > 0 ? creativityRating : undefined,
        memorabilityRating: memorabilityRating > 0 ? memorabilityRating : undefined,
        relevanceRating: relevanceRating > 0 ? relevanceRating : undefined,
        textComment: textComment.trim() || undefined,
        genre,
        mood,
        wordCount,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Thank you for helping us improve!",
      });
      resetForm();
      onOpenChange(false);
      onFeedbackSubmitted?.();
    },
    onError: (error) => {
      toast({
        title: "Failed to submit feedback",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setThumbsRating(null);
    setStarRating(0);
    setCreativityRating(0);
    setMemorabilityRating(0);
    setRelevanceRating(0);
    setTextComment("");
  };

  const handleSubmit = () => {
    if (thumbsRating === null && starRating === 0 && textComment.trim() === "") {
      toast({
        title: "Please provide feedback",
        description: "Use thumbs up/down, star rating, or add a comment.",
        variant: "destructive",
      });
      return;
    }
    submitFeedbackMutation.mutate();
  };

  const getContentTypeLabel = () => {
    switch (contentType) {
      case "name": return "Band/Song Name";
      case "lyric": return "Lyric";
      case "bandBio": return "Band Biography";
      default: return "Content";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="feedback-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve by rating "{contentName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" data-testid="content-type-badge">
              {getContentTypeLabel()}
            </Badge>
            {genre && (
              <Badge variant="outline" data-testid="genre-badge">
                {genre}
              </Badge>
            )}
            {mood && (
              <Badge variant="outline" data-testid="mood-badge">
                {mood}
              </Badge>
            )}
          </div>

          {/* Quick feedback */}
          <div className="space-y-2">
            <Label>Quick Feedback</Label>
            <FeedbackButtons
              onFeedback={setThumbsRating}
              initialValue={thumbsRating}
              size="lg"
              data-testid="modal-thumbs"
            />
          </div>

          {/* Overall rating */}
          <div className="space-y-2">
            <Label>Overall Rating (Optional)</Label>
            <StarRating
              rating={starRating}
              onRatingChange={setStarRating}
              size="lg"
              data-testid="overall-rating"
            />
          </div>

          {/* Detailed ratings */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm font-medium">Detailed Ratings (Optional)</Label>
            
            <StarRating
              rating={creativityRating}
              onRatingChange={setCreativityRating}
              size="md"
              label={
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Creativity
                </span>
              }
              data-testid="creativity-rating"
            />
            
            <StarRating
              rating={memorabilityRating}
              onRatingChange={setMemorabilityRating}
              size="md"
              label={
                <span className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Memorability
                </span>
              }
              data-testid="memorability-rating"
            />
            
            <StarRating
              rating={relevanceRating}
              onRatingChange={setRelevanceRating}
              size="md"
              label={
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Genre Relevance
                </span>
              }
              data-testid="relevance-rating"
            />
          </div>

          {/* Text comment */}
          <div className="space-y-2">
            <Label htmlFor="feedback-comment">Comments (Optional)</Label>
            <Textarea
              id="feedback-comment"
              placeholder="Share your thoughts on this result..."
              value={textComment}
              onChange={(e) => setTextComment(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={1000}
              data-testid="feedback-comment"
            />
            <div className="text-xs text-muted-foreground text-right">
              {textComment.length}/1000
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="feedback-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitFeedbackMutation.isPending}
            data-testid="feedback-submit"
          >
            {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
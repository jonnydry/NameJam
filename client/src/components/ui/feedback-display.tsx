import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./star-rating";
import { FeedbackButtons } from "./feedback-buttons";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Clock, TrendingUp, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FeedbackItem {
  id: number;
  contentType: string;
  contentName: string;
  starRating?: number;
  thumbsRating?: boolean;
  textComment?: string;
  genre?: string;
  mood?: string;
  creativityRating?: number;
  memorabilityRating?: number;
  relevanceRating?: number;
  createdAt: string;
}

interface FeedbackDisplayProps {
  contentName: string;
  contentType: "name" | "lyric" | "bandBio";
  showUserFeedback?: boolean;
  showStats?: boolean;
  className?: string;
}

export function FeedbackDisplay({
  contentName,
  contentType,
  showUserFeedback = true,
  showStats = true,
  className
}: FeedbackDisplayProps) {
  const { isAuthenticated } = useAuth();

  // Get user's feedback for this content
  const { data: userFeedback } = useQuery({
    queryKey: ['/api/feedback/user', contentName, contentType],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/feedback/user?contentType=${contentType}&limit=50`);
      const data = await response.json();
      return data.feedback?.find((f: FeedbackItem) => f.contentName === contentName);
    },
    enabled: isAuthenticated && showUserFeedback,
  });

  // Get stats for this content type
  const { data: contentStats } = useQuery({
    queryKey: ['/api/feedback/stats', contentType],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/feedback/stats?contentType=${contentType}`);
      const data = await response.json();
      return data.stats;
    },
    enabled: isAuthenticated && showStats,
  });

  if (!isAuthenticated || (!userFeedback && !contentStats)) {
    return null;
  }

  return (
    <div className={className}>
      {/* User's existing feedback */}
      {showUserFeedback && userFeedback && (
        <Card className="mb-3" data-testid="user-feedback-display">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Your feedback</span>
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(userFeedback.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {userFeedback.thumbsRating !== null && (
                    <FeedbackButtons
                      onFeedback={() => {}} // Read-only
                      initialValue={userFeedback.thumbsRating}
                      disabled={true}
                      size="sm"
                    />
                  )}
                  
                  {userFeedback.starRating && (
                    <StarRating
                      rating={userFeedback.starRating}
                      readonly={true}
                      size="sm"
                      showValue={true}
                    />
                  )}
                </div>

                {(userFeedback.creativityRating || userFeedback.memorabilityRating || userFeedback.relevanceRating) && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {userFeedback.creativityRating && (
                      <Badge variant="outline" className="text-xs">
                        Creativity: {userFeedback.creativityRating}/5
                      </Badge>
                    )}
                    {userFeedback.memorabilityRating && (
                      <Badge variant="outline" className="text-xs">
                        Memorable: {userFeedback.memorabilityRating}/5
                      </Badge>
                    )}
                    {userFeedback.relevanceRating && (
                      <Badge variant="outline" className="text-xs">
                        Relevant: {userFeedback.relevanceRating}/5
                      </Badge>
                    )}
                  </div>
                )}

                {userFeedback.textComment && (
                  <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-2">
                    "{userFeedback.textComment}"
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content type statistics */}
      {showStats && contentStats && contentStats.totalFeedbacks > 0 && (
        <Card data-testid="content-stats-display">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Community Insights</span>
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {contentStats.totalFeedbacks} ratings
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Average Rating:</span>
                    <div className="flex items-center gap-1">
                      <StarRating
                        rating={contentStats.averageStarRating}
                        readonly={true}
                        size="sm"
                      />
                      <span className="text-xs text-muted-foreground">
                        ({contentStats.averageStarRating.toFixed(1)})
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Positive:</span>
                    <span className="text-sm font-medium text-green-600">
                      {contentStats.positiveThumbsPercentage.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  {contentStats.qualityBreakdown && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">Creativity:</span>
                        <span className="text-xs">{contentStats.qualityBreakdown.creativity}/5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">Memorable:</span>
                        <span className="text-xs">{contentStats.qualityBreakdown.memorability}/5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">Relevant:</span>
                        <span className="text-xs">{contentStats.qualityBreakdown.relevance}/5</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
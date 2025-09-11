import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StarRating } from "./star-rating";
import { apiRequest } from "@/lib/queryClient";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  Users, 
  MessageSquare,
  ThumbsUp,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackSummaryProps {
  contentType?: "name" | "lyric" | "bandBio";
  genre?: string;
  timeframe?: number;
  className?: string;
}

interface TrendData {
  contentType: string;
  qualityTrend: "improving" | "stable" | "declining";
  averageRating: number;
  feedbackCount: number;
}

interface StatsData {
  totalFeedbacks: number;
  averageStarRating: number;
  positiveThumbsPercentage: number;
  qualityBreakdown: {
    creativity: number;
    memorability: number;
    relevance: number;
  };
}

export function FeedbackSummary({
  contentType,
  genre,
  timeframe = 7,
  className
}: FeedbackSummaryProps) {
  // Get feedback analytics/trends
  const { data: trendsData } = useQuery({
    queryKey: ['/api/feedback/analytics', contentType, timeframe],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (contentType) params.append('contentType', contentType);
      params.append('hours', (timeframe * 24).toString());
      
      const response = await apiRequest('GET', `/api/feedback/analytics?${params}`);
      return response.json();
    },
  });

  // Get detailed stats if contentType is specified
  const { data: statsData } = useQuery({
    queryKey: ['/api/feedback/stats', contentType, genre, timeframe],
    queryFn: async () => {
      if (!contentType) return null;
      
      const params = new URLSearchParams();
      params.append('contentType', contentType);
      if (genre) params.append('genre', genre);
      if (timeframe) params.append('timeframe', timeframe.toString());
      
      const response = await apiRequest('GET', `/api/feedback/stats?${params}`);
      const data = await response.json();
      return data.stats;
    },
    enabled: !!contentType,
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "declining": return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving": return "text-green-600 bg-green-50 border-green-200";
      case "declining": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (!trendsData && !statsData) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No feedback data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)} data-testid="feedback-summary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {contentType ? `${contentType} Feedback` : 'Community Insights'}
          {genre && (
            <Badge variant="outline" className="ml-2">
              {genre}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Trends Overview */}
        {trendsData?.trends && trendsData.trends.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recent Trends ({timeframe} days)
            </h4>
            
            <div className="grid gap-2">
              {trendsData.trends.map((trend: TrendData) => (
                <div
                  key={trend.contentType}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    getTrendColor(trend.qualityTrend)
                  )}
                  data-testid={`trend-${trend.contentType}`}
                >
                  <div className="flex items-center gap-2">
                    {getTrendIcon(trend.qualityTrend)}
                    <span className="text-sm font-medium capitalize">
                      {trend.contentType}s
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <StarRating 
                        rating={trend.averageRating} 
                        readonly 
                        size="sm" 
                      />
                      <span>({trend.averageRating.toFixed(1)})</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{trend.feedbackCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Statistics */}
        {statsData && statsData.totalFeedbacks > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Detailed Statistics
            </h4>

            {/* Summary metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Average Rating</span>
                  <div className="flex items-center gap-1">
                    <StarRating 
                      rating={statsData.averageStarRating} 
                      readonly 
                      size="sm" 
                    />
                    <span className="text-xs">({statsData.averageStarRating.toFixed(1)})</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Positive Feedback</span>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3 text-green-500" />
                    <span>{statsData.positiveThumbsPercentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Ratings</span>
                  <span className="font-medium">{statsData.totalFeedbacks}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Time Period</span>
                  <span>{timeframe} days</span>
                </div>
              </div>
            </div>

            {/* Quality breakdown */}
            {statsData.qualityBreakdown && (
              <div className="space-y-3">
                <h5 className="text-sm font-medium">Quality Breakdown</h5>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Creativity</span>
                    <span>{statsData.qualityBreakdown.creativity.toFixed(1)}/5</span>
                  </div>
                  <Progress 
                    value={(statsData.qualityBreakdown.creativity / 5) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Memorability</span>
                    <span>{statsData.qualityBreakdown.memorability.toFixed(1)}/5</span>
                  </div>
                  <Progress 
                    value={(statsData.qualityBreakdown.memorability / 5) * 100} 
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Relevance</span>
                    <span>{statsData.qualityBreakdown.relevance.toFixed(1)}/5</span>
                  </div>
                  <Progress 
                    value={(statsData.qualityBreakdown.relevance / 5) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* No data message */}
        {(!statsData || statsData.totalFeedbacks === 0) && 
         (!trendsData?.trends || trendsData.trends.length === 0) && (
          <div className="text-center text-muted-foreground py-6">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No feedback data available for this time period</p>
            <p className="text-xs mt-1">Be the first to leave feedback!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
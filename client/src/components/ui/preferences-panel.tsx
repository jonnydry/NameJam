import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Sparkles, Brain, Target, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserPreferences {
  preferredGenres: string[];
  preferredMoods: string[];
  preferredWordCounts: number[];
  creativityWeight: number;
  memorabilityWeight: number;
  relevanceWeight: number;
  availabilityWeight: number;
  feedbackFrequency: string;
  qualityThreshold: string;
}

interface PreferencesPanelProps {
  className?: string;
}

const GENRES = [
  "rock", "metal", "jazz", "electronic", "folk", "classical",
  "hip-hop", "country", "blues", "reggae", "punk", "indie", 
  "pop", "alternative", "jam band"
];

const MOODS = [
  "dark", "bright", "mysterious", "energetic", "melancholy", 
  "ethereal", "aggressive", "peaceful", "nostalgic", "futuristic", 
  "romantic", "epic"
];

const WORD_COUNTS = [1, 2, 3, 4];

export function PreferencesPanel({ className }: PreferencesPanelProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferredGenres: [],
    preferredMoods: [],
    preferredWordCounts: [],
    creativityWeight: 5,
    memorabilityWeight: 5,
    relevanceWeight: 5,
    availabilityWeight: 7,
    feedbackFrequency: "normal",
    qualityThreshold: "moderate",
  });

  const { toast } = useToast();

  // Load user preferences
  const { data: preferencesData, isLoading } = useQuery({
    queryKey: ['/api/preferences'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/preferences');
      return response.json();
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: UserPreferences) => {
      const response = await apiRequest('PUT', '/api/preferences', newPreferences);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences saved",
        description: "Your preferences have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
    },
    onError: () => {
      toast({
        title: "Failed to save preferences",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Load preferences when data is available
  useEffect(() => {
    if (preferencesData?.preferences) {
      setPreferences(preferencesData.preferences);
    }
  }, [preferencesData]);

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  const toggleGenre = (genre: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredGenres: prev.preferredGenres.includes(genre)
        ? prev.preferredGenres.filter(g => g !== genre)
        : [...prev.preferredGenres, genre]
    }));
  };

  const toggleMood = (mood: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredMoods: prev.preferredMoods.includes(mood)
        ? prev.preferredMoods.filter(m => m !== mood)
        : [...prev.preferredMoods, mood]
    }));
  };

  const toggleWordCount = (count: number) => {
    setPreferences(prev => ({
      ...prev,
      preferredWordCounts: prev.preferredWordCounts.includes(count)
        ? prev.preferredWordCounts.filter(c => c !== count)
        : [...prev.preferredWordCounts, count]
    }));
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)} data-testid="preferences-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Content Preferences
        </CardTitle>
        <CardDescription>
          Customize your experience and help us provide better results
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Preferred Genres */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Preferred Genres</Label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <Badge
                key={genre}
                variant={preferences.preferredGenres.includes(genre) ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => toggleGenre(genre)}
                data-testid={`genre-${genre}`}
              >
                {preferences.preferredGenres.includes(genre) && (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        {/* Preferred Moods */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Preferred Moods</Label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <Badge
                key={mood}
                variant={preferences.preferredMoods.includes(mood) ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => toggleMood(mood)}
                data-testid={`mood-${mood}`}
              >
                {preferences.preferredMoods.includes(mood) && (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                {mood}
              </Badge>
            ))}
          </div>
        </div>

        {/* Preferred Word Counts */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Preferred Word Counts</Label>
          <div className="flex gap-2">
            {WORD_COUNTS.map((count) => (
              <Badge
                key={count}
                variant={preferences.preferredWordCounts.includes(count) ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => toggleWordCount(count)}
                data-testid={`word-count-${count}`}
              >
                {preferences.preferredWordCounts.includes(count) && (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                {count} word{count !== 1 ? 's' : ''}
              </Badge>
            ))}
          </div>
        </div>

        {/* Quality Weights */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-sm font-medium">Quality Importance (1-10)</Label>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4" />
                  Creativity
                </Label>
                <span className="text-sm text-muted-foreground">{preferences.creativityWeight}</span>
              </div>
              <Slider
                value={[preferences.creativityWeight]}
                onValueChange={([value]) => setPreferences(prev => ({ ...prev, creativityWeight: value }))}
                min={1}
                max={10}
                step={1}
                className="w-full"
                data-testid="creativity-weight"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4" />
                  Memorability
                </Label>
                <span className="text-sm text-muted-foreground">{preferences.memorabilityWeight}</span>
              </div>
              <Slider
                value={[preferences.memorabilityWeight]}
                onValueChange={([value]) => setPreferences(prev => ({ ...prev, memorabilityWeight: value }))}
                min={1}
                max={10}
                step={1}
                className="w-full"
                data-testid="memorability-weight"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4" />
                  Genre Relevance
                </Label>
                <span className="text-sm text-muted-foreground">{preferences.relevanceWeight}</span>
              </div>
              <Slider
                value={[preferences.relevanceWeight]}
                onValueChange={([value]) => setPreferences(prev => ({ ...prev, relevanceWeight: value }))}
                min={1}
                max={10}
                step={1}
                className="w-full"
                data-testid="relevance-weight"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Name Availability
                </Label>
                <span className="text-sm text-muted-foreground">{preferences.availabilityWeight}</span>
              </div>
              <Slider
                value={[preferences.availabilityWeight]}
                onValueChange={([value]) => setPreferences(prev => ({ ...prev, availabilityWeight: value }))}
                min={1}
                max={10}
                step={1}
                className="w-full"
                data-testid="availability-weight"
              />
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-sm font-medium">System Preferences</Label>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Quality Threshold</Label>
              <Select
                value={preferences.qualityThreshold}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, qualityThreshold: value }))}
              >
                <SelectTrigger data-testid="quality-threshold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">Strict</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="lenient">Lenient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Feedback Frequency</Label>
              <Select
                value={preferences.feedbackFrequency}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, feedbackFrequency: value }))}
              >
                <SelectTrigger data-testid="feedback-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSavePreferences}
            disabled={updatePreferencesMutation.isPending}
            data-testid="save-preferences"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
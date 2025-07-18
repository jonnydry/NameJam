import { useState } from "react";
import { Music, RefreshCw, Heart, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { LoadingAnimation } from "./loading-animation";
import { useStash } from "@/context/stash-context";

interface LyricResult {
  id: number;
  lyric: string;
  genre?: string;
  songSection?: string;
  model?: string;
  generatedAt: string;
}

export function LyricJam() {
  const [genre, setGenre] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [currentLyric, setCurrentLyric] = useState<LyricResult | null>(null);
  const { addToStash } = useStash();

  const genres = [
    "rock", "pop", "country", "hip-hop", "indie", "folk", 
    "metal", "jazz", "electronic", "blues", "punk", 
    "alternative", "reggae", "classical"
  ];

  const loadingMessages = [
    "One sec...",
    "Compiling Vibe",
    "Resisting stasis",
    "Calling the Muse",
    "Lost in the soup brb",
    "Saucing the aesthetic",
    "Beginning to begin",
    "Taxes and Regulations",
    "Launching Lunch",
    "Recording a message for the aliens",
    "Anticipating failure",
    "I sound my barbaric yawp over the roofs of the world"
  ];

  const getRandomLoadingMessage = () => {
    return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
  };

  const generateLyric = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-lyric-starter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre: genre === "all" ? undefined : genre }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate lyric");
      }

      const data = await response.json();
      setCurrentLyric(data);
    } catch (error) {
      console.error("Error generating lyric:", error);
      toast({
        title: "Error",
        description: "Failed to generate lyric. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToStash = () => {
    if (currentLyric) {
      addToStash({
        name: currentLyric.lyric,
        type: 'lyricJam',
        wordCount: currentLyric.lyric.split(' ').length,
        genre: genre === "all" ? undefined : genre,
        metadata: {
          songSection: currentLyric.songSection,
          model: currentLyric.model
        }
      });
      toast({
        title: "Added to Stash",
        description: "Lyric starter saved to your collection",
      });
    }
  };

  const getSectionColor = (section?: string) => {
    const colors: Record<string, string> = {
      verse: "bg-blue-600",
      chorus: "bg-purple-600",
      bridge: "bg-green-600",
      "pre-chorus": "bg-orange-600",
      outro: "bg-red-600"
    };
    return colors[section || ""] || "bg-gray-600";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Lyric_Jam Generator
          </CardTitle>
          <CardDescription>
            Get inspired with a powerful opening line for your next song
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select genre (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All genres</SelectItem>
                  {genres.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={generateLyric} 
                disabled={isLoading}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate Lyric Starter
              </Button>
            </div>

            {isLoading && (
              <div className="py-8">
                <LoadingAnimation message={getRandomLoadingMessage()} />
              </div>
            )}

            {currentLyric && !isLoading && (
              <Card className="border-2">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      {currentLyric.songSection && (
                        <Badge className={`${getSectionColor(currentLyric.songSection)} text-white`}>
                          {currentLyric.songSection.toUpperCase()}
                        </Badge>
                      )}
                      <p className="text-xl font-medium italic leading-relaxed">
                        "{currentLyric.lyric}"
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAddToStash}
                      className="hover:text-red-500"
                    >
                      <Heart className="w-5 h-5" />
                    </Button>
                  </div>
                  {currentLyric.model && currentLyric.model !== 'fallback' && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-purple-600">🧠</span>
                      <span>Generated by {currentLyric.model}</span>
                    </div>
                  )}
                </CardHeader>
                <CardFooter className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {genre !== "all" && <span>Genre: {genre}</span>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateLyric}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate Another
                  </Button>
                </CardFooter>
              </Card>
            )}

            {!currentLyric && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Click "Generate Lyric Starter" to begin your songwriting journey</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useRef } from "react";
import { NotebookPen, RefreshCw, Heart, Brain, Music } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useStash } from "@/context/stash-context";
import { handleApiError } from "@/lib/api-error-handler";
import { LoadingAnimation } from "./loading-animation";

interface LyricResponse {
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
  const [currentLyric, setCurrentLyric] = useState<LyricResponse | null>(null);
  const { addToStash } = useStash();
  const loadingRef = useRef<HTMLDivElement>(null);
  const generateButtonRef = useRef<HTMLButtonElement>(null);

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
    
    // Scroll to loading animation
    setTimeout(() => {
      loadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    
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
      
      // Add delay to let users read loading messages
      await new Promise(resolve => setTimeout(resolve, 2800));
      
      setCurrentLyric(data);
    } catch (error) {
      handleApiError(error, {
        title: "Error",
        description: "Failed to generate lyric. Please try again."
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
        description: "Lyric spark saved to your collection",
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
      <Card className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <NotebookPen className="w-5 h-5" />
            Lyric_Jam Generator
          </CardTitle>
          <CardDescription>
            Get inspired with a powerful opening line for your next song
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Genre</label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Any genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any genre</SelectItem>
                  <SelectItem value="rock">🎸 Rock</SelectItem>
                  <SelectItem value="pop">💫 Pop</SelectItem>
                  <SelectItem value="country">🤠 Country</SelectItem>
                  <SelectItem value="hip-hop">🎤 Hip-Hop</SelectItem>
                  <SelectItem value="indie">🎨 Indie</SelectItem>
                  <SelectItem value="folk">🪕 Folk</SelectItem>
                  <SelectItem value="metal">🤘 Metal</SelectItem>
                  <SelectItem value="jazz">🎺 Jazz</SelectItem>
                  <SelectItem value="electronic">🎛️ Electronic</SelectItem>
                  <SelectItem value="blues">🎵 Blues</SelectItem>
                  <SelectItem value="punk">⚡ Punk</SelectItem>
                  <SelectItem value="alternative">🌀 Alternative</SelectItem>
                  <SelectItem value="reggae">🌴 Reggae</SelectItem>
                  <SelectItem value="classical">🎼 Classical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button
            onClick={generateLyric}
            disabled={isLoading}
            className="w-full btn-gradient-blue-green text-white"
            ref={generateButtonRef}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating Lyric Spark...
              </>
            ) : (
              <>
                <Music className="w-4 h-4 mr-2" />
                Generate Lyric Spark
              </>
            )}
          </Button>
          
          <div className="space-y-4">

            {isLoading && (
              <div ref={loadingRef} className="py-8">
                <LoadingAnimation stage="generating" />
                <div className="text-center space-y-2 mt-4">
                  <div className="text-lg text-foreground font-medium">{getRandomLoadingMessage()}</div>
                  <div className="text-sm text-muted-foreground">Channeling the lyrical spirits</div>
                </div>
              </div>
            )}

            {currentLyric && !isLoading && (
              <Card className="border-2">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-2 flex-1 min-w-0">
                      {currentLyric.songSection && (
                        <Badge className={`${getSectionColor(currentLyric.songSection)} text-white`}>
                          {currentLyric.songSection.toUpperCase()}
                        </Badge>
                      )}
                      <p className="text-lg sm:text-xl font-medium italic leading-relaxed break-words">
                        "{currentLyric.lyric}"
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAddToStash}
                      className="hover:text-red-500 shrink-0"
                    >
                      <Heart className="w-5 h-5" />
                    </Button>
                  </div>
                  {currentLyric.model && currentLyric.model !== 'fallback' && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <span>Generated by {currentLyric.model}</span>
                    </div>
                  )}
                </CardHeader>
                <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {genre !== "all" && <span>Genre: {genre}</span>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateLyric}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Generate Another</span>
                    <span className="sm:hidden">Another</span>
                  </Button>
                </CardFooter>
              </Card>
            )}

            {!currentLyric && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <NotebookPen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Click "Generate Lyric Spark" to begin your songwriting journey</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
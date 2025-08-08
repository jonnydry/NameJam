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
import { useLoadingProgress } from "@/hooks/use-loading-progress";

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
  
  // Dynamic loading progress tracking
  const lyricProgress = useLoadingProgress({ 
    estimatedDuration: 3000, // 3 seconds for lyric generation
    onComplete: () => {
      // Progress animation complete
    }
  });

  const genres = [
    "rock", "pop", "country", "hip-hop", "indie", "folk", 
    "metal", "jazz", "electronic", "blues", "punk", 
    "alternative", "reggae", "classical", "jam band"
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
    lyricProgress.startLoading(); // Start progress tracking
    
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
      
      // Complete loading progress (removed artificial delay)
      lyricProgress.completeLoading();
      
      setCurrentLyric(data);
    } catch (error) {
      lyricProgress.completeLoading(); // Complete progress even on error
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
      intro: "bg-gradient-to-r from-blue-500 to-blue-600",
      verse: "bg-gradient-to-r from-green-500 to-green-600",
      chorus: "bg-gradient-to-r from-purple-500 to-purple-600",
      bridge: "bg-gradient-to-r from-orange-500 to-orange-600",
      "pre-chorus": "bg-gradient-to-r from-yellow-500 to-yellow-600",
      outro: "bg-gradient-to-r from-red-500 to-red-600",
      hook: "bg-gradient-to-r from-pink-500 to-pink-600"
    };
    return colors[section?.toLowerCase() || ""] || "bg-gradient-to-r from-gray-500 to-gray-600";
  };

  return (
    <div className="space-y-6">
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
                <LoadingAnimation 
                  stage="generating" 
                  actualProgress={lyricProgress.progress}
                  estimatedDuration={lyricProgress.estimatedDuration}
                />
                <div className="text-center space-y-2 mt-4">
                  <div className="text-lg text-foreground font-medium">{getRandomLoadingMessage()}</div>
                  <div className="text-sm text-muted-foreground">Channeling the lyrical spirits</div>
                </div>
              </div>
            )}

            {currentLyric && !isLoading && (
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 shadow-xl hover:shadow-2xl transition-all duration-300">
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-black/20" />
                
                <CardHeader className="relative space-y-6 p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-4 flex-1 min-w-0">
                      <div className="space-y-2">
                        {currentLyric.lyric.includes('\n') ? (
                          currentLyric.lyric.split('\n').map((line, index) => (
                            <div 
                              key={index} 
                              className={`text-lg sm:text-xl font-light leading-relaxed text-gray-100 ${index > 0 ? 'mt-2' : ''}`}
                            >
                              <span className="italic tracking-wide">{line}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-lg sm:text-xl font-light italic leading-relaxed text-gray-100 tracking-wide">
                            {currentLyric.lyric}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAddToStash}
                      className="hover:text-red-500 hover:bg-white/10 transition-all duration-200 shrink-0"
                    >
                      <Heart className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {/* Bottom metadata section */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                    <div className="flex flex-col gap-2">
                      {currentLyric.model && currentLyric.model !== 'fallback' && (
                        <div className="flex items-center gap-2 text-sm">
                          <Brain className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">Generated by {currentLyric.model}</span>
                        </div>
                      )}
                      {genre !== "all" && (
                        <div className="text-sm text-gray-400">
                          Genre: <span className="text-gray-300 font-medium">{genre}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardFooter className="relative border-t border-white/10 bg-black/20 p-4 sm:p-6">
                  <Button
                    variant="outline"
                    onClick={generateLyric}
                    className="w-full sm:w-auto gap-2 bg-white/5 border-white/20 hover:border-white/40 hover:bg-white/10 text-white transition-all duration-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate Another
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
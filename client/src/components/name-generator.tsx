import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingAnimation } from "./loading-animation";
import { ResultCard } from "./result-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useClipboard } from "@/hooks/use-clipboard";
import { Music, Users, Search, Palette, RefreshCw, Copy, Lightbulb, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { createMutationErrorHandler } from "@/lib/api-error-handler";
import { useKeyboardShortcuts, KeyboardHint } from "@/hooks/use-keyboard-shortcuts";
import { useDebouncedCallback } from "@/hooks/use-debounce";

interface GenerationResult {
  id: number;
  name: string;
  type: string;
  wordCount: number;
  verification: {
    status: 'available' | 'similar' | 'taken';
    details?: string;
    similarNames?: string[];
    verificationLinks?: Array<{
      name: string;
      url: string;
      source: string;
    }>;
  };
}

export function NameGenerator() {
  const [nameType, setNameType] = useState<'band' | 'song'>('band');
  const [wordCount, setWordCount] = useState(2);
  const [mood, setMood] = useState<string>('none');
  const [genre, setGenre] = useState<string>('none');
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchResult, setSearchResult] = useState<GenerationResult | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const { copyToClipboard } = useClipboard();
  const loadingRef = useRef<HTMLDivElement>(null);
  const generateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/generate-names', {
        type: nameType,
        wordCount,
        count: 4,
        ...(mood && mood !== 'none' && { mood }),
        ...(genre && genre !== 'none' && { genre })
      });
      const data = await response.json();
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format');
      }
      return data;
    },
    onSuccess: (data) => {
      setResults(data.results);
      setSearchResult(null); // Clear search result when generating new names
      setIsGenerating(false); // Reset generating state
      
      toast({
        title: "Names generated successfully!",
        description: `Generated ${data.results.length} unique ${nameType} names${data.cached ? ' (cached)' : ''}.`,
      });
    },
    onError: (error) => {
      setIsGenerating(false); // Reset generating state on error
      createMutationErrorHandler("Generation failed", "Failed to generate names. Please try again.")(error);
    },
    onSettled: () => {
      setIsGenerating(false); // Always reset generating state when done
    },
  });

  const searchMutation = useMutation({
    mutationFn: async () => {
      const trimmedInput = searchInput.trim();
      if (!trimmedInput) {
        throw new Error('Please enter a name to search');
      }
      if (trimmedInput.length > 100) {
        throw new Error('Name is too long. Please use 100 characters or less.');
      }
      const response = await apiRequest('POST', '/api/verify-name', {
        name: trimmedInput,
        type: nameType
      });
      const data = await response.json();
      if (!data.verification) {
        throw new Error('Invalid verification response');
      }
      return data;
    },
    onSuccess: (data) => {
      const searchResult: GenerationResult = {
        id: Date.now(), // Temporary ID for display
        name: searchInput.trim(),
        type: nameType,
        wordCount: searchInput.trim().split(' ').length,
        verification: data.verification
      };
      setSearchResult(searchResult);
      setResults([]); // Clear generated results when searching
      toast({
        title: "Name verified!",
        description: `Checked availability of "${searchInput.trim()}".`,
      });
    },
    onError: createMutationErrorHandler("Verification failed", "Failed to verify name. Please try again."),
  });

  // Optimized generate function with better debouncing
  const handleGenerate = useDebouncedCallback(() => {
    if (generateMutation.isPending) return; // Prevent duplicate calls
    setIsGenerating(true);
    generateMutation.mutate();
  }, 300);

  const handleGenerateMore = useDebouncedCallback(() => {
    if (generateMutation.isPending) return; // Prevent duplicate calls
    setIsGenerating(true);
    generateMutation.mutate();
    // Scroll to loading area
    setTimeout(() => {
      loadingRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }, 300);

  const handleSearch = () => {
    searchMutation.mutate();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Space to generate (only when not typing in input)
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        handleGenerate();
      }
      // 'g' for generate as alternative
      if (e.key === 'g' && e.target === document.body && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleGenerate();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleGenerate]);

  return (
    <div className="space-y-6">
      {/* Controls Panel */}
      <div className="bg-gradient-to-r from-black/90 to-gray-900/90 border-blue-500/20 rounded-xl shadow-sm border p-6">
        {/* Type Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg bg-muted p-1">
            <Button
              variant={nameType === 'band' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setNameType('band')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                nameType === 'band'
                  ? 'btn-gradient text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-primary'
              }`}
              aria-pressed={nameType === 'band'}
              aria-label="Generate band names"
            >
              <Users className="w-4 h-4 mr-2" aria-hidden="true" />
              Band Name
            </Button>
            <Button
              variant={nameType === 'song' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setNameType('song')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                nameType === 'song'
                  ? 'btn-gradient text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-primary'
              }`}
              aria-pressed={nameType === 'song'}
              aria-label="Generate song names"
            >
              <Music className="w-4 h-4 mr-2" aria-hidden="true" />
              Song Name
            </Button>
          </div>
        </div>

        {/* Word Count Selector */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <label htmlFor="wordCount" className="text-responsive-sm font-medium text-muted-foreground">
            Number of words:
          </label>
          <Select value={wordCount.toString()} onValueChange={(value) => setWordCount(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 word</SelectItem>
              <SelectItem value="2">2 words</SelectItem>
              <SelectItem value="3">3 words</SelectItem>
              <SelectItem value="4">4 words</SelectItem>
              <SelectItem value="5">5 words</SelectItem>
              <SelectItem value="6">6 words</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mood Selector */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <label htmlFor="mood" className="text-responsive-sm font-medium text-muted-foreground flex items-center">
            <Palette className="w-4 h-4 mr-2" />
            Mood:
          </label>
          <Select value={mood} onValueChange={setMood}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Any mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Any mood</SelectItem>
              <SelectItem value="dark">🌑 Dark</SelectItem>
              <SelectItem value="bright">☀️ Bright</SelectItem>
              <SelectItem value="mysterious">🔮 Mysterious</SelectItem>
              <SelectItem value="energetic">⚡ Energetic</SelectItem>
              <SelectItem value="melancholy">🌧️ Melancholy</SelectItem>
              <SelectItem value="ethereal">✨ Ethereal</SelectItem>
              <SelectItem value="aggressive">🔥 Aggressive</SelectItem>
              <SelectItem value="peaceful">🕊️ Peaceful</SelectItem>
              <SelectItem value="nostalgic">📚 Nostalgic</SelectItem>
              <SelectItem value="futuristic">🚀 Futuristic</SelectItem>
              <SelectItem value="romantic">💕 Romantic</SelectItem>
              <SelectItem value="epic">⚔️ Epic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Genre Selector */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <label htmlFor="genre" className="text-responsive-sm font-medium text-muted-foreground flex items-center">
            <Music className="w-4 h-4 mr-2" />
            Genre:
          </label>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Any genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Any genre</SelectItem>
              <SelectItem value="rock">🎸 Rock</SelectItem>
              <SelectItem value="metal">🤘 Metal</SelectItem>
              <SelectItem value="jazz">🎺 Jazz</SelectItem>
              <SelectItem value="electronic">🎛️ Electronic</SelectItem>
              <SelectItem value="folk">🪕 Folk</SelectItem>
              <SelectItem value="classical">🎼 Classical</SelectItem>
              <SelectItem value="hip-hop">🎤 Hip-Hop</SelectItem>
              <SelectItem value="country">🤠 Country</SelectItem>
              <SelectItem value="blues">🎵 Blues</SelectItem>
              <SelectItem value="reggae">🌴 Reggae</SelectItem>
              <SelectItem value="punk">⚡ Punk</SelectItem>
              <SelectItem value="indie">🎨 Indie</SelectItem>
              <SelectItem value="pop">💫 Pop</SelectItem>
              <SelectItem value="alternative">🌀 Alternative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <div className="text-center">
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || isGenerating}
            className="inline-flex items-center px-8 py-3 btn-gradient text-primary-foreground font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            aria-label="Generate band or song names"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Generate Names
          </Button>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <KeyboardHint keys={['Space']} />
            <span>or</span>
            <KeyboardHint keys={['G']} />
            <span>to generate</span>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div 
        className={`rounded-xl shadow-sm transition-all duration-300 border p-6 ${
          isSearchActive ? 'bg-gradient-to-r from-black/90 to-gray-900/90 border-blue-500/20' : 'bg-card border-border'
        }`}
        onMouseEnter={() => setIsSearchActive(true)}
        onMouseLeave={() => setIsSearchActive(false)}
      >
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium text-foreground mb-2">Check Your Own Name</h3>
          <p className="text-sm text-muted-foreground">Enter a name you've thought of to verify its availability</p>
        </div>
        
        <div className="flex space-x-3 max-w-md mx-auto">
          <Input
            type="text"
            placeholder={`Enter a ${nameType} name...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setIsSearchActive(true)}
            onBlur={() => setIsSearchActive(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !searchMutation.isPending && searchInput.trim()) {
                handleSearch();
              }
            }}
            className="flex-1"
            disabled={searchMutation.isPending}
            maxLength={100}
            aria-label={`Enter ${nameType} name to verify`}
          />
          <Button
            onClick={handleSearch}
            disabled={searchMutation.isPending || !searchInput.trim()}
            className="inline-flex items-center btn-gradient text-primary-foreground font-medium"
            aria-label="Check name availability"
          >
            {searchMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Check
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading States */}
      {(generateMutation.isPending || searchMutation.isPending) && (
        <div ref={loadingRef} className="bg-card rounded-xl shadow-sm border border-border p-8">
          <LoadingAnimation 
            stage={generateMutation.isPending ? 'generating' : 'verifying'}
          />
        </div>
      )}

      {/* Search Result */}
      {searchResult && !searchMutation.isPending && (
        <div className="space-y-4">
          <div className="animate-slide-up">
            <ResultCard
              result={searchResult}
              nameType={nameType}
              onCopy={copyToClipboard}
              genre={genre !== 'none' ? genre : undefined}
              mood={mood !== 'none' ? mood : undefined}
            />
          </div>
        </div>
      )}



      {/* Generated Results */}
      {results.length > 0 && !generateMutation.isPending && (
        <div className="space-y-4" aria-live="polite" aria-atomic="true">
          <div className="flex flex-col gap-4 max-w-2xl mx-auto">
            {results.map((result, index) => (
              <div
                key={`result-${index}-${result.name.replace(/\s+/g, '-').toLowerCase()}`}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ResultCard
                  result={result}
                  nameType={nameType}
                  onCopy={copyToClipboard}
                  genre={genre !== 'none' ? genre : undefined}
                  mood={mood !== 'none' ? mood : undefined}
                />
              </div>
            ))}
          </div>
          
          {/* Generate More Button */}
          <div className="text-center pt-4">
            <Button
              onClick={handleGenerateMore}
              variant="outline"
              disabled={generateMutation.isPending || isGenerating}
              className="inline-flex items-center px-6 py-2 btn-gradient text-primary-foreground font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Generate More Names
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !searchResult && !generateMutation.isPending && !searchMutation.isPending && (
        <div className="text-center py-12">
          <div className="text-neutral-600 mb-4">
            <Music className="w-16 h-16 text-neutral-200 mx-auto" />
          </div>
          <p className="text-lg text-neutral-600 mb-2">Ready to generate unique names</p>
          <p className="text-sm text-neutral-600">Click "Generate Names" to start creating or search for a specific name</p>
        </div>
      )}
    </div>
  );
}

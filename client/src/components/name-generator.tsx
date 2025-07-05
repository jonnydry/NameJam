import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingAnimation } from "./loading-animation";
import { ResultCard } from "./result-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Music, Users, Wand2, RefreshCw, Search, Palette } from "lucide-react";

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
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchResult, setSearchResult] = useState<GenerationResult | null>(null);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/generate-names', {
        type: nameType,
        wordCount,
        count: 3,
        ...(mood && mood !== 'none' && { mood })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data.results);
      setSearchResult(null); // Clear search result when generating new names
      toast({
        title: "Names generated successfully!",
        description: `Generated ${data.results.length} unique ${nameType} names.`,
      });
    },
    onError: (error) => {
      console.error('Error generating names:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate names. Please try again.",
        variant: "destructive",
      });
    },
  });

  const searchMutation = useMutation({
    mutationFn: async () => {
      if (!searchInput.trim()) {
        throw new Error('Please enter a name to search');
      }
      const response = await apiRequest('POST', '/api/verify-name', {
        name: searchInput.trim(),
        type: nameType
      });
      return response.json();
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
    onError: (error) => {
      console.error('Error verifying name:', error);
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Failed to verify name. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleGenerateMore = () => {
    generateMutation.mutate();
  };

  const handleSearch = () => {
    searchMutation.mutate();
  };

  const copyToClipboard = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      toast({
        title: "Copied to clipboard!",
        description: `"${name}" has been copied to your clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Panel */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
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
            >
              <Users className="w-4 h-4 mr-2" />
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
            >
              <Music className="w-4 h-4 mr-2" />
              Song Name
            </Button>
          </div>
        </div>

        {/* Word Count Selector */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <label htmlFor="wordCount" className="text-sm font-medium text-muted-foreground">
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
        <div className="flex items-center justify-center space-x-4 mb-6">
          <label htmlFor="mood" className="text-sm font-medium text-muted-foreground flex items-center">
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

        {/* Generate Button */}
        <div className="text-center">
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="inline-flex items-center px-8 py-3 btn-gradient text-primary-foreground font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Names
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
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
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
            disabled={searchMutation.isPending}
          />
          <Button
            onClick={handleSearch}
            disabled={searchMutation.isPending || !searchInput.trim()}
            className="inline-flex items-center btn-gradient text-primary-foreground font-medium"
          >
            <Search className="w-4 h-4 mr-2" />
            Check
          </Button>
        </div>
      </div>

      {/* Loading States */}
      {(generateMutation.isPending || searchMutation.isPending) && (
        <div className="bg-card rounded-xl shadow-sm border border-border p-8">
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
            />
          </div>
        </div>
      )}

      {/* Generated Results */}
      {results.length > 0 && !generateMutation.isPending && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={result.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ResultCard
                result={result}
                nameType={nameType}
                onCopy={copyToClipboard}
              />
            </div>
          ))}
          
          {/* Generate More Button */}
          <div className="text-center pt-4">
            <Button
              onClick={handleGenerateMore}
              variant="outline"
              disabled={generateMutation.isPending}
              className="inline-flex items-center px-6 py-2 btn-gradient text-primary-foreground font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
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

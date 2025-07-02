import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingAnimation } from "./loading-animation";
import { ResultCard } from "./result-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Music, Users, Wand2, RefreshCw } from "lucide-react";

interface GenerationResult {
  id: number;
  name: string;
  type: string;
  wordCount: number;
  verification: {
    status: 'available' | 'similar' | 'taken';
    details?: string;
    similarNames?: string[];
  };
}

export function NameGenerator() {
  const [nameType, setNameType] = useState<'band' | 'song'>('band');
  const [wordCount, setWordCount] = useState(2);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/generate-names', {
        type: nameType,
        wordCount,
        count: 3
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data.results);
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

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleGenerateMore = () => {
    generateMutation.mutate();
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
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        {/* Type Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg bg-neutral-50 p-1">
            <Button
              variant={nameType === 'band' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setNameType('band')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                nameType === 'band'
                  ? 'bg-google-blue text-white shadow-sm hover:bg-google-blue'
                  : 'text-neutral-600 hover:text-google-blue'
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
                  ? 'bg-google-blue text-white shadow-sm hover:bg-google-blue'
                  : 'text-neutral-600 hover:text-google-blue'
              }`}
            >
              <Music className="w-4 h-4 mr-2" />
              Song Name
            </Button>
          </div>
        </div>

        {/* Word Count Selector */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <label htmlFor="wordCount" className="text-sm font-medium text-neutral-600">
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

        {/* Generate Button */}
        <div className="text-center">
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="inline-flex items-center px-8 py-3 bg-google-blue hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Names
          </Button>
        </div>
      </div>

      {/* Loading States */}
      {generateMutation.isPending && (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
          <LoadingAnimation 
            stage={generateMutation.isPending ? 'generating' : 'verifying'}
          />
        </div>
      )}

      {/* Results */}
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
              className="inline-flex items-center px-6 py-2 bg-white border border-neutral-200 text-neutral-600 hover:text-google-blue hover:border-google-blue font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate More Names
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !generateMutation.isPending && (
        <div className="text-center py-12">
          <div className="text-neutral-600 mb-4">
            <Music className="w-16 h-16 text-neutral-200 mx-auto" />
          </div>
          <p className="text-lg text-neutral-600 mb-2">Ready to generate unique names</p>
          <p className="text-sm text-neutral-600">Click "Generate Names" to start creating</p>
        </div>
      )}
    </div>
  );
}

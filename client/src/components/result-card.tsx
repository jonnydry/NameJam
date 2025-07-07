import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Heart, HeartIcon, RefreshCw, User } from "lucide-react";
import { useStash } from "@/hooks/use-stash";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { BandBio } from "@shared/schema";

interface VerificationResult {
  status: 'available' | 'similar' | 'taken';
  details?: string;
  similarNames?: string[];
  verificationLinks?: Array<{
    name: string;
    url: string;
    source: string;
  }>;
}

interface GenerationResult {
  id: number;
  name: string;
  type: string;
  wordCount: number;
  verification: VerificationResult;
}

interface ResultCardProps {
  result: GenerationResult;
  nameType: 'band' | 'song';
  onCopy: (name: string) => void;
  onRefresh?: (index: number) => void;
  index?: number;
  isRefreshing?: boolean;
  mood?: string;
  genre?: string;
}

export function ResultCard({ result, nameType, onCopy, onRefresh, index, isRefreshing, mood, genre }: ResultCardProps) {
  const { name, verification } = result;
  const { addToStash, isInStash } = useStash();
  const { toast } = useToast();
  const [bio, setBio] = useState<BandBio | null>(null);
  const [isLoadingBio, setIsLoadingBio] = useState(false);
  const [showBio, setShowBio] = useState(false);

  const handleAddToStash = () => {
    if (isInStash(name, nameType)) {
      toast({
        title: "Already in stash",
        description: `"${name}" is already saved in your stash.`,
      });
      return;
    }

    const success = addToStash({
      name,
      type: nameType,
      wordCount: result.wordCount,
      verification
    });

    if (success) {
      toast({
        title: "Added to stash!",
        description: `"${name}" has been saved to your stash.`,
      });
    }
  };

  const handleGenerateBio = async () => {
    if (nameType !== 'band') return;
    
    setIsLoadingBio(true);
    try {
      const response = await apiRequest({
        method: "POST",
        endpoint: "/api/generate-bio",
        body: {
          bandName: name,
          mood,
          genre
        }
      });
      
      setBio(response.bio);
      setShowBio(true);
      toast({
        title: "Bio generated!",
        description: `Created a backstory for "${name}".`,
      });
    } catch (error: any) {
      console.error('Error generating bio:', error);
      if (error.status === 429) {
        toast({
          title: "Bio generation unavailable",
          description: "AI quota exceeded. Please try again later.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate bio. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoadingBio(false);
    }
  };


  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-success-green';
      case 'similar':
        return 'bg-warning-yellow';
      case 'taken':
        return 'bg-error-red';
      default:
        return 'bg-neutral-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'similar':
        return 'Similar Found';
      case 'taken':
        return 'Already Taken';
      default:
        return 'Unknown';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-success-green';
      case 'similar':
        return 'text-warning-yellow';
      case 'taken':
        return 'text-error-red';
      default:
        return 'text-neutral-600';
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 ${getStatusColor(verification.status)} rounded-full`}></div>
          <span className={`text-sm font-medium ${getStatusTextColor(verification.status)}`}>
            {getStatusText(verification.status)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {onRefresh && index !== undefined && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRefresh(index)}
              disabled={isRefreshing}
              className="text-muted-foreground hover:text-primary transition-colors p-2"
              title="Generate new name"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddToStash}
            className={`transition-colors p-2 ${
              isInStash(name, nameType) 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-muted-foreground hover:text-red-500'
            }`}
            title={isInStash(name, nameType) ? 'Already in stash' : 'Add to stash'}
          >
            <Heart className={`w-4 h-4 ${isInStash(name, nameType) ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(name)}
            className="text-muted-foreground hover:text-primary transition-colors p-2"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="text-center">
        <h3 className={`text-2xl font-semibold text-foreground mb-2 ${
          verification.status === 'taken' ? 'line-through' : ''
        }`}>
          {name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {verification.details || `No existing ${nameType} found with this name`}
        </p>
        
        {verification.similarNames && verification.similarNames.length > 0 && (
          <div className="mt-4 bg-muted rounded-lg p-3">
            <h4 className="text-sm font-medium text-foreground mb-2">
              {verification.status === 'taken' ? 'Suggested Alternatives:' : 'Similar Names Found:'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {verification.similarNames.map((similarName, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-background border border-border text-foreground hover:border-primary cursor-pointer transition-colors"
                  onClick={() => onCopy(similarName)}
                >
                  {similarName}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Click any suggestion to copy it</p>
          </div>
        )}

        {/* Verification Links */}
        {verification.verificationLinks && verification.verificationLinks.length > 0 && (
          <div className="mt-4 bg-muted rounded-lg p-3 border border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">
              Verify Availability:
            </h4>
            <div className="flex flex-wrap gap-2">
              {verification.verificationLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-background border border-border text-primary hover:border-primary hover:bg-muted transition-colors"
                >
                  {link.name}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              ))}
            </div>
            <p className="text-xs text-primary mt-2">Click links to search and verify this name's availability</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center space-x-3">
          {/* Copy Button */}
          <Button
            onClick={() => onCopy(name)}
            variant="default"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Copy className="h-4 w-4" />
            <span>Copy</span>
          </Button>

          {/* Heart Button */}
          <Button
            onClick={handleAddToStash}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            {isInStash(name, nameType) ? (
              <HeartIcon className="h-4 w-4 fill-current text-red-500" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            <span>{isInStash(name, nameType) ? 'In Stash' : 'Add to Stash'}</span>
          </Button>

          {/* Bio Button (only for bands) */}
          {nameType === 'band' && (
            <Button
              onClick={handleGenerateBio}
              disabled={isLoadingBio}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <User className={`h-4 w-4 ${isLoadingBio ? 'animate-pulse' : ''}`} />
              <span>{isLoadingBio ? 'Generating...' : 'Generate Bio'}</span>
            </Button>
          )}

          {/* Refresh Button */}
          {onRefresh && index !== undefined && (
            <Button
              onClick={() => onRefresh(index)}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          )}
        </div>

        {/* Bio Display */}
        {showBio && bio && nameType === 'band' && (
          <div className="mt-6 bg-muted rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-foreground">Band Biography</h4>
              <Button
                onClick={() => setShowBio(false)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-foreground">Origin:</span>
                <p className="text-muted-foreground mt-1">{bio.origin}</p>
              </div>
              
              <div>
                <span className="font-medium text-foreground">Genre:</span>
                <span className="text-muted-foreground ml-2">{bio.genre}</span>
              </div>
              
              <div>
                <span className="font-medium text-foreground">Story:</span>
                <p className="text-muted-foreground mt-1">{bio.story}</p>
              </div>
              
              <div>
                <span className="font-medium text-foreground">Members:</span>
                <ul className="text-muted-foreground mt-1 ml-4">
                  {bio.members.map((member, index) => (
                    <li key={index} className="list-disc">{member}</li>
                  ))}
                </ul>
              </div>
              
              {bio.keyAlbum && (
                <div>
                  <span className="font-medium text-foreground">Key Album:</span>
                  <span className="text-muted-foreground ml-2">{bio.keyAlbum}</span>
                </div>
              )}
              
              <div>
                <span className="font-medium text-foreground">Fun Fact:</span>
                <p className="text-muted-foreground mt-1">{bio.funFact}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

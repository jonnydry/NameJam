import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Heart, HeartIcon, BookOpen } from "lucide-react";
import { useStash } from "@/hooks/use-stash";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
}

export function ResultCard({ result, nameType, onCopy }: ResultCardProps) {
  const { name, verification } = result;
  const { addToStash, isInStash } = useStash();
  const { toast } = useToast();
  const [showBioDialog, setShowBioDialog] = useState(false);
  const [bandBio, setBandBio] = useState("");
  const [isLoadingBio, setIsLoadingBio] = useState(false);

  const handleAddToStash = () => {
    if (isInStash(name, nameType)) {
      toast({
        title: "Already in stash",
        description: `"${name}" is already saved in your stash.`,
      });
    } else {
      const success = addToStash({
        name,
        type: nameType,
        verification: verification.status,
        details: verification.details
      });
      
      if (success) {
        toast({
          title: "Added to stash!",
          description: `"${name}" has been saved to your stash.`,
        });
      }
    }
  };

  const handleGenerateBio = async () => {
    if (nameType !== 'band') return;
    
    setIsLoadingBio(true);
    setShowBioDialog(true);
    setBandBio("");
    
    try {
      const response = await fetch("/api/generate-band-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bandName: name })
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate bio");
      }
      
      const data = await response.json();
      setBandBio(data.bio);
    } catch (error) {
      console.error("Error generating bio:", error);
      setBandBio("Sorry, I couldn't generate a bio for this band. Please try again later.");
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

  return (
    <div className="relative p-6 rounded-lg border border-border bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-primary/20 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(verification.status)}`}>
          <div className="w-2 h-2 rounded-full bg-white/80"></div>
          <span>{getStatusText(verification.status)}</span>
        </div>
        <div className="flex items-center space-x-2">
          {nameType === 'band' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateBio}
              className="text-muted-foreground hover:text-foreground"
              title="Generate Band Bio"
            >
              <BookOpen className="h-4 w-4" />
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
          <Button
            onClick={() => onCopy(name)}
            variant="default"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Copy className="h-4 w-4" />
            <span>Copy</span>
          </Button>

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
        </div>
      </div>

      {/* Band Bio Dialog */}
      <Dialog open={showBioDialog} onOpenChange={setShowBioDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{name}</DialogTitle>
            <DialogDescription>Band Biography</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {isLoadingBio ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Generating band bio...</p>
              </div>
            ) : (
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-foreground">{bandBio}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
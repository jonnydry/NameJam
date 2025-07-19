import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Heart, BookOpen, Brain } from "lucide-react";
import { useStash } from "@/hooks/use-stash";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { BandBioModal } from "./band-bio-modal";
import { StatusBadge } from "./status-badge";

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
  isAiGenerated?: boolean;
}

interface ResultCardProps {
  result: GenerationResult;
  nameType: 'band' | 'song';
  onCopy: (name: string) => void;
  genre?: string;
  mood?: string;
}

export function ResultCard({ result, nameType, onCopy, genre, mood }: ResultCardProps) {
  const { name, verification } = result;
  const { toggleStashItem, isInStash } = useStash();
  const { toast } = useToast();
  const [showBioModal, setShowBioModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState<'add' | 'remove'>('add');
  
  // Check if this is the easter egg
  const isEasterEgg = verification.details === 'We love you. Go to bed. <3';

  const handleAddToStash = () => {
    const isCurrentlyInStash = isInStash(name, nameType);
    
    // Set animation type before triggering
    setAnimationType(isCurrentlyInStash ? 'remove' : 'add');
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
    
    const { action, success } = toggleStashItem({
      name,
      type: nameType,
      wordCount: result.wordCount,
      verification: result.verification,
      isAiGenerated: result.isAiGenerated,
      genre: genre,
      mood: mood
    });
    
    if (action === 'added' && success) {
      toast({
        title: "Added to stash!",
        description: `"${name}" has been saved to your stash.`,
      });
    } else if (action === 'removed') {
      toast({
        title: "Removed from stash",
        description: `"${name}" has been removed from your stash.`,
      });
    } else if (action === 'added' && !success) {
      toast({
        title: "Already in stash",
        description: `"${name}" is already saved in your stash.`,
      });
    }
  };





  return (
    <div className={`relative p-4 sm:p-6 rounded-lg border transition-all duration-200 overflow-hidden ${
      isEasterEgg 
        ? 'bg-gradient-to-br from-pink-500/20 via-rose-400/20 to-purple-500/20 border-pink-400/50 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-500/20' 
        : 'border-border bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-primary/20'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <StatusBadge status={verification.status} />
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddToStash}
            className={`p-2 ${
              isInStash(name, nameType) 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-muted-foreground hover:text-red-500'
            }`}
            title={isInStash(name, nameType) ? 'Remove from stash' : 'Add to stash'}
          >
            <span className={`inline-block ${isAnimating ? (animationType === 'add' ? 'heart-burst' : 'heart-shrink') : ''}`}>
              <Heart className={`w-4 h-4 ${isInStash(name, nameType) ? 'fill-current' : ''}`} aria-hidden="true" />
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(name)}
            className="text-muted-foreground hover:text-primary transition-colors p-2"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
          </Button>
          {nameType === 'band' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBioModal(true)}
              className="text-muted-foreground hover:text-primary transition-colors p-2"
              title="Generate band bio"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2 min-w-0">
          <h3 className={`text-xl sm:text-2xl font-semibold text-foreground break-all ${
            verification.status === 'taken' ? 'line-through' : ''
          }`}>
            {name}
          </h3>
          {result.isAiGenerated && (
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 shrink-0" title="AI Generated" />
          )}
        </div>
        <p className={`text-sm ${
          isEasterEgg 
            ? 'text-pink-600 dark:text-pink-300 font-medium text-base' 
            : 'text-muted-foreground'
        }`}>
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

        {/* Compact Verification Links */}
        {verification.verificationLinks && verification.verificationLinks.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground overflow-hidden">
            <span className="opacity-60 shrink-0">Check:</span>
            {verification.verificationLinks.slice(0, 3).map((link, index) => (
              <span key={index} className="inline-flex items-center">
                {index > 0 && <span className="opacity-40 mx-1">·</span>}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors underline-offset-2 hover:underline"
                >
                  {link.name.replace(' Search', '')}
                </a>
              </span>
            ))}
          </div>
        )}


      </div>
      
      {nameType === 'band' && (
        <BandBioModal
          bandName={name}
          genre={genre}
          mood={mood}
          open={showBioModal}
          onOpenChange={setShowBioModal}
        />
      )}
    </div>
  );
}
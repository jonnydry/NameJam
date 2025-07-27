import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Heart, BookOpen, Brain } from "lucide-react";
import { useStash } from "@/hooks/use-stash";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
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
  id: number | null;
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
  const [isHighlighted, setIsHighlighted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Check if this is the easter egg
  const isEasterEgg = verification.details === 'We love you. Go to bed. <3';
  
  // Mobile scroll highlighting using Intersection Observer
  useEffect(() => {
    if (!cardRef.current) return;
    
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setIsHighlighted(true);
          } else {
            setIsHighlighted(false);
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -20% 0px',
        threshold: 0.5
      }
    );
    
    observer.observe(cardRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);

  const handleAddToStash = () => {
    // Check if user is authenticated (guest users have null IDs)
    if (!result.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save names to your stash",
        variant: "destructive",
      });
      return;
    }
    
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
    <div 
      ref={cardRef}
      className={`relative p-responsive rounded-xl border transition-all duration-300 overflow-hidden ${
      isEasterEgg 
        ? 'bg-gradient-to-br from-pink-500/20 via-rose-400/20 to-purple-500/20 border-pink-400/50 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-500/20' 
        : result.isAiGenerated
          ? `bg-gradient-to-br from-purple-500/10 to-purple-400/5 border-purple-500/20 
             hover:from-purple-500/20 hover:to-purple-400/10 hover:shadow-lg hover:shadow-purple-500/10 
             hover:border-purple-400/40 ${isHighlighted ? 'from-purple-500/20 to-purple-400/10 shadow-lg shadow-purple-500/10 border-purple-400/40' : ''}`
          : `bg-gradient-to-br from-blue-500/10 to-blue-400/5 border-blue-500/20 
             hover:from-blue-500/20 hover:to-blue-400/10 hover:shadow-lg hover:shadow-blue-500/10 
             hover:border-blue-400/40 ${isHighlighted ? 'from-blue-500/20 to-blue-400/10 shadow-lg shadow-blue-500/10 border-blue-400/40' : ''}`
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
        <StatusBadge status={verification.status} />
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddToStash}
            className={`p-2 md:p-2 focus:ring-2 focus:ring-offset-2 focus:ring-primary h-10 w-10 md:h-9 md:w-9 ${
              isInStash(name, nameType) 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-muted-foreground hover:text-red-500'
            }`}
            title={isInStash(name, nameType) ? 'Remove from stash' : 'Add to stash'}
            aria-label={isInStash(name, nameType) ? `Remove "${name}" from stash` : `Add "${name}" to stash`}
          >
            <span className={`inline-block ${isAnimating ? (animationType === 'add' ? 'heart-burst' : 'heart-shrink') : ''}`}>
              <Heart className={`w-5 h-5 md:w-4 md:h-4 ${isInStash(name, nameType) ? 'fill-current' : ''}`} aria-hidden="true" />
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(name)}
            className="text-muted-foreground hover:text-primary transition-colors p-2 h-10 w-10 md:h-9 md:w-9"
            title="Copy to clipboard"
          >
            <Copy className="w-5 h-5 md:w-4 md:h-4" aria-hidden="true" />
          </Button>
          {nameType === 'band' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBioModal(true)}
              className="text-muted-foreground hover:text-primary transition-colors p-2 h-10 w-10 md:h-9 md:w-9"
              title="Generate band bio"
            >
              <BookOpen className="w-5 h-5 md:w-4 md:h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1 min-w-0">
          <h3 className={`text-responsive-lg sm:text-responsive-xl font-semibold text-foreground break-words leading-tight ${
            verification.status === 'taken' ? 'line-through' : ''
          }`}>
            {name}
          </h3>
          {result.isAiGenerated && (
            <span title="AI Generated">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 shrink-0" />
            </span>
          )}
        </div>
        <p className={`text-xs sm:text-sm ${
          isEasterEgg 
            ? 'text-pink-600 dark:text-pink-300 font-medium' 
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
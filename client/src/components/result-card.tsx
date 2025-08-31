import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Heart, BookOpen } from "lucide-react";
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
  const [isFocused, setIsFocused] = useState(false);
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

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        onCopy(name);
        break;
      case 's':
      case 'S':
        e.preventDefault();
        handleAddToStash();
        break;
      case 'b':
      case 'B':
        if (nameType === 'band') {
          e.preventDefault();
          setShowBioModal(true);
        }
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault();
        // Navigate to next/previous card
        const cards = document.querySelectorAll('[data-result-card]');
        const currentIndex = Array.from(cards).findIndex(card => card === cardRef.current);
        if (currentIndex !== -1) {
          const nextIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
          const nextCard = cards[nextIndex] as HTMLElement;
          if (nextCard) {
            nextCard.focus();
          }
        }
        break;
    }
  };




  // Create descriptive aria-label for the card
  const cardAriaLabel = `${nameType} name: ${name}. Status: ${verification.status}. ${verification.details || `No existing ${nameType} found with this name`}. Actions available: copy to clipboard, ${isInStash(name, nameType) ? 'remove from' : 'add to'} stash${nameType === 'band' ? ', generate bio' : ''}.`;

  return (
    <article 
      ref={cardRef}
      role="article"
      aria-label={cardAriaLabel}
      tabIndex={0}
      data-result-card
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`relative p-responsive rounded-xl border transition-all duration-300 overflow-hidden result-card-mobile cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background ${
      isEasterEgg 
        ? 'bg-gradient-to-br from-pink-500/20 via-rose-400/20 to-purple-500/20 border-pink-400/50 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-500/20' 
        : `bg-gradient-to-r from-black/90 to-gray-900/90 border-yellow-500/20 
           hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-500/10 
           ${isHighlighted || isFocused ? 'border-yellow-400/40 shadow-lg shadow-yellow-500/10' : ''}`
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
        <StatusBadge status={verification.status} />
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddToStash}
            className={`p-2 md:p-2 focus:ring-2 focus:ring-offset-2 focus:ring-primary h-10 w-10 md:h-9 md:w-9 result-card-button-mobile ${
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
            className="text-muted-foreground hover:text-primary transition-colors p-2 h-10 w-10 md:h-9 md:w-9 result-card-button-mobile"
            title="Copy to clipboard"
            aria-label={`Copy "${name}" to clipboard`}
          >
            <Copy className="w-5 h-5 md:w-4 md:h-4" aria-hidden="true" />
          </Button>
          {nameType === 'band' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBioModal(true)}
              className="text-muted-foreground hover:text-primary transition-colors p-2 h-10 w-10 md:h-9 md:w-9 result-card-button-mobile"
              title="Generate band bio"
              aria-label={`Generate biography for ${nameType} "${name}"`}
            >
              <BookOpen className="w-5 h-5 md:w-4 md:h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1 min-w-0">
          <h3 className={`text-responsive-lg sm:text-responsive-xl font-semibold text-foreground break-words leading-tight result-name-mobile ${
            verification.status === 'taken' ? 'line-through' : ''
          }`}>
            {name}
          </h3>
        </div>
        <p className={`text-xs sm:text-sm ${
          isEasterEgg 
            ? 'text-pink-600 dark:text-pink-300 font-medium' 
            : 'text-muted-foreground'
        }`}>
          {verification.details || `No existing ${nameType} found with this name`}
        </p>
        
        {verification.similarNames && verification.similarNames.length > 0 && (
          <div className="mt-4 bg-muted rounded-lg p-3" role="region" aria-labelledby={`similar-names-${result.id || Date.now()}`}>
            <h4 id={`similar-names-${result.id || Date.now()}`} className="text-sm font-medium text-foreground mb-2">
              {verification.status === 'taken' ? 'Suggested Alternatives:' : 'Similar Names Found:'}
            </h4>
            <div className="flex flex-wrap gap-2" role="list" aria-label={`${verification.similarNames.length} ${verification.status === 'taken' ? 'alternative' : 'similar'} ${nameType} names`}>
              {verification.similarNames.map((similarName, index) => (
                <button
                  key={index}
                  role="listitem"
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-background border border-border text-foreground hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-colors"
                  onClick={() => onCopy(similarName)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onCopy(similarName);
                    }
                  }}
                  aria-label={`Copy suggested ${nameType} name "${similarName}" to clipboard`}
                  title={`Copy "${similarName}" to clipboard`}
                >
                  {similarName}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2" role="note">Press Enter or Space on any suggestion to copy it</p>
          </div>
        )}

        {/* Compact Verification Links */}
        {verification.verificationLinks && verification.verificationLinks.length > 0 && (
          <nav className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground overflow-hidden" role="navigation" aria-label={`External verification links for ${nameType} name ${name}`}>
            <span className="opacity-60 shrink-0">Check:</span>
            {verification.verificationLinks.slice(0, 3).map((link, index) => (
              <span key={index} className="inline-flex items-center">
                {index > 0 && <span className="opacity-40 mx-1" aria-hidden="true">·</span>}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors underline-offset-2 hover:underline focus:text-primary focus:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
                  aria-label={`Check availability of "${name}" on ${link.source}. Opens in new tab.`}
                >
                  {link.name.replace(' Search', '')}
                </a>
              </span>
            ))}
          </nav>
        )}


      </div>
      
      {/* Keyboard shortcuts hint - only visible when focused */}
      {isFocused && (
        <div className="mt-3 pt-3 border-t border-border/50" role="note" aria-live="polite">
          <p className="text-xs text-muted-foreground text-center">
            Keyboard: <kbd className="text-xs bg-muted px-1 py-0.5 rounded">Enter</kbd> to copy, <kbd className="text-xs bg-muted px-1 py-0.5 rounded">S</kbd> to stash
            {nameType === 'band' && (
              <>, <kbd className="text-xs bg-muted px-1 py-0.5 rounded">B</kbd> for bio</>
            )}
            , <kbd className="text-xs bg-muted px-1 py-0.5 rounded">↑↓</kbd> to navigate
          </p>
        </div>
      )}
      
      {nameType === 'band' && (
        <BandBioModal
          bandName={name}
          genre={genre}
          mood={mood}
          open={showBioModal}
          onOpenChange={setShowBioModal}
        />
      )}
    </article>
  );
}
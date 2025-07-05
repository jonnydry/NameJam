import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Heart, HeartIcon, Instagram, Twitter, Music, Video, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useStash } from "@/hooks/use-stash";
import { useToast } from "@/hooks/use-toast";

interface VerificationResult {
  status: 'available' | 'similar' | 'taken';
  details?: string;
  similarNames?: string[];
  verificationLinks?: Array<{
    name: string;
    url: string;
    source: string;
  }>;
  socialMedia?: Array<{
    platform: string;
    handle: string;
    status: 'available' | 'taken' | 'unknown';
    url?: string;
    profileExists?: boolean;
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

        {/* Social Media Availability */}
        {verification.socialMedia && verification.socialMedia.length > 0 && (
          <div className="mt-4 bg-muted rounded-lg p-3 border border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">
              Social Media Handle Availability:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {verification.socialMedia.map((social: any, index: number) => {
                const getPlatformIcon = (platform: string) => {
                  switch (platform.toLowerCase()) {
                    case 'instagram': return <Instagram className="w-4 h-4" />;
                    case 'twitter/x': return <Twitter className="w-4 h-4" />;
                    case 'tiktok': return <Video className="w-4 h-4" />;
                    case 'youtube': return <Video className="w-4 h-4" />;
                    case 'facebook': return <Users className="w-4 h-4" />;
                    case 'spotify': return <Music className="w-4 h-4" />;
                    default: return <Users className="w-4 h-4" />;
                  }
                };

                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case 'available': return <CheckCircle className="w-4 h-4 text-green-500" />;
                    case 'taken': return <XCircle className="w-4 h-4 text-red-500" />;
                    case 'unknown': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
                    default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
                  }
                };

                const getStatusText = (status: string) => {
                  switch (status) {
                    case 'available': return 'Available';
                    case 'taken': return 'Taken';
                    case 'unknown': return 'Check';
                    default: return 'Unknown';
                  }
                };

                return (
                  <div key={index} className="flex items-center justify-between bg-background rounded p-2 border border-border">
                    <div className="flex items-center space-x-2">
                      {getPlatformIcon(social.platform)}
                      <span className="text-xs font-medium">{social.platform}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(social.status)}
                      <span className={`text-xs font-medium ${
                        social.status === 'available' ? 'text-green-600 dark:text-green-400' :
                        social.status === 'taken' ? 'text-red-600 dark:text-red-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {getStatusText(social.status)}
                      </span>
                      {social.url && (
                        <a
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Handle: "@{verification.socialMedia[0]?.handle}" • Click external links to verify manually
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

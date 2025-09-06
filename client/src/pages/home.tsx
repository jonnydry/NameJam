import { NameGenerator } from "@/components/name-generator";
import { LyricJam } from "@/components/lyric-jam";
import { ModernLogo } from "@/components/modern-logo";
import { StashSidebarEnhanced as StashSidebar } from "@/components/stash-sidebar-enhanced";
import { UserMenu } from "@/components/user-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Archive } from "lucide-react";
import { cn } from "@/lib/utils";

// Import the result interface
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

export default function Home() {
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [isStashOpen, setIsStashOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  // Shared state for name generation results to persist across tab switches
  const [bandResults, setBandResults] = useState<GenerationResult[]>([]);
  const [songResults, setSongResults] = useState<GenerationResult[]>([]);

  // No longer redirect automatically - mixed approach allows guest usage

  const handleCopy = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      setCopiedName(name);
      setTimeout(() => setCopiedName(null), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ModernLogo size="xl" variant="icon-only" />
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Stash Sidebar */}
      <StashSidebar isOpen={isStashOpen} onToggle={() => setIsStashOpen(!isStashOpen)} />
      
      {/* Fixed Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="px-2 sm:px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Enhanced Stash Button */}
            <Button
              id="stash-toggle-btn"
              variant={isStashOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setIsStashOpen(!isStashOpen)}
              className={cn(
                "flex items-center gap-2 h-10 px-3 sm:px-4 md:h-9 transition-all duration-200",
                "hover:scale-105 hover:shadow-lg",
                isStashOpen && "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              )}
            >
              <Archive className={cn(
                "h-5 w-5 md:h-4 md:w-4 transition-transform duration-200",
                isStashOpen && "rotate-12"
              )} />
              <span className="hidden sm:inline font-medium">
                {isStashOpen ? "Close Stash" : "My Stash"}
              </span>
            </Button>
            
            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className={cn(
        "flex-1 px-4 py-8 md:py-12 transition-all duration-300 mt-14",
        isStashOpen && "md:ml-96"
      )}>
        <div className="max-w-xl md:max-w-2xl mx-auto">
          {/* Logo and Title Section */}
          <div className="text-center mb-6 md:mb-8">
            <div className="flex flex-col items-center">
              {/* Logo */}
              <div className="mb-3 md:mb-4">
                <ModernLogo size="xl" variant="full" />
              </div>
              {/* Title with special alignment */}
              <div className="relative">
                <h1 className="text-responsive-3xl md:text-responsive-4xl font-bold mb-2 uppercase tracking-wide font-mono flex items-center justify-center relative">
                  <span className="title-text title-align">&gt;Name_Jam</span>
                </h1>
              </div>
            </div>
            <p className="text-responsive-xs text-muted-foreground subtitle-fade px-2 font-normal">Generate unique band names, song titles, and lyrical inspiration</p>
          </div>

          {/* Tabs Section */}
          <div className="w-full">
            <Tabs defaultValue="names" className="w-full">
                <TabsList className="grid w-full grid-cols-2 tabs-list-enhanced mb-4 md:mb-6">
                  <TabsTrigger value="names" className="tabs-trigger-enhanced">
                    <span className="hidden sm:inline">NAME_JAM</span>
                    <span className="sm:hidden">Name_Jam</span>
                  </TabsTrigger>
                  <TabsTrigger value="lyric" className="tabs-trigger-enhanced">
                    <span className="hidden sm:inline">LYRIC_JAM</span>
                    <span className="sm:hidden">Lyric_Jam</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="names">
                  <NameGenerator 
                    bandResults={bandResults}
                    setBandResults={setBandResults}
                    songResults={songResults}
                    setSongResults={setSongResults}
                  />
                </TabsContent>
                <TabsContent value="lyric">
                  <LyricJam />
                </TabsContent>
              </Tabs>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-responsive-sm text-muted-foreground">© 2025 NameJam. Powered by web-sourced creativity.</p>
            <div className="flex justify-center space-x-6">
              <Link href="/about" className="text-responsive-xs text-muted-foreground hover:text-primary transition-colors">About</Link>
              <a href="#" className="text-responsive-xs text-muted-foreground hover:text-primary transition-colors">Contact</a>
              <a href="#" className="text-responsive-xs text-muted-foreground hover:text-primary transition-colors">API Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { FermataLogo } from "@/components/fermata-logo";
import { Link } from "wouter";
import { LogIn } from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Logo and Title Section */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center">
              {/* Logo */}
              <div className="mb-4">
                <FermataLogo size="xl" />
              </div>
              {/* Title with special alignment */}
              <div className="relative">
                <h1 className="text-responsive-3xl md:text-responsive-4xl font-bold mb-2 uppercase tracking-wide font-mono flex items-center justify-center">
                  <span className="typing-prompt absolute" style={{ left: 'calc(50% - 6ch)' }}>&gt;</span>
                  <span className="title-text title-align">Name_Jam</span>
                </h1>
              </div>
            </div>
            <p className="text-responsive-base md:text-responsive-lg text-muted-foreground font-medium subtitle-fade px-2 mb-8">
              Generate unique band names, song titles, set lists, and lyrics
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="text-center p-6 rounded-lg border border-border bg-card/50">
              <h3 className="font-semibold mb-2">Band & Song Names</h3>
              <p className="text-sm text-muted-foreground">Generate creative names with 3,000+ words across 32 domains</p>
            </div>
            <div className="text-center p-6 rounded-lg border border-border bg-card/50">
              <h3 className="font-semibold mb-2">Set Lists</h3>
              <p className="text-sm text-muted-foreground">Create organized performance lists with verification</p>
            </div>
            <div className="text-center p-6 rounded-lg border border-border bg-card/50">
              <h3 className="font-semibold mb-2">Lyric Sparks</h3>
              <p className="text-sm text-muted-foreground">Generate inspiring lyrical lines for songwriting</p>
            </div>
            <div className="text-center p-6 rounded-lg border border-border bg-card/50">
              <h3 className="font-semibold mb-2">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">Enhanced creativity with Grok AI integration</p>
            </div>
            <div className="text-center p-6 rounded-lg border border-border bg-card/50">
              <h3 className="font-semibold mb-2">Stash & Rate</h3>
              <p className="text-sm text-muted-foreground">Save favorites with 5-star ratings and export options</p>
            </div>
            <div className="text-center p-6 rounded-lg border border-border bg-card/50">
              <h3 className="font-semibold mb-2">Spotify Verified</h3>
              <p className="text-sm text-muted-foreground">Real-time availability checking with music databases</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Button 
              size="lg" 
              className="font-semibold px-8 py-4 text-lg mb-4"
              onClick={() => window.location.href = "/api/login"}
            >
              <LogIn className="mr-2 h-5 w-5" />
              Sign In to Start Creating
            </Button>
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Choose your preferred sign-in method:</p>
              <div className="flex flex-wrap justify-center items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">Google</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 rounded">GitHub</span>
                <span className="px-2 py-1 bg-black dark:bg-white/10 text-white dark:text-white rounded">X (Twitter)</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 rounded">Apple</span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Email</span>
              </div>
              <p className="text-xs">All sign-in options are handled securely by Replit</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-primary transition-colors">
              About
            </Link>
            <span className="hidden sm:inline">•</span>
            <span>© 2025 Name_Jam</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
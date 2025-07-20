import { Button } from "@/components/ui/button";
import { FermataLogo } from "@/components/fermata-logo";
import { Link } from "wouter";
import { LogIn } from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-8 md:p-12">
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Link href="/app">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="font-semibold px-8 py-4 text-lg w-full sm:w-auto"
                >
                  Proceed as Guest Artist
                </Button>
              </Link>
              <Button 
                size="lg" 
                className="font-semibold px-8 py-4 text-lg"
                onClick={() => window.location.href = "/api/login"}
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Sign in to save your favorites, access AI features, and create personalized stashes
            </p>
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
import { Button } from "@/components/ui/button";
import { FermataLogo } from "@/components/fermata-logo";
import { Link } from "wouter";
import { LogIn, Zap, ListMusic, NotebookPen, Brain, Archive, Music } from "lucide-react";

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
                <h1 className="text-responsive-3xl md:text-responsive-4xl font-bold mb-2 uppercase tracking-wide font-mono flex items-center justify-center relative">
                  <span className="title-text title-align">&gt;Name_Jam</span>
                </h1>
              </div>
            </div>
            <p className="text-responsive-xs md:text-responsive-sm text-muted-foreground font-medium subtitle-fade px-2 mb-8">
              Generate unique band names, song titles, set lists, and lyrical inspiration
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-3xl mx-auto">
            <div className="text-left p-8 rounded-xl border border-border/50 bg-gradient-to-br from-card/40 to-card/20 backdrop-blur-sm hover:from-card/60 hover:to-card/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 font-mono text-foreground">Datamuse-Powered Names</h3>
                  <p className="text-base text-muted-foreground/90 leading-relaxed">Revolutionary linguistic engine with 300,000+ authentic word relationships</p>
                </div>
              </div>
            </div>
            <div className="text-left p-8 rounded-xl border border-border/50 bg-gradient-to-br from-card/40 to-card/20 backdrop-blur-sm hover:from-card/60 hover:to-card/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
                  <ListMusic className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 font-mono text-foreground">Professional Set Lists</h3>
                  <p className="text-base text-muted-foreground/90 leading-relaxed">Organized performance lists with Spotify verification and AI band names</p>
                </div>
              </div>
            </div>
            <div className="text-left p-8 rounded-xl border border-border/50 bg-gradient-to-br from-card/40 to-card/20 backdrop-blur-sm hover:from-card/60 hover:to-card/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
                  <NotebookPen className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 font-mono text-foreground">Enhanced Lyrics</h3>
                  <p className="text-base text-muted-foreground/90 leading-relaxed">Genre-specific lyrical starters enriched with contextual vocabulary</p>
                </div>
              </div>
            </div>
            <div className="text-left p-8 rounded-xl border border-border/50 bg-gradient-to-br from-card/40 to-card/20 backdrop-blur-sm hover:from-card/60 hover:to-card/40 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-500">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 font-mono text-foreground">Hybrid AI System</h3>
                  <p className="text-base text-muted-foreground/90 leading-relaxed">50/50 XAI Grok + Datamuse split with anti-repetition technology</p>
                </div>
              </div>
            </div>
            <div className="text-left p-8 rounded-xl border border-border/50 bg-gradient-to-br from-card/40 to-card/20 backdrop-blur-sm hover:from-card/60 hover:to-card/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500">
                  <Archive className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 font-mono text-foreground">Advanced Stash</h3>
                  <p className="text-base text-muted-foreground/90 leading-relaxed">Save names, lyrics, bios, and setlists with 5-star ratings</p>
                </div>
              </div>
            </div>
            <div className="text-left p-8 rounded-xl border border-border/50 bg-gradient-to-br from-card/40 to-card/20 backdrop-blur-sm hover:from-card/60 hover:to-card/40 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-red-500/10 text-red-500">
                  <Music className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 font-mono text-foreground">Spotify Priority</h3>
                  <p className="text-base text-muted-foreground/90 leading-relaxed">Real-time availability with popularity scores and direct search links</p>
                </div>
              </div>
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
              Sign in for AI band biographies, enhanced stash features, and personalized creative tools
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
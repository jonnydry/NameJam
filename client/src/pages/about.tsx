import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FermataLogo } from "@/components/fermata-logo";

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with back link */}
      <header className="bg-card border-b border-border py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Name_Jam
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Logo and Title Section */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <FermataLogo size="lg" />
              </div>
              <h1 className="text-3xl font-bold mb-2 uppercase tracking-wide font-mono">About Name_Jam</h1>
            </div>
          </div>

          {/* Content Card */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">About This Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-muted-foreground">
                <p>I made this app because I thought my musician friends and I would have had fun with it in the practice room and when hanging around discussing ideas.</p>
                <br />
                <p>Use NAME_JAM to find inspiration, generate a quick list to name your practice session segments, name your next big or small project or just jam around to brainstorm ideas and spark your next project!</p>
              </div>
              
              {/* Placeholder sections */}
              <div className="grid gap-6 mt-8">
                <div className="p-4 border border-solid border-muted-foreground/20 rounded-lg bg-card/50">
                  <h3 className="font-medium mb-2">Project Overview</h3>
                  <div className="text-sm text-muted-foreground">
                    <p><strong>NAME_JAM</strong> : Name your next musical project.</p>
                    <br />
                    <p>Jam with words to kickstart your imagination.</p>
                  </div>
                </div>
                
                <div className="p-4 border border-solid border-muted-foreground/20 rounded-lg bg-card/50">
                  <h3 className="font-medium mb-3">Key Features</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• <strong>Advanced Name Generation:</strong> Create unique band and song names using 2,300+ carefully curated words across 32 specialized categories</li>
                    <li>• <strong>AI-Powered Creativity:</strong> Optional XAI Grok integration for enhanced creative name generation with intelligent fallback</li>
                    <li>• <strong>Smart Customization:</strong> Choose from 1-6 word combinations, 12 mood themes, and 14 musical genres</li>
                    <li>• <strong>Real-Time Verification:</strong> Instant availability checking using Spotify Web API, Last.fm, and MusicBrainz databases</li>
                    <li>• <strong>Set List Generator:</strong> Create professional performance sets (8 or 16 songs) with automatic song verification</li>
                    <li>• <strong>Stash System:</strong> Save favorite names with local storage persistence and export capabilities</li>
                    <li>• <strong>Linguistic Intelligence:</strong> Advanced grammatical patterns, smart capitalization, and poetic flow optimization</li>
                    <li>• <strong>Export Options:</strong> Export stash as text files, JSON, or print-friendly formats</li>
                    <li>• <strong>Responsive Design:</strong> Fully responsive interface with dark theme and modern typography</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-solid border-muted-foreground/20 rounded-lg bg-card/50">
                  <h3 className="font-medium mb-3">Technology Stack</h3>
                  <div className="text-sm text-muted-foreground space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Frontend</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• React 18 with TypeScript for type-safe development</li>
                        <li>• Tailwind CSS with shadcn/ui components for modern design</li>
                        <li>• Wouter for lightweight client-side routing</li>
                        <li>• TanStack React Query for server state management</li>
                        <li>• Vite for fast development and optimized builds</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Backend</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• Node.js with Express.js and TypeScript</li>
                        <li>• PostgreSQL database with Drizzle ORM</li>
                        <li>• Neon Database for serverless PostgreSQL hosting</li>
                        <li>• Session management with connect-pg-simple</li>
                        <li>• RESTful API architecture</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">External APIs</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• Spotify Web API for music database verification</li>
                        <li>• XAI Grok models for AI-powered name generation</li>
                        <li>• Last.fm and MusicBrainz for comprehensive music data</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-solid border-muted-foreground/20 rounded-lg bg-card/50">
                  <h3 className="font-medium mb-2">Credits & Acknowledgments</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Replit</li>
                    <li>• xAI</li>
                    <li>• Anthropic</li>
                    <li>• Spotify</li>
                    <li>• Last.fm</li>
                    <li>• and my incredibly intelligent cat, Marci ♥</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-card border-t border-border py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">© 2024 Name_Jam. Powered by web-sourced creativity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
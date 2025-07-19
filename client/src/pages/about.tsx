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
                <p>Use NAME_JAM to find inspiration, generate performance set lists, create lyrical sparks, or just jam around to brainstorm ideas and spark your next project!</p>
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
                    <li>• <strong>Massive Vocabulary Engine:</strong> Generate names using 3,069+ words across 32 specialized domains including science fiction, fantasy, culinary, architecture, psychology, physics, chemistry, biology, and sensory terms</li>
                    <li>• <strong>AI-Powered Creativity:</strong> XAI Grok 3/4 integration for enhanced creative generation with advanced anti-repetition system and model attribution</li>
                    <li>• <strong>Advanced Customization:</strong> Choose 1-6 word combinations, 12 mood themes, 14 musical genres with focused contextual filtering</li>
                    <li>• <strong>Spotify-Priority Verification:</strong> Real-time availability checking with Spotify Web API as primary source, plus Last.fm, MusicBrainz, and famous names database</li>
                    <li>• <strong>Professional Set Lists:</strong> Generate organized performance sets (8/16 songs) with automatic verification and AI-powered band name suggestions</li>
                    <li>• <strong>Lyric_Jam Feature:</strong> Generate creative lyrical lines for songwriting inspiration with genre awareness and song structure integration (verse/chorus/bridge/pre-chorus/outro)</li>
                    <li>• <strong>Enhanced Stash System:</strong> Save names, setlists, lyrics, and band bios with 5-star ratings, category sorting, and comprehensive export options (text/JSON/print)</li>
                    <li>• <strong>Linguistic Intelligence:</strong> Advanced grammatical consistency, poetic flow optimization, smart capitalization, and duplicate word prevention</li>
                    <li>• <strong>AI Band Bio Generator:</strong> Create hilarious, edgy R-rated band biographies with sophisticated humor and anti-formulaic storytelling</li>
                    <li>• <strong>Easter Egg System:</strong> Special responses for app testing with famous artist trolling and "Name Jam" detection</li>
                    <li>• <strong>Mobile Optimization:</strong> Responsive text scaling with CSS clamp() function, mobile-friendly dropdown interactions, and dynamic padding</li>
                    <li>• <strong>Anti-Repetition Technology:</strong> Advanced word tracking system prevents consecutive repeated words in AI generation</li>
                    <li>• <strong>Modern Typography:</strong> Futuristic monospace design with JetBrains Mono font, typing animations, rainbow hover effects, and uppercase tab branding</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-solid border-muted-foreground/20 rounded-lg bg-card/50">
                  <h3 className="font-medium mb-3">Technology Stack</h3>
                  <div className="text-sm text-muted-foreground space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Frontend</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• React 18 with TypeScript for complete type safety</li>
                        <li>• Tailwind CSS with shadcn/ui components and JetBrains Mono typography</li>
                        <li>• Wouter for lightweight client-side routing</li>
                        <li>• TanStack React Query v5 for advanced server state management</li>
                        <li>• Vite with optimized build process and hot reload</li>
                        <li>• Framer Motion for smooth animations and transitions</li>
                        <li>• React Context for global stash state management</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Backend</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• Node.js 20 with Express.js and ES modules</li>
                        <li>• PostgreSQL with Drizzle ORM for type-safe database operations</li>
                        <li>• Neon Database serverless PostgreSQL with edge compatibility</li>
                        <li>• Advanced session management with PostgreSQL storage</li>
                        <li>• Comprehensive error handling and graceful API degradation</li>
                        <li>• TSX for TypeScript execution and development</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">AI & Verification APIs</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• XAI Grok 3, Grok 4, and Grok 3-mini for creative AI generation with anti-repetition filtering</li>
                        <li>• Spotify Web API (priority) for authoritative music verification with popularity scoring</li>
                        <li>• Last.fm API for additional music database coverage and artist data</li>
                        <li>• MusicBrainz API for comprehensive artist and track metadata</li>
                        <li>• Famous Names Database with 60+ well-known artists for easter egg responses</li>
                        <li>• Intelligent fallback system with 3-attempt retry mechanisms per model</li>
                        <li>• Advanced word tracking to prevent consecutive repetition in AI results</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Core Features</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• 874+ adjectives, 1,262+ nouns, 517+ verbs, 418+ musical terms across 32 domains</li>
                        <li>• Advanced linguistic patterns with grammatical consistency and poetic flow evaluation</li>
                        <li>• Real-time name verification with Spotify-priority checking and popularity scoring</li>
                        <li>• Enhanced stash system with 5-star ratings, category filtering, and export options for names, setlists, lyrics, and band bios</li>
                        <li>• AI band bio generation with edgy R-rated humor and anti-formulaic prompts</li>
                        <li>• Lyric generation for songwriting inspiration with genre awareness and song structure context</li>
                        <li>• Anti-repetition technology tracking 30 recent words to prevent duplicates</li>
                        <li>• Local storage persistence with comprehensive export capabilities</li>
                        <li>• Responsive design with dark theme optimization, monospace typography, and mobile text scaling</li>
                        <li>• Fixed dropdown animations and improved mobile interactions</li>
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
                    <li>• my incredibly intelligent cat, Marci ♥</li>
                    <li>• My beautiful and wonderful girlfriend Sam, who knows me better than anyone ever will ❤</li>
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
            <p className="text-sm text-muted-foreground">© 2025 Name_Jam. Powered by web-sourced creativity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
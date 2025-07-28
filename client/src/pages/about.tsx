import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FermataLogo } from "@/components/fermata-logo";

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-8 md:p-12">
          {/* Back link moved inside gradient container */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Name_Jam
            </Link>
          </div>
          {/* Logo and Title Section */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <FermataLogo size="xl" />
              </div>
              <h1 className="text-responsive-3xl md:text-responsive-4xl font-bold mb-2 uppercase tracking-wide font-mono title-gradient">&gt;ABOUT_NAME_JAM</h1>
            </div>
          </div>

          {/* Content Card */}
          <Card className="w-full bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">About This Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-muted-foreground">
                <p>I made this app imagining having fun with my friends. Jamming in the basements, writing poems or lyrics. There is a special energy in considering possibilities. Hold your creative spark close and turn it into something uniquely yours. Name_Jam is designed to be a novelty that helps you free associate your idea. Name your Jam! Name your art, Be yourself.</p>
                <br />
                <p>Use NAME_JAM to find inspiration, create lyrical sparks, or just jam around to brainstorm ideas and spark your next project!</p>
              </div>
              
              {/* Placeholder sections */}
              <div className="grid gap-6 mt-8">
                <div className="p-4 border border-solid border-border/30 rounded-lg bg-card/60 backdrop-blur-sm">
                  <h3 className="font-medium mb-2">Project Overview</h3>
                  <div className="text-sm text-muted-foreground">
                    <p><strong>NAME_JAM</strong> : Name your next musical project.</p>
                    <br />
                    <p>Jam with words to kickstart your imagination.</p>
                  </div>
                </div>
                
                <div className="p-4 border border-solid border-border/30 rounded-lg bg-card/60 backdrop-blur-sm">
                  <h3 className="font-medium mb-3">Key Features</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• <strong>Datamuse-Powered Generation:</strong> Revolutionary replacement of static vocabulary with Datamuse API providing authentic linguistic relationships from 300,000+ word database for contextual word pairing</li>
                    <li>• <strong>Hybrid AI Integration:</strong> XAI Grok 3/4 models with custom JSON prompts for 50% AI + 50% Datamuse generation split, complete with anti-repetition filtering and model attribution</li>
                    <li>• <strong>Advanced Customization:</strong> Choose 1-6 word combinations, 12 mood themes, 14 musical genres with precise linguistic filtering and contextual word selection</li>
                    <li>• <strong>Spotify-Priority Verification:</strong> Real-time availability checking with Spotify Web API as primary source, enhanced with popularity scores, genres, and direct search links</li>
                    <li>• <strong>Enhanced Lyric Generation:</strong> Datamuse-enriched lyrical starters using genre-specific vocabulary, emotional words, rhymes, and sensory terms for authentic results</li>
                    <li>• <strong>Advanced Stash System:</strong> Save names, lyrics, and band bios with 5-star ratings, category filtering, and comprehensive export options (text/JSON/print)</li>
                    <li>• <strong>Pure Linguistic Intelligence:</strong> Datamuse API eliminates static vocabulary for authentic language patterns with grammatical consistency and natural flow</li>
                    <li>• <strong>AI Band Bio Generator:</strong> Create hilarious, edgy R-rated band biographies with sophisticated humor and anti-formulaic storytelling using production logger system</li>
                    <li>• <strong>Performance Optimization:</strong> Major codebase cleanup removing 49 packages (~36MB), unified caching system, custom date utilities, and production-ready logging</li>
                    <li>• <strong>Dynamic Loading System:</strong> Real-time progress tracking with intelligent estimation curves that match actual API response times</li>
                    <li>• <strong>Anti-Repetition Technology:</strong> Cross-generation word tracking preventing repeated words across multiple generations with 100-word memory system</li>
                    <li>• <strong>Modern Typography:</strong> Optimized monospace design with JetBrains Mono font, typing animations, and responsive text scaling using CSS clamp() functions</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-solid border-border/30 rounded-lg bg-card/60 backdrop-blur-sm">
                  <h3 className="font-medium mb-3">Technology Stack</h3>
                  <div className="text-sm text-muted-foreground space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Frontend</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• React 18 with TypeScript for complete type safety and modern development</li>
                        <li>• Tailwind CSS with shadcn/ui components, optimized CSS clamp() responsive scaling</li>
                        <li>• JetBrains Mono typography with custom formatting utilities</li>
                        <li>• Wouter for lightweight client-side routing</li>
                        <li>• TanStack React Query v5 with intelligent caching and error handling</li>
                        <li>• Vite with optimized build process, hot reload, and Service Worker caching</li>
                        <li>• React Context for global stash state with local storage persistence</li>
                        <li>• Custom hooks for clipboard operations, loading progress, and debounced callbacks</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Backend</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• Node.js 20 with Express.js, ES modules, and production-optimized logging</li>
                        <li>• PostgreSQL with Drizzle ORM for type-safe database operations and migrations</li>
                        <li>• Neon Database serverless PostgreSQL with edge compatibility and WebSocket support</li>
                        <li>• Unified performance caching system with NodeCache for intelligent data storage</li>
                        <li>• Comprehensive security with rate limiting, CORS, Helmet headers, and input sanitization</li>
                        <li>• TSX for TypeScript execution, parallel verification services, and timeout handling</li>
                        <li>• Authentication system with mixed approach supporting guest users and signed-in features</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">AI & External APIs</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• XAI Grok 3, Grok 4, and Grok 3-mini with custom JSON prompts and intelligent parameter configuration</li>
                        <li>• Datamuse API integration for authentic linguistic relationships and contextual word pairing (300,000+ words)</li>
                        <li>• Spotify Web API (priority) for authoritative music verification with popularity scores and genre data</li>
                        <li>• Last.fm API and MusicBrainz API for comprehensive music database coverage</li>
                        <li>• Famous Names Database with 60+ well-known artists for easter easter egg trolling</li>
                        <li>• Advanced rate limiting with intelligent retry mechanisms and graceful degradation</li>
                        <li>• Cross-generation anti-repetition system tracking 100+ recent words for unique results</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Core Architecture</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• Revolutionary Datamuse API integration replacing all static vocabulary with authentic linguistic data</li>
                        <li>• Advanced grammatical consistency engine with singular/plural agreement and natural flow optimization</li>
                        <li>• Real-time name verification with Spotify-priority checking, popularity scoring, and direct search links</li>
                        <li>• Comprehensive stash system supporting names, lyrics, and band bios with 5-star ratings</li>
                        <li>• Enhanced lyric generation using Datamuse context for genre-specific vocabulary and rhyme patterns</li>
                        <li>• Production-ready codebase with major cleanup removing 49 packages and 36MB bundle reduction</li>
                        <li>• Unified caching system with NodeCache replacing duplicate verification systems</li>
                        <li>• Custom lightweight utilities replacing heavy libraries (date-fns → 1KB custom formatter)</li>
                        <li>• Dynamic loading progress system with real-time API response tracking</li>
                        <li>• Complete TypeScript error resolution and production logging optimization</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-solid border-border/30 rounded-lg bg-card/60 backdrop-blur-sm">
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
      <footer className="py-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">© 2025 Name_Jam. Powered by web-sourced creativity.</p>
        </div>
      </footer>
    </div>
  );
}
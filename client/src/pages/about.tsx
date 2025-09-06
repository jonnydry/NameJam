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
                <p>I made this app imagining having fun with my friends. Jamming in basements, writing poems or lyrics, discussing fun ideas: There is a special energy in considering possibilities. Hold your creative spark close and turn it into something uniquely yours. Name_Jam is designed to be a novelty that helps you free associate ideas and images. Name your Jam! Name your art! Be yourself!</p>
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
                    <li>• <strong>AI-Powered Name Generation:</strong> XAI Grok-3 model generates creative band and song names with humor, wordplay, and genre-specific context</li>
                    <li>• <strong>Real-Time Music Verification:</strong> Spotify integration checks name availability and provides popularity scores with direct search links</li>
                    <li>• <strong>Multi-API Context System:</strong> Combines Spotify, Last.fm, Datamuse, ConceptNet, and PoetryDB for rich, genre-authentic vocabulary</li>
                    <li>• <strong>Lyric Generation:</strong> AI-powered lyrical starters with genre-specific vocabulary, poetic themes, and variable length options</li>
                    <li>• <strong>Band Biography Generator:</strong> Creates entertaining band backstories with humor and genre-appropriate narratives</li>
                    <li>• <strong>Enhanced Stash System:</strong> Save and organize your favorites with ratings, search, bulk operations, and export options</li>
                    <li>• <strong>Jam Band Genre Support:</strong> Specialized vocabulary and context for jam band, psychedelic, and improvisational music styles</li>
                    <li>• <strong>Reliable Performance:</strong> Circuit breaker patterns, memory caching, and fallback systems ensure consistent results</li>
                    <li>• <strong>Guest-Friendly Design:</strong> Full functionality available without login, with optional account features for enhanced stash management</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-solid border-border/30 rounded-lg bg-card/60 backdrop-blur-sm">
                  <h3 className="font-medium mb-3">Technology Stack</h3>
                  <div className="text-sm text-muted-foreground space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Frontend</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• React 18 with TypeScript for type safety and modern development</li>
                        <li>• Tailwind CSS with shadcn/ui components for responsive design</li>
                        <li>• TanStack React Query v5 for state management and caching</li>
                        <li>• Vite for fast development and optimized builds</li>
                        <li>• JetBrains Mono typography for clean monospace aesthetics</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Backend</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• Node.js with Express.js and TypeScript for robust API development</li>
                        <li>• PostgreSQL with Drizzle ORM for type-safe database operations</li>
                        <li>• Neon Database for serverless PostgreSQL hosting</li>
                        <li>• Memory caching with TTL for optimized API performance</li>
                        <li>• Security features including rate limiting, CORS, and input sanitization</li>
                        <li>• Replit OpenID Connect for optional user authentication</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">AI & External APIs</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• XAI Grok-3 model for creative name and lyric generation with reliability patterns</li>
                        <li>• Spotify Web API for music verification, popularity scoring, and genre data</li>
                        <li>• Last.fm API for genre vocabulary and music metadata</li>
                        <li>• Datamuse API for linguistic relationships and word associations</li>
                        <li>• ConceptNet API for semantic knowledge and cultural context</li>
                        <li>• PoetryDB API for classical poetry vocabulary and thematic content</li>
                        <li>• Intelligent caching system with configurable timeouts for optimal performance</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Core Architecture</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• Modular service architecture with clean separation of concerns</li>
                        <li>• Circuit breaker patterns for reliable external API integration</li>
                        <li>• Memory caching with TTL for performance optimization</li>
                        <li>• TypeScript throughout for complete type safety</li>
                        <li>• Parallel processing for sub-10 second response times</li>
                        <li>• Retry mechanisms with fallback generation ensuring consistent results</li>
                        <li>• Centralized configuration management for easy maintenance</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-solid border-border/30 rounded-lg bg-card/60 backdrop-blur-sm">
                  <h3 className="font-medium mb-2">Credits & Acknowledgments</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Replit - Development platform and deployment</li>
                    <li>• xAI - Grok AI models for creative name and bio generation</li>
                    <li>• PoetryDB API - Classical poetry context and literary vocabulary</li>
                    <li>• Datamuse API - Linguistic relationships and word associations</li>
                    <li>• Spotify Web API - Music verification and artist data</li>
                    <li>• Last.fm API - Genre intelligence and music metadata</li>
                    <li>• ConceptNet API - Semantic knowledge and conceptual relationships</li>
                    <li>• MusicBrainz API - Additional music database coverage</li>
                    <li>• My incredibly intelligent cat, Marci ♥</li>
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
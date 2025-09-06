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
                    <li>• <strong>5-API Synergy System:</strong> Revolutionary integration of Spotify, Last.fm, ConceptNet, Datamuse, and PoetryDB APIs working together to create contextually rich, genre-authentic names</li>
                    <li>• <strong>PoetryDB Integration:</strong> Classical poetry context enhances generation with poetic vocabulary, imagery, and themes mapped to genres/moods (e.g., jazz → moon/night/smoke, metal → darkness/rage)</li>
                    <li>• <strong>Enhanced 4+ Word Generation:</strong> Natural language patterns using PoeticFlowPatterns class with linguistic templates, grammatical connectives, and smart word categorization for poetic flow</li>
                    <li>• <strong>Optimized Performance:</strong> Reduced response times from 50+ seconds to 7-10 seconds through parallel processing, intelligent caching, and single-model AI approach</li>
                    <li>• <strong>Advanced AI Integration:</strong> XAI Grok models (grok-2-1212, grok-2-vision-1212, grok-3-mini) with dynamic temperature (1.0-1.4), forbidden word filtering, and quality-focused generation (4 results: 2 AI + 2 non-AI)</li>
                    <li>• <strong>Musical Word Filter:</strong> Comprehensive filtering excludes inappropriate terms, overused AI clichés, and non-musical vocabulary while integrating genre-specific terminology</li>
                    <li>• <strong>Spotify-Priority Verification:</strong> Real-time availability checking with Spotify Web API as primary source, enhanced with popularity scores, genres, and direct search links</li>
                    <li>• <strong>Enhanced Lyric Generation:</strong> Poetry-enriched lyrical starters with variable length, poetic meter options (Iambic, Trochaic, etc.), and authentic genre vocabulary from all 5 APIs</li>
                    <li>• <strong>Advanced Stash System:</strong> Save names, lyrics, and band bios with 5-star ratings, category filtering, and comprehensive export options (text/JSON/print)</li>
                    <li>• <strong>Quality Control System:</strong> Semantic coherence checks, pronunciation validation, anti-repetition with 30-minute word memory, and poetic quality assessment</li>
                    <li>• <strong>Set List Generator:</strong> Create organized song lists (8 or 16 songs) with mood/genre settings, automatic structuring, and Spotify verification for each song</li>
                    <li>• <strong>Band Bio Generator:</strong> Create engaging band biographies with sophisticated humor, authentic backstories, and genre-appropriate narrative styles</li>
                    <li>• <strong>Smart Name Patterns:</strong> Pattern-based generation following real band/song naming conventions with compound words, personal statements, and genre-specific structures</li>
                    <li>• <strong>Unified Word Filtering:</strong> Coordinated filtering across all generation methods with time-weighted penalties, stem tracking, and intelligent retry mechanisms</li>
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
                        <li>• XAI Grok models (grok-2-1212, grok-2-vision-1212, grok-3-mini) with dynamic temperature control and 10-second timeout optimization</li>
                        <li>• PoetryDB API for classical poetry context - vocabulary, imagery, themes, and phrases mapped to musical genres and moods</li>
                        <li>• Datamuse API for authentic linguistic relationships, multi-query strategies, and contextual word chains (300,000+ words)</li>
                        <li>• ConceptNet API for semantic knowledge, emotional associations, and cultural context with 30-minute response caching</li>
                        <li>• Spotify Web API (priority) for authoritative music verification with popularity scores, genre data, and artist/track vocabulary extraction</li>
                        <li>• Last.fm API for genre vocabulary, descriptive words, and related genre discovery with confidence scoring</li>
                        <li>• MusicBrainz API for additional music database coverage and artist verification</li>
                        <li>• Famous Names Database with 60+ well-known artists for playful easter egg responses</li>
                        <li>• Unified caching system with 15-minute timeouts for poetry/context data and 30-minute timeouts for ConceptNet responses</li>
                        <li>• Cross-generation anti-repetition system with stem tracking, time-weighted penalties, and 30-minute word memory</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Core Architecture</h4>
                      <ul className="space-y-1 ml-2">
                        <li>• 5-API Synergy System integrating Spotify, Last.fm, ConceptNet, Datamuse, and PoetryDB for comprehensive context</li>
                        <li>• PoeticFlowPatterns class for natural language generation with linguistic templates and grammatical connectives</li>
                        <li>• Advanced word categorization system (noun, verb, adjective) for proper placement in multi-word names</li>
                        <li>• Parallel processing architecture reducing response times from 50+ to 7-10 seconds</li>
                        <li>• Real-time name verification with Spotify-priority checking, popularity scoring, and direct search links</li>
                        <li>• Comprehensive quality control with semantic coherence checks and pronunciation validation</li>
                        <li>• Unified caching system with intelligent timeouts (15-minute for context, 30-minute for API responses)</li>
                        <li>• Musical word filtering system excluding 30+ overused terms and inappropriate vocabulary</li>
                        <li>• Pattern-based name generation following real band/song naming conventions</li>
                        <li>• Intelligent retry mechanisms ensuring complete results (4 names) despite filtering</li>
                        <li>• Non-blocking database storage for improved API response times</li>
                        <li>• Complete TypeScript type safety with centralized constants and eliminated code duplication</li>
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
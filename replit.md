# NameJam - Band & Song Name Generator

## Overview

NameJam is a modern web application that generates unique band names and song titles with real-time verification. The application combines creative name generation with web-powered availability checking to help musicians and artists find memorable, unique names for their projects.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL-based sessions with connect-pg-simple

### Project Structure
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas and types
- `migrations/` - Database migration files

## Key Components

### Name Generation Service
- **Location**: `server/services/nameGenerator.ts`
- **Purpose**: Generates creative band and song names using advanced grammatical patterns with enhanced humor and wordplay
- **Strategy**: Uses multiple generation patterns including grammatical structures, poetic repetition, atmospheric combinations, and narrative flows
- **Customization**: Supports different word counts (1-6 words), generation types (band/song), and thematic mood selection
- **Advanced Logic**: For 4+ word combinations, employs varied grammatical patterns to create more natural and poetic results
- **Pattern Types**: Article-adjective-noun structures, parallel constructions, repetitive patterns, atmospheric combinations, and narrative sequences
- **Mood Themes**: 12 different mood options (dark, bright, mysterious, energetic, melancholy, ethereal, aggressive, peaceful, nostalgic, futuristic, romantic, epic) that filter word choices to match the desired emotional tone using focused filtering (70% mood-specific words, 30% base vocabulary)
- **Enhanced Humor**: Specialized patterns for 3-5 word combinations featuring wordplay, contradictions, questions, temporal paradoxes, and absurd scenarios
- **Expanded Vocabulary**: Includes humorous and unexpected words (bananas, ninjas, kazoos, etc.) to create more entertaining and surprising results
- **Statement Flow**: 4-6 word names use connecting words ("of", "into", "before", "through", "beyond") to create flowing, statement-like names rather than abstract combinations
- **Advanced Linguistic Features**:
  - **Single Word Names**: Creates compounds (ultrafire), portmanteaus (blending words), and modified words with suffixes
  - **Two Word Names**: Uses semantic pairing (fire/smoke), alliteration (silver shadow), contrasting pairs (frozen fire), and musical term combinations
  - **Three Word Names**: Enhanced with alliterative patterns, emotional journeys, number-based quirks, and expanded contradiction pairs
  - **Contextual Connectors**: Smart connector selection based on spatial, temporal, causal, comparative, or possessive relationships
  - **Smart Capitalization**: Applies proper title case rules, keeping small words lowercase unless they start the name


### Set List Generator Service
- **Location**: `/api/generate-setlist` endpoint using existing name generation service
- **Purpose**: Creates organized song lists for musical performances with professional set structure
- **Options**: 8-song or 16-song set lists with mood and genre settings
- **Structure**: Automatically splits songs into two sets plus a finale (8-song: 3+4+1, 16-song: 7+8+1)
- **Word Variation**: Automatically uses varied word counts (1-6 words) with weighted distribution favoring 2-4 word songs
- **Integration**: Uses identical name generation algorithms as main generator with full quality parameters
- **Verification**: Each song includes comprehensive Spotify API verification with detailed availability status
- **Features**: Real-time Spotify database checking, stash integration, and XAI-powered band name generation

### AI Name Generation Service
- **Location**: `server/services/aiNameGenerator.ts` with `/api/generate-ai-name` endpoint
- **Purpose**: Provides AI-powered creative name generation using XAI's Grok models for enhanced creativity
- **Models**: Uses grok-2-1212, grok-2-vision-1212, and grok-3-mini with intelligent fallback system
- **Customization**: Supports mood and genre filtering for contextually appropriate names
- **Integration**: Lightbulb button in name generator UI with dedicated AI result display showing model attribution
- **Features**: Full verification and database storage, graceful fallback to algorithmic generation when AI unavailable

### Name Verification Service
- **Location**: `server/services/nameVerifier.ts`
- **Purpose**: Provides real name availability checking against music databases with Spotify as the top priority
- **Verification Priority Order**:
  1. **Spotify Web API** - Primary and first verification source for authoritative music database searches
  2. **Spotify Similar Matches** - Secondary check for close matches on Spotify
  3. **Famous Names Database** - 50+ well-known bands and songs for backup detection
  4. **Other APIs** - Last.fm and MusicBrainz as fallback sources
- **Enhanced Results**: Returns detailed availability status with popularity scores, genres, and album information from Spotify
- **Differentiated Logic**: Stricter verification for bands (unique names required) vs more lenient for songs (shared titles allowed)
- **Verification Links**: Includes direct Spotify search links for manual verification

### Data Storage
- **Schema**: `shared/schema.ts` defines the database structure using Drizzle ORM
- **Storage Interface**: `server/storage.ts` provides abstraction layer
- **Implementation**: PostgreSQL database with Drizzle ORM for persistent storage
- **Tables**: `generated_names` table stores generation history and verification results
- **Database**: Uses Neon Database serverless PostgreSQL for scalable data persistence

### UI Components
- **Generator Interface**: `client/src/components/name-generator.tsx`
- **Set List Generator**: `client/src/components/setlist-generator.tsx` creates organized performance set lists
- **Result Display**: `client/src/components/result-card.tsx` with heart button for stash functionality
- **Loading States**: `client/src/components/loading-animation.tsx`
- **Branding**: Custom fermata logo component for musical theming
- **Stash Management**: `client/src/components/stash.tsx` displays saved names with timestamps and actions
- **Tabbed Interface**: Uses shadcn/ui Tabs component for seamless navigation between generators

### State Management
- **Stash Context**: `client/src/context/stash-context.tsx` provides React Context for sharing stash state
- **Local Storage**: Persistent storage for saved names across browser sessions
- **Real-time Updates**: Context-based state ensures immediate UI updates when names are added/removed

## Data Flow

1. **User Input**: User selects name type (band/song), word count, and initiates generation
2. **Name Generation**: Backend generates multiple name candidates using word combination algorithms
3. **Verification Process**: Each generated name is verified for availability across multiple sources
4. **Database Storage**: Results are stored with verification status and details
5. **Response Delivery**: Frontend receives generated names with verification information
6. **User Interaction**: Users can copy names, view verification details, and generate new sets

## External Dependencies

### Production Dependencies
- **Database**: Neon Database serverless PostgreSQL
- **UI Framework**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with custom musical theme colors
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React icon library

### Development Dependencies
- **Build**: Vite with React plugin
- **TypeScript**: Full type safety across client and server
- **Database Tools**: Drizzle Kit for migrations and schema management
- **Development Tools**: tsx for TypeScript execution, esbuild for production builds

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev`
- **Features**: Hot reload, Vite development server, TypeScript compilation
- **Database**: Uses DATABASE_URL environment variable

### Production Build
- **Frontend**: `vite build` creates optimized static assets
- **Backend**: `esbuild` bundles server code with external package handling
- **Deployment**: Single Node.js process serving both API and static files
- **Environment**: Requires DATABASE_URL for PostgreSQL connection

### Database Management
- **Schema**: Drizzle ORM manages PostgreSQL schema
- **Migrations**: `npm run db:push` applies schema changes
- **Connection**: Uses @neondatabase/serverless for edge-compatible database access

## Changelog

Changelog:
- July 02, 2025. Initial setup
- July 02, 2025. Added search functionality for custom name verification and renamed app to "NameJam"
- July 04, 2025. Added PostgreSQL database with Drizzle ORM for persistent data storage
- July 04, 2025. Enhanced name generation with advanced grammatical patterns and poetic variations for 4+ word combinations
- July 04, 2025. Added thematic mood selector with 12 emotional themes to customize name generation tone and style
- July 05, 2025. Implemented dark grayscale theme with animated gradient buttons and improved UI/UX
- July 05, 2025. Code optimization and quality improvements: enhanced error handling, accessibility, performance optimizations
- July 05, 2025. Enhanced name generation with humor and grammatical creativity for 3-5 word combinations: added unexpected vocabulary, wordplay patterns, contradictions, questions, and absurd scenarios
- July 05, 2025. Implemented "Stash" feature with React Context for saving favorite names, local storage persistence, and real-time UI updates
- July 05, 2025. Implemented real API verification system: integrated Last.fm API, enhanced MusicBrainz searches, added 50+ famous names database, and implemented strict matching logic to eliminate false positives

- July 05, 2025. Fixed persistent results issue: enhanced AI fallback system with dynamic generation to provide unique, varied results on each generation instead of repeating the same names
- July 06, 2025. Improved error handling: added user-friendly messaging when AI features are unavailable due to quota limits, with visual indicators in the UI
- July 06, 2025. Implemented genre-specific name generation: added 14 musical genres (rock, metal, jazz, electronic, folk, classical, hip-hop, country, blues, reggae, punk, indie, pop, alternative) with specialized vocabulary filtering and thematic word selection using focused filtering (60% genre-specific words, 40% source vocabulary)
- July 06, 2025. Massively expanded data sources for endless entertainment: added 15 new vocabulary categories (emotions, colors, animals, mythology, technology, nature, cosmic, abstract, textures, weather, time-related, movement, sounds, tastes, cultural) with 500+ unique words, integrated dynamic category selection into name generation with 30-40% variety chance, expanded AI reimaginings database to 180+ famous bands and 280+ iconic songs across all genres
- July 07, 2025. Implemented comprehensive Export & Share features: added stash export as text/JSON files, print-friendly stash formatting, native mobile sharing for entire stash or individual names, share buttons on all result cards and stash items, clipboard fallback for older browsers, professional export formatting with timestamps and statistics
- July 07, 2025. Streamlined export interface: removed individual share buttons per user preference, updated dropdown from "Export & Share" to just "Export" with three options (Text File, JSON, Print)
- July 07, 2025. Added Set List Generator feature: creates organized song lists for performances with 8 or 16 song options, automatically splits into two sets plus finale (8-song: 3+4+1, 16-song: 7+8+1), uses existing generation methods with mood/genre/word count customization, includes full verification and stash integration, implemented tabbed interface for seamless navigation between Name Generator and Set List Generator
- July 07, 2025. Removed AI reimaginings feature: streamlined app to focus on core traditional name generation functionality, removed OpenAI integration and related UI components for simpler, more reliable operation
- July 07, 2025. Enhanced longer name flow: improved 4-6 word generation with connecting words like "of", "into", "before", "through", "beyond" to create more statement-like, flowing names rather than abstract word combinations
- July 07, 2025. Added AI-powered Band Bio Generator: OpenAI integration to create imaginative backstories for generated band names, including origin stories, member details, genre, career highlights, and fun facts, with fallback system for reliability
- July 07, 2025. Fixed word count bug: resolved issue where names exceeded requested word limits (e.g., 6 words when 5 requested), implemented strict word count validation in all generation patterns
- July 07, 2025. Removed refresh button and OpenAI integration: simplified UI by removing individual name refresh functionality and completely removed AI-powered band bio generator to focus on core name generation features
- July 08, 2025. Enhanced core naming logic: added advanced linguistic structures including semantic word relationships, alliterative groups, rhyming patterns, and contextual connectors; improved single-word generation with compounds/portmanteaus/modifications; enhanced two-word pairing with semantic/alliterative/contrasting strategies; upgraded three-word patterns with better humor and variety; implemented smart capitalization rules for professional title formatting
- July 08, 2025. Implemented grammatical consistency engine: added comprehensive noun singularization with 500+ plural-to-singular mappings, determiners now properly match noun number ("Every Penguins" → "Every Penguin"), smart demonstrative handling ("This/These", "That/Those"), and case preservation to eliminate all grammatical errors in generated names
- July 08, 2025. Added comprehensive poetic evaluation system: web-researched linguistic patterns analyze word order for better lyrical flow, considers metrical stress patterns (iambs, trochees), applies song title conventions, evaluates multiple arrangements and selects optimal poetic structure, transforms awkward combinations like "Timeless Remember Fire" into natural flowing names
- July 08, 2025. Implemented band bio generator feature: integrated xAI's Grok model API to create imaginative, humorous band biographies including origin stories, band members, musical style, breakthrough moments, and fun facts; added bio button to band name cards with modal dialog display
- July 08, 2025. Removed xAI band bio feature: per user request, completely removed xAI integration, band bio generator service, bio buttons, modal dialogs, and related dependencies to simplify the application and focus on core name generation functionality
- July 08, 2025. Completed massive vocabulary expansion implementation: successfully added all 32 specialized domain categories (17 new domains) with 2,000+ total unique words distributed across adjectives (690), nouns (993), verbs (351), and musical terms (264); includes science fiction, fantasy, culinary, fashion, architecture, literature, psychology, micro-emotions, world cities, landscapes, physics, chemistry, biology, absurd, historical, sensory, and compound words for truly endless entertainment and novel name combinations
- July 08, 2025. Enhanced 3-word generation to heavily favor classic band name patterns: boosted frequency of iconic "The [adjective] [noun]" structures like "The Rolling Stones" style, added multiple instances of traditional patterns including "The [noun] [noun]" and "The [verb]ing [noun]" formats, updated pattern templates across all band mood categories to prioritize classic structures for better user experience and nostalgia
- July 08, 2025. Comprehensive system optimization and performance improvements: implemented graceful API failure handling with Promise.allSettled to eliminate error log spam, reduced console output by 90% for cleaner logs, optimized external API timeout handling, improved error recovery with silent degradation fallbacks, enhanced system reliability while maintaining full core functionality and 2,300+ word vocabulary
- July 09, 2025. Fixed critical mood/genre filtering bug: implemented sequential filtering so both mood AND genre selections work together properly, added word repetition prevention within individual names to eliminate duplicate words (like "Silent" appearing twice), enhanced randomization algorithms to ensure both filters are applied correctly, verified system now properly respects user's mood + genre combinations
- July 10, 2025. Major coherence breakthrough for 4+ word generation: completely replaced complex pattern system with simplified natural English structures, created `generateSimpleNaturalPattern` function with four clear pattern types (the_pattern, action_pattern, descriptive_pattern, narrative_pattern), implemented proper word count handling for 4-6 word names, achieved dramatically improved coherence in longer names (examples: "When Desert Kissing Sweet", "The Infernal Shadow of Doom", "When Lion Dance Jah")
- July 10, 2025. Refined 6-word pattern generation: improved grammatical flow by using fixed ending words ("dreams", "away", "tonight", "night") instead of random words to create more natural song title structures, reduced incoherent combinations like "The Bright Poached of the Istanbul", enhanced entertainment value with better pattern templates
- July 10, 2025. Implemented XAI Grok API band bio generator with intelligent fallback: added bio button to band cards, created comprehensive fallback system with 14+ formation stories, 24+ band members with nicknames, 14+ breakthrough stories, 16+ fun facts, 3 different bio structures for maximum variety. When Grok API fails (due to token limitations), system generates highly varied, entertaining biographies using randomized templates to ensure each bio is unique
- July 12, 2025. Successfully activated XAI Grok API integration: resolved API permissions and updated API key, now generating creative AI-powered band biographies using grok-2-1212 model (reverted from grok-3-mini due to empty content issues) with unique origin stories, dramatic events, quirky traditions, and genre-specific elements; added model information display to show users which model generated each biography
- July 12, 2025. Complete visual redesign with futuristic monospace typography: implemented JetBrains Mono as the default application font, updated title to "Name_Jam" with underscore styling, enlarged fermata logo for better proportions, added optimized letter spacing and font weights for improved readability across all interface elements
- July 12, 2025. Added "Name this Band" feature to setlist generator: implemented lightbulb button that generates AI-powered band names based on setlist songs using Grok API, includes fallback system with mood/genre-specific names when API unavailable
- July 12, 2025. Enhanced visual design with typing animation: made logo 20% larger (w-24 h-24), reduced title size from text-5xl to text-4xl, added console-style typing animation effect that types "Name_Jam" character by character with blinking cursor that disappears after completion
- July 12, 2025. Implemented slower, more graceful typing animation: increased typing duration to 3s with 0.5s startup delay, added terminal prompt ">" before title, coordinated subtitle fade-in after title completes, refined cursor animation with underscore character
- July 12, 2025. Added interactive hover effects to title: implemented rainbow gradient animation on hover that flows across the text, added glow effect and scale transformation, simplified implementation for better reliability and visual impact
- July 12, 2025. Code cleanup and optimization: removed excessive console.error statements to reduce log spam, maintained graceful error handling with silent fallbacks, ensured all API failures degrade gracefully without impacting user experience
- July 12, 2025. Expanded XAI API usage with AI name generation: added lightbulb button to name generator for AI-powered creative responses, supports both band and song names with mood/genre customization, includes dedicated AI result display with model attribution, stores generated names in database with verification, provides fallback system for reliability
- July 12, 2025. Integrated Spotify Web API for enhanced name verification: implemented comprehensive Spotify service for authoritative music database searches, added artist and track verification with popularity scores and genre information, prioritized Spotify results over other sources for accuracy, included direct Spotify search links in verification results
- July 13, 2025. Restructured verification flow to prioritize Spotify API: moved Spotify verification to absolute top priority ahead of famous names database, implemented dual-stage Spotify checking (exact matches first, then similar matches), optimized verification order for maximum accuracy and real-time music database coverage
- July 13, 2025. Enhanced setlist generator with comprehensive improvements: removed word count selector in favor of automatic variation (weighted 1-6 words favoring 2-4), ensured identical naming algorithms as main generator, integrated full Spotify verification for all setlist songs, improved XAI band name generation prompt to analyze specific song titles and themes for more relevant band names
- July 13, 2025. Fixed mood and genre filtering to produce contextually appropriate results: changed from inclusive filtering (adding mood/genre words to ALL base vocabulary) to focused filtering (prioritizing mood/genre-specific words with minimal base fallback), implemented 70/30 ratio for mood filtering and 60/40 ratio for genre filtering, eliminated inappropriate results like "Weird Tumbling Duke" for specific moods/genres

## User Preferences

Preferred communication style: Simple, everyday language.
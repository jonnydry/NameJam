# NameJam - Band & Song Name Generator

## Overview
NameJam is a web application designed to generate unique band names and song titles with real-time availability verification. It combines creative name generation with web-powered checking to help musicians and artists find memorable names for their projects. The project aims to provide a tool that not only sparks creativity but also ensures the practical usability of generated names by integrating with music databases.

## Recent Updates (January 2025)
- Implemented comprehensive 5-step API synergy enhancement plan:
  - **Step 1**: AI improvements with dynamic temperature (1.0-1.4), model rotation (grok-2-1212, grok-2-vision-1212, grok-3-mini), forbidden word filtering (30+ overused terms)
  - **Step 2**: Datamuse optimization with multi-query strategy, frequency filtering, contextual chains, enhanced relationship mining
  - **Step 3**: Quality control upgrades including semantic coherence checks, pronunciation validation, anti-repetition system, poetic quality assessment
  - **Step 4**: API context enrichment by collecting real-world vocabulary from Spotify, Last.fm, and ConceptNet APIs
  - **Step 5**: Performance optimizations with context/word source caching (15-minute timeout), batch generation (5 candidates), parallel quality checking

### Performance Optimizations (January 2025)
- **Parallelized AI Generation**: Changed from sequential to parallel AI name generation, significantly reducing generation time
- **Optimized Quality Checks**: Made quality checks optional and simplified for performance, removing expensive ConceptNet API calls by default
- **Added Caching**: Implemented caching for ConceptNet API responses with 30-minute timeout
- **Removed Sequential Bottlenecks**: Eliminated sequential processing in verification service, now all verifications run in parallel
- **Timeout Improvements**: Increased request timeout to 35 seconds and improved timeout handling to prevent double responses
- **Non-blocking Database Storage**: Made database storage asynchronous to speed up API responses
- **Reduced Retries**: Limited AI generation retries to 1 attempt per model for faster responses

### Name Quality Improvements (January 2025)
- **Musical Word Filter**: Created comprehensive filter to exclude inappropriate words (anatomical terms, food items, archaic words) and overused AI clichés
- **Smart Name Patterns**: Implemented pattern-based generation following real band/song naming conventions (e.g., "The [Adj] [Noun]s", compound words, personal statements)
- **Enhanced Word Sources**: Improved word filtering to use musically appropriate vocabulary and integrate genre-specific terms
- **Forbidden Words Expansion**: Added inappropriate Datamuse results (bosom, meat, aglow) and additional AI clichés to forbidden list
- **Context Usage**: Better integration of Spotify/Last.fm context data to guide name generation with real musical examples
- **Reduced Generation Count**: Changed from 8 names to 4 names (2 AI + 2 non-AI) to prioritize quality over quantity and improve response speed
- **Unified Word Filtering**: Implemented coordinated word filtering across AI and non-AI generation to prevent repetition within generations (4 results) and reduce similarity between back-to-back generations. Features time-weighted penalties, stem tracking for word variations, and 30-minute word memory for maximum variety while preserving creativity.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query
- **Routing**: Wouter
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM (using Neon Database)
- **Session Management**: PostgreSQL-based sessions

### Project Structure
- `client/`: React frontend
- `server/`: Express.js backend API
- `shared/`: Shared TypeScript schemas and types
- `migrations/`: Database migration files

### Key Features & Design Patterns
- **Name Generation Service**: Generates band/song names using advanced grammatical patterns, poetic repetition, and thematic mood selection (12 moods). Supports precise word counts (1-3 words) and dynamic "4+" option (4-7 words) with varied grammatical patterns and enhanced humor. Incorporates advanced linguistic features for single, two, and three-word names, contextual connectors, and smart capitalization.
- **Set List Generator Service**: Creates organized song lists (8 or 16 songs) using the name generation service, with mood and genre settings. Automatically structures sets and includes Spotify API verification for each song.
- **AI Name Generation Service**: Provides AI-powered name generation using XAI's Grok models (grok-2-1212, grok-2-vision-1212, grok-3-mini) with intelligent fallback. Supports mood and genre filtering.
- **Enhanced AI Lyric Generation Service**: Generates diverse lyrical starters with variable length (short, medium, long, couplet), poetic meter (Iambic, Trochaic, Anapestic, Dactylic, Free Verse), and authentic genre vocabulary. Uses a hybrid approach with Datamuse API and AI for enriched context.
- **Name Verification Service**: Verifies name availability prioritizing Spotify Web API, then Spotify Similar Matches, Famous Names Database, and other APIs like Last.fm and MusicBrainz. Returns detailed availability with popularity scores and genre info.
- **ConceptNet Integration Service**: Enhances name generation with semantic knowledge, emotional, genre, and cultural associations.
- **UI Components**: Includes Generator Interface, Set List Generator, Result Display, Loading Animations, Stash Management with 1-5 star rating system and sorting, and a Tabbed Interface.
- **State Management**: Uses React Context for stash management and local storage for persistence.
- **Performance Optimization**: Implemented parallel verification, intelligent caching, non-blocking database storage, response compression, and optimized frontend with debouncing.
- **Security & Authentication**: Comprehensive user authentication/authorization via Replit OpenID Connect, user-specific data isolation, API rate limiting, CORS, Helmet security headers, input sanitization, and express-validator. Supports mixed authentication (guest/authenticated users).
- **UI/UX Decisions**: Dark grayscale theme, animated gradient buttons, custom fermata logo, monospace typography (JetBrains Mono), dynamic loading progress (equalizer visualization), responsive design, and enhanced mobile text scaling. Result cards follow a single-column layout with consistent dark gradients and color-coded borders for AI vs. traditional results.

## External Dependencies

- **Database**: Neon Database (serverless PostgreSQL)
- **APIs**:
    - Spotify Web API
    - Datamuse API
    - Last.fm API
    - MusicBrainz API
    - ConceptNet API
    - XAI Grok models (for AI name and lyric generation)
- **UI Libraries**: Radix UI (primitives), shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Build Tools**: Vite, esbuild
- **Database ORM**: Drizzle ORM, Drizzle Kit
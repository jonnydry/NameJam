# NameJam - Band & Song Name Generator

## Overview
NameJam is a web application designed to generate unique band names and song titles with real-time availability verification against music databases. The project aims to provide a creative tool that also ensures the practical usability of generated names, combining creative name generation with web-powered checking for musicians and artists.

## User Preferences
Preferred communication style: Simple, everyday language.
Authentication approach: Non-authenticated users have full access to all features except server-side stash persistence. Only the stash feature requires login for server storage.
Name generation approach: Dynamic API-driven context (no static lists) feeding structured prompts to XAI for creative, contextual results.

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
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: PostgreSQL-based sessions

### Project Structure
- `client/`: React frontend
- `server/`: Express.js backend API
- `shared/`: Shared TypeScript schemas and types
- `migrations/`: Database migration files

### Key Features & Design Patterns
- **Intelligent Name Generation Service**: API-driven name generation using dynamic context from Datamuse (word associations), Spotify (genre artists), and Last.fm (genre vocabulary) feeding into structured XAI prompts. Eliminates static word lists in favor of live API data for fresh, contextual results.
- **Legacy AI Name Generation Service**: Provides fallback AI-powered name generation using XAI's Grok 2 model with minimal context.
- **Enhanced AI Lyric Generation Service**: Generates diverse lyrical starters with variable length, poetic meter, and authentic genre vocabulary, utilizing a hybrid approach with Datamuse API and AI for enriched context.
- **Flexible Word Count System**: "4+" option now generates names ranging from 4-10 words with proper distribution across the full range, using structured prompts to ensure both shorter (4-6 words) and longer (7-10 words) name variations.
- **Creative AI Band Name Generation Service**: Uses humorous, entertaining prompts focused on puns, wordplay, and whimsy. Generates 8 creative names, evaluates them on originality and entertainment value, then selects top 4. Returns JSON format {"band_names": []} for easy parsing.
- **Creative AI Song Title Generation Service**: Uses humorous, entertaining prompts focused on clever, punny, and unexpected song titles. Generates 8 creative titles, evaluates them on originality and entertainment value, then selects top 4. Returns JSON format {"song_titles": []} for easy parsing.
- **Name Verification Service**: Verifies name availability prioritizing Spotify, then Spotify Similar Matches, Famous Names Database, and other APIs like Last.fm and MusicBrainz, returning detailed availability with popularity scores and genre info.
- **ConceptNet Integration Service**: Enhances name generation with semantic knowledge, emotional, genre, and cultural associations.
- **UI Components**: Includes Generator Interface, Result Display, Loading Animations, and Stash Management with rating and sorting.
- **State Management**: Uses React Context for stash management and local storage for persistence.
- **Performance Optimization**: Implemented parallel verification, intelligent caching, non-blocking database storage, response compression, and optimized frontend with debouncing. Achieved sub-10 second response times through architectural changes including optimized context aggregation, reduced AI generation retries, and pre-generated fallback names. Added periodic word filter cleanup (every 2 minutes), API retry logic with exponential backoff, and rate limiting for verification services.
- **Security & Authentication**: Comprehensive user authentication/authorization via Replit OpenID Connect, user-specific data isolation, API rate limiting, CORS, Helmet security headers, input sanitization, and express-validator. Supports mixed authentication (guest/authenticated users). Enhanced with session secret rotation (24-hour interval), distributed rate limiting protection, and comprehensive input sanitization for all endpoints.
- **UI/UX Decisions**: Dark grayscale theme, animated gradient buttons, custom fermata logo, monospace typography (JetBrains Mono), dynamic loading progress (equalizer visualization), responsive design, and enhanced mobile text scaling. Result cards feature a single-column layout with consistent dark gradients and color-coded borders for AI vs. traditional results. Added React error boundaries, offline indicator, loading state components, and user-friendly error messages throughout the application.

## External Dependencies

- **Database**: Neon Database (serverless PostgreSQL)
- **APIs**:
    - Spotify Web API
    - Datamuse API
    - Last.fm API
    - MusicBrainz API
    - ConceptNet API
    - PoetryDB API
    - XAI Grok 3 model (updated from Grok-2-1212)
- **UI Libraries**: Radix UI, shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Build Tools**: Vite, esbuild
- **Database ORM**: Drizzle ORM, Drizzle Kit
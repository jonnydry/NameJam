# NameJam - Band & Song Name Generator

## Overview
NameJam is a web application designed to generate unique band names and song titles with real-time availability verification against music databases. The project aims to provide a creative tool that also ensures the practical usability of generated names, combining creative name generation with web-powered checking for musicians and artists.

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
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: PostgreSQL-based sessions

### Project Structure
- `client/`: React frontend
- `server/`: Express.js backend API
- `shared/`: Shared TypeScript schemas and types
- `migrations/`: Database migration files

### Key Features & Design Patterns
- **Name Generation Service**: Generates band/song names using advanced grammatical patterns, poetic repetition, and thematic mood selection. Supports precise word counts (1-3 words) and dynamic "4+" option (4-7 words) with varied grammatical patterns and humor. Incorporates advanced linguistic features, contextual connectors, and smart capitalization.
- **AI Name Generation Service**: Provides AI-powered name generation exclusively using XAI's Grok 3 model. Supports mood and genre filtering.
- **Enhanced AI Lyric Generation Service**: Generates diverse lyrical starters with variable length, poetic meter, and authentic genre vocabulary, utilizing a hybrid approach with Datamuse API and AI for enriched context.
- **Name Verification Service**: Verifies name availability prioritizing Spotify, then Spotify Similar Matches, Famous Names Database, and other APIs like Last.fm and MusicBrainz, returning detailed availability with popularity scores and genre info.
- **ConceptNet Integration Service**: Enhances name generation with semantic knowledge, emotional, genre, and cultural associations.
- **UI Components**: Includes Generator Interface, Result Display, Loading Animations, and Stash Management with rating and sorting.
- **State Management**: Uses React Context for stash management and local storage for persistence.
- **Performance Optimization**: Implemented parallel verification, intelligent caching, non-blocking database storage, response compression, and optimized frontend with debouncing. Achieved sub-10 second response times through architectural changes including optimized context aggregation, reduced AI generation retries, and pre-generated fallback names.
- **Security & Authentication**: Comprehensive user authentication/authorization via Replit OpenID Connect, user-specific data isolation, API rate limiting, CORS, Helmet security headers, input sanitization, and express-validator. Supports mixed authentication (guest/authenticated users).
- **UI/UX Decisions**: Dark grayscale theme, animated gradient buttons, custom fermata logo, monospace typography (JetBrains Mono), dynamic loading progress (equalizer visualization), responsive design, and enhanced mobile text scaling. Result cards feature a single-column layout with consistent dark gradients and color-coded borders for AI vs. traditional results.

## External Dependencies

- **Database**: Neon Database (serverless PostgreSQL)
- **APIs**:
    - Spotify Web API
    - Datamuse API
    - Last.fm API
    - MusicBrainz API
    - ConceptNet API
    - PoetryDB API
    - XAI Grok 3 model
- **UI Libraries**: Radix UI, shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Build Tools**: Vite, esbuild
- **Database ORM**: Drizzle ORM, Drizzle Kit
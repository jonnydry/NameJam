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
- **Mood Themes**: 12 different mood options (dark, bright, mysterious, energetic, melancholy, ethereal, aggressive, peaceful, nostalgic, futuristic, romantic, epic) that filter word choices to match the desired emotional tone
- **Enhanced Humor**: Specialized patterns for 3-5 word combinations featuring wordplay, contradictions, questions, temporal paradoxes, and absurd scenarios
- **Expanded Vocabulary**: Includes humorous and unexpected words (bananas, ninjas, kazoos, etc.) to create more entertaining and surprising results
- **Statement Flow**: 4-6 word names use connecting words ("of", "into", "before", "through", "beyond") to create flowing, statement-like names rather than abstract combinations


### Set List Generator Service
- **Location**: `/api/generate-setlist` endpoint using existing name generation service
- **Purpose**: Creates organized song lists for musical performances with professional set structure
- **Options**: 8-song or 16-song set lists with customizable word count, mood, and genre settings
- **Structure**: Automatically splits songs into two sets plus a finale (8-song: 3+4+1, 16-song: 7+8+1)
- **Integration**: Uses existing name generation algorithms for song creation with full verification system
- **Features**: Each song includes real-time availability verification and stash integration

### Name Verification Service
- **Location**: `server/services/nameVerifier.ts`
- **Purpose**: Provides real name availability checking against music databases
- **Famous Names Database**: 50+ well-known bands and songs for immediate detection
- **API Integration**: Last.fm and MusicBrainz for comprehensive music database searches
- **Differentiated Logic**: Stricter verification for bands (unique names required) vs more lenient for songs (shared titles allowed)
- **Results**: Returns accurate availability status (available/similar/taken) with verification links

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
- July 06, 2025. Implemented genre-specific name generation: added 14 musical genres (rock, metal, jazz, electronic, folk, classical, hip-hop, country, blues, reggae, punk, indie, pop, alternative) with specialized vocabulary filtering and thematic word selection
- July 06, 2025. Massively expanded data sources for endless entertainment: added 15 new vocabulary categories (emotions, colors, animals, mythology, technology, nature, cosmic, abstract, textures, weather, time-related, movement, sounds, tastes, cultural) with 500+ unique words, integrated dynamic category selection into name generation with 30-40% variety chance, expanded AI reimaginings database to 180+ famous bands and 280+ iconic songs across all genres
- July 07, 2025. Implemented comprehensive Export & Share features: added stash export as text/JSON files, print-friendly stash formatting, native mobile sharing for entire stash or individual names, share buttons on all result cards and stash items, clipboard fallback for older browsers, professional export formatting with timestamps and statistics
- July 07, 2025. Streamlined export interface: removed individual share buttons per user preference, updated dropdown from "Export & Share" to just "Export" with three options (Text File, JSON, Print)
- July 07, 2025. Added Set List Generator feature: creates organized song lists for performances with 8 or 16 song options, automatically splits into two sets plus finale (8-song: 3+4+1, 16-song: 7+8+1), uses existing generation methods with mood/genre/word count customization, includes full verification and stash integration, implemented tabbed interface for seamless navigation between Name Generator and Set List Generator
- July 07, 2025. Removed AI reimaginings feature: streamlined app to focus on core traditional name generation functionality, removed OpenAI integration and related UI components for simpler, more reliable operation
- July 07, 2025. Enhanced longer name flow: improved 4-6 word generation with connecting words like "of", "into", "before", "through", "beyond" to create more statement-like, flowing names rather than abstract word combinations

## User Preferences

Preferred communication style: Simple, everyday language.
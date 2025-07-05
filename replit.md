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
- **AI Reimaginings**: OpenAI-powered creative reinterpretations of famous band/song names with flexible word counts and artistic wordplay that maintain thematic essence while being completely original

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
- **Result Display**: `client/src/components/result-card.tsx` with heart button for stash functionality
- **Loading States**: `client/src/components/loading-animation.tsx`
- **Branding**: Custom fermata logo component for musical theming
- **Stash Management**: `client/src/components/stash.tsx` displays saved names with timestamps and actions

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
- July 05, 2025. Added AI-powered creative reimaginings feature: OpenAI integration to generate artistic reinterpretations of famous band/song names with flexible word counts, thematic mood support, and intelligent fallback system

## User Preferences

Preferred communication style: Simple, everyday language.
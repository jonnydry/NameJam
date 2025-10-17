# NameJam - Band & Song Name Generator

## Overview
NameJam is a web application designed to generate unique band names and song titles. It integrates creative name generation with real-time availability verification, primarily using Spotify, to help musicians and artists find distinctive names. The project aims to provide a comprehensive tool for creative naming with a focus on humor, wordplay, and contextual relevance, offering both algorithmic and AI-powered generation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query for server state, React Context for local state (Stash)
- **Routing**: Wouter
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM (Neon Database for serverless)
- **Session Management**: PostgreSQL-based sessions with `connect-pg-simple`

### Core Features
- **Name Generation**: Generates band and song names using advanced grammatical patterns, poetic structures, and thematic moods. Supports precise word counts (1-3 words) and dynamic "4+" option (4-7 words) with enhanced humor and wordplay.
- **AI Name Generation**: Integrates XAI's Grok models (grok-2-1212, grok-2-vision-1212, grok-3-mini) for creative name suggestions, with an intelligent fallback system to algorithmic generation.
- **Set List Generation**: Creates organized 8 or 16-song set lists for performances, utilizing the same name generation algorithms and including Spotify verification for each song.
- **Lyric Generation**: Generates lyrical starters enhanced with Datamuse API for genre-appropriate vocabulary, emotional words, rhymes, and sensory terms.
- **Name Verification**: Prioritizes Spotify Web API for real-time availability checking, followed by Spotify Similar Matches, a Famous Names Database, Last.fm, and MusicBrainz for comprehensive results. Provides detailed status, popularity, genres, and direct Spotify links.
- **ConceptNet Integration**: Enhances name generation with semantic knowledge, emotional, genre, and cultural associations for richer vocabulary and contextual understanding.
- **Stash Management**: Allows users to save favorite names, set lists, and band bios with 1-5 star ratings, sorting options, and local storage persistence.
- **User Authentication**: Implements Replit OpenID Connect for user login, enabling personalized stash and features. Basic generation features are accessible to guest users.

### UI/UX Decisions
- **Typography**: JetBrains Mono for a futuristic monospace aesthetic.
- **Visual Design**: Dark grayscale theme with animated gradient buttons, consistent card gradients, and visual indicators for AI-generated results (purple brain icon).
- **Responsiveness**: Optimized for mobile with collapsible sidebars, larger touch targets, and dynamic text scaling.
- **Loading Animations**: Dynamic sound wave/equalizer visualizations that reflect actual API response times.

## External Dependencies

- **Database Provider**: Neon Database (serverless PostgreSQL)
- **AI/ML**: XAI's Grok models (grok-2-1212, grok-2-vision-1212, grok-3-mini)
- **Linguistic Data**: Datamuse API
- **Music Data**: Spotify Web API, Last.fm API, MusicBrainz API
- **Semantic Knowledge**: ConceptNet API
- **UI Components**: Radix UI primitives, shadcn/ui
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Authentication**: Replit OpenID Connect
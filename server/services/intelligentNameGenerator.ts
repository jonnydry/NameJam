/**
 * Intelligent Name Generator - API-driven context feeding into XAI
 * Uses Datamuse + Spotify + Last.fm to build rich context for XAI generation
 */

import type { GenerateNameRequest } from "@shared/schema";
import { secureLog } from "../utils/secureLogger";
import { datamuseService } from "./datamuseService";
import { spotifyService } from "./spotifyService";
import { lastfmService } from "./lastfmService";
import OpenAI from "openai";

interface GenerationContext {
  genreKeywords: string[];
  moodWords: string[];
  relatedArtists: string[];
  genreTags: string[];
  wordAssociations: string[];
  audioCharacteristics: string[];
  culturalReferences: string[];
}

export class IntelligentNameGeneratorService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      baseURL: "https://api.x.ai/v1", 
      apiKey: process.env.XAI_API_KEY 
    });
  }

  async generateNames(request: GenerateNameRequest): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { type, genre, mood, count = 4, wordCount } = request;
    
    secureLog.info(`🧠 Intelligent generation: ${count} ${type} names for ${genre || 'general'} genre, ${mood || 'neutral'} mood, ${this.formatWordCount(wordCount)} words`);
    
    try {
      // 1. Gather context from APIs in parallel
      const context = await this.gatherContext(genre, mood, type);
      
      // 2. Build structured XAI prompt with word count constraints
      const prompt = this.buildXAIPrompt(context, type, genre, mood, count, wordCount);
      
      // 3. Generate names using XAI with validation
      const names = await this.generateWithXAI(prompt, count, wordCount);
      
      return names.map(name => ({
        name,
        isAiGenerated: true,
        source: 'intelligent'
      }));
      
    } catch (error) {
      secureLog.error('Intelligent generation error:', error);
      // Fallback to simpler generation if APIs fail
      return this.generateFallbackNames(type, genre, mood, count);
    }
  }

  private async gatherContext(genre?: string, mood?: string, type?: string): Promise<GenerationContext> {
    const context: GenerationContext = {
      genreKeywords: [],
      moodWords: [],
      relatedArtists: [],
      genreTags: [],
      wordAssociations: [],
      audioCharacteristics: [],
      culturalReferences: []
    };

    // Parallel API calls for speed
    const promises = [];

    // 1. Datamuse - Word associations for genre and mood
    if (genre) {
      promises.push(
        datamuseService.findSimilarWords(genre, 10)
          .then((words: any[]) => {
            context.genreKeywords = words.map((w: any) => w.word);
            return datamuseService.findAdjectivesForNoun(genre, 8);
          })
          .then((adjectives: any[]) => {
            context.wordAssociations = adjectives.map((a: any) => a.word);
          })
          .catch((err: any) => secureLog.debug('Datamuse genre error:', err))
      );
    }

    if (mood) {
      promises.push(
        datamuseService.findSimilarWords(mood, 8)
          .then((words: any[]) => {
            context.moodWords = words.map((w: any) => w.word);
          })
          .catch((err: any) => secureLog.debug('Datamuse mood error:', err))
      );
    }

    // 2. Spotify - Real artist examples and genre characteristics
    if (genre) {
      promises.push(
        spotifyService.getGenreArtists(genre, 5)
          .then((artists: any[]) => {
            context.relatedArtists = artists.map((a: any) => a.name);
            // Extract audio characteristics from genre
            context.audioCharacteristics = this.getAudioCharacteristics(genre);
          })
          .catch((err: any) => secureLog.debug('Spotify genre error:', err))
      );
    }

    // 3. Last.fm - Genre vocabulary and cultural context  
    if (genre) {
      promises.push(
        lastfmService.getGenreVocabulary(genre)
          .then((vocabulary: any) => {
            context.genreTags = vocabulary.descriptiveWords.slice(0, 8);
            context.culturalReferences = this.extractCulturalReferences(vocabulary.descriptiveWords);
          })
          .catch((err: any) => secureLog.debug('Last.fm genre error:', err))
      );
    }

    // Wait for all API calls to complete
    await Promise.all(promises);
    
    secureLog.debug('Gathered context:', {
      genreKeywords: context.genreKeywords.length,
      moodWords: context.moodWords.length,
      relatedArtists: context.relatedArtists.length,
      genreTags: context.genreTags.length
    });

    return context;
  }

  private buildXAIPrompt(context: GenerationContext, type: string, genre?: string, mood?: string, count: number = 4, wordCount?: number | string): string {
    const isband = type === 'band';
    
    return `You are an expert music industry creative who generates ${isband ? 'band' : 'song'} names that sound natural, memorable, and genre-appropriate.

CONTEXT FROM MUSIC APIS:
- Genre: ${genre || 'general'}
- Mood: ${mood || 'neutral'}
- Related Artists: ${context.relatedArtists.join(', ')}
- Genre Keywords: ${context.genreKeywords.join(', ')}
- Mood Words: ${context.moodWords.join(', ')}
- Word Associations: ${context.wordAssociations.join(', ')}
- Genre Tags: ${context.genreTags.join(', ')}
- Audio Style: ${context.audioCharacteristics.join(', ')}

SUCCESSFUL ${type.toUpperCase()} NAME PATTERNS:
${isband ? this.getBandNamePatterns(genre) : this.getSongNamePatterns(genre)}

${wordCount === '4+' || wordCount === 4.1 ? this.getLongerNameExamples(isband) : ''}

REQUIREMENTS:
1. Generate exactly ${count} unique ${type} names
2. ${this.getWordCountRequirement(wordCount)}
3. Names must sound natural and convincing with proper grammar
4. Reflect the ${genre || 'general'} genre and ${mood || 'neutral'} mood
5. Use the API context words naturally, not forced
6. Follow successful real-world naming patterns
7. Be memorable and distinctive
8. Vary the patterns/structures across the ${count} names
9. NO repetition - each name must be completely different
10. For longer names (4+ words), use natural phrases with proper connectors

STYLE NOTES:
- ${genre === 'rock' ? 'Rock names can be edgy, powerful, energetic' : ''}
- ${genre === 'pop' ? 'Pop names should be catchy, accessible, memorable' : ''}
- ${genre === 'indie' ? 'Indie names can be quirky, literary, unexpected' : ''}
- ${mood === 'dark' ? 'Dark mood: use deeper, more mysterious language' : ''}
- ${mood === 'happy' ? 'Happy mood: use bright, uplifting language' : ''}
- ${mood === 'romantic' ? 'Romantic mood: use emotional, intimate language' : ''}

OUTPUT FORMAT:
${wordCount === '4+' || wordCount === 4.1 ? 
`Generate exactly ${count} names in this specific mix:
- ${Math.ceil(count/2)} names with 7-10 words (use phrases like "The Story of How We..." or "When the [Thing] [Action] Through the [Place]")
- ${Math.floor(count/2)} names with 4-6 words
One name per line, no numbering:` :
`Generate exactly ${count} names, one per line, no numbering or extra text:`}
${this.getWordCountReminder(wordCount)}`;
  }

  private formatWordCount(wordCount?: number | string): string {
    if (!wordCount) return 'any';
    if (wordCount === '4+' || wordCount === 4.1) return '4-10';
    return wordCount.toString();
  }

  private getWordCountRequirement(wordCount?: number | string): string {
    if (!wordCount) return 'Use 1-3 words for bands, 2-4 words for songs';
    if (wordCount === '4+' || wordCount === 4.1) {
      return 'Each name must be 4-10 words. IMPORTANT: Generate at least half the names with 7-10 words using descriptive phrases like "The Story of [Something]", "When We [Action] Through the [Place]", "[Person] Who [Action] with [Thing]". Use natural connectors: and, of, the, in, with, from, through, where, when, who, that.';
    }
    return `Each name must be EXACTLY ${wordCount} words (count carefully!)`;
  }

  private getWordCountReminder(wordCount?: number | string): string {
    if (!wordCount) return '';
    if (wordCount === '4+' || wordCount === 4.1) {
      return 'CRITICAL: Generate names with these word counts - AT LEAST HALF must be 7-10 words long! Use story-like phrases for longer names.';
    }
    return `CRITICAL: Count words carefully - each name must have exactly ${wordCount} words!`;
  }

  private getBandNamePatterns(genre?: string): string {
    switch (genre) {
      case 'rock':
        return `- "The [Adjective] [Noun]" (The Black Keys, The White Stripes)
- Single powerful words (Queen, Metallica, Journey)
- "[Color] [Noun]" (Red Hot Chili Peppers, Blue Oyster Cult)
- Compound words (Soundgarden, Radiohead)`;
      
      case 'indie':
        return `- Animal names (Arctic Monkeys, Wolf Alice)
- "The [Adjective] [Noun]" (The National, The Shins)
- Literary references (Joy Division, Belle and Sebastian)
- Ironic combinations (Death Cab for Cutie)`;
      
      case 'pop':
        return `- Simple, memorable words (Madonna, Prince, Cher)
- "[Number] [Noun]" (Maroon 5, One Direction)
- Compound words (OneRepublic, BlackPink)
- "[Name] and The [Group]" (Florence and The Machine)`;
      
      default:
        return `- "The [Adjective] [Noun]" pattern (most successful)
- Single memorable words
- "[Color] [Noun]" combinations
- Numbers in names (U2, Blink-182)`;
    }
  }

  private getSongNamePatterns(genre?: string): string {
    switch (genre) {
      case 'rock':
        return `- Simple statements ("Don't Stop Believin'", "We Will Rock You")
- Commands ("Don't Stop", "Let It Be")
- "[I/We] [Verb] [Object]" ("I Love Rock n Roll")
- Time references ("Tonight", "Yesterday")`;
      
      case 'pop':
        return `- Love statements ("I Will Always Love You", "Love Story")
- "[Feeling] [Noun]" ("Sweet Dreams", "Perfect Love")
- Questions ("What's Love Got to Do with It?")
- Time phrases ("Last Friday Night", "22")`;
      
      case 'indie':
        return `- Conversational ("Hey Jude", "Mr. Brightside")
- Metaphors ("Fake Plastic Trees", "Karma Police")
- Literary phrases ("The Sound of Silence")
- Nostalgic references ("Good Old Days")`;
      
      default:
        return `- Simple statements (most successful)
- Questions with question marks
- Commands ("Let It Be", "Don't Stop")
- Emotional phrases ("Sweet Dreams", "Perfect Love")`;
    }
  }

  private getAudioCharacteristics(genre: string): string[] {
    const characteristics: { [key: string]: string[] } = {
      rock: ['high energy', 'guitar-driven', 'powerful drums', 'raw vocals'],
      pop: ['catchy melodies', 'danceable beats', 'polished production', 'radio-friendly'],
      indie: ['alternative sound', 'artistic expression', 'experimental elements', 'authentic feel'],
      electronic: ['synthesized sounds', 'digital production', 'rhythmic patterns', 'ambient textures'],
      hip_hop: ['strong beats', 'rhythmic vocals', 'urban culture', 'contemporary themes'],
      folk: ['acoustic instruments', 'storytelling', 'traditional roots', 'organic sound'],
      jazz: ['improvisation', 'complex harmonies', 'swing rhythms', 'instrumental focus'],
      classical: ['orchestral arrangements', 'composed structure', 'formal precision', 'timeless elegance']
    };
    
    return characteristics[genre] || ['musical expression', 'creative sound', 'artistic vision'];
  }

  private extractCulturalReferences(words: string[]): string[] {
    // Extract cultural/era references from vocabulary words
    const cultural = words.filter(word => 
      word.includes('90s') || word.includes('80s') || word.includes('70s') ||
      word.includes('american') || word.includes('british') || word.includes('classic') ||
      word.includes('modern') || word.includes('contemporary') || word.includes('vintage')
    );
    return cultural.slice(0, 5);
  }

  private async generateWithXAI(prompt: string, count: number, wordCount?: number | string): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "grok-2-1212",
        messages: [{ role: "user", content: prompt }],
        temperature: 1.1, // Higher creativity for longer names
        max_tokens: 300 // More space for longer names
      });

      const content = response.choices[0].message.content?.trim();
      if (!content) {
        throw new Error('No content generated by XAI');
      }

      // Parse the response into individual names  
      let names = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.match(/^\d+\./) && line.length < 150) // Allow longer names
        .map(line => line.replace(/^[-•]\s*/, '')) // Remove bullet points
        .filter(line => line.length > 0);

      // Word count validation if specified
      if (wordCount) {
        const validNames = names.filter(name => {
          const actualWordCount = name.split(/\s+/).length;
          return this.isValidWordCount(actualWordCount, wordCount);
        });

        if (validNames.length < count) {
          secureLog.warn(`Word count mismatch: requested ${this.formatWordCount(wordCount)} words, got ${names.length - validNames.length} invalid names`);
          names = validNames;
        } else {
          names = validNames;
        }
      }

      // Remove duplicates and take only what we need
      const uniqueNames = [...new Set(names)].slice(0, count);

      if (uniqueNames.length === 0) {
        throw new Error('No valid names parsed from XAI response');
      }

      secureLog.info(`✅ XAI generated ${uniqueNames.length} names: ${uniqueNames.join(', ')}`);
      return uniqueNames;

    } catch (error) {
      secureLog.error('XAI generation error:', error);
      throw error;
    }
  }

  private isValidWordCount(actualCount: number, requestedCount: number | string): boolean {
    if (!requestedCount) return true;
    if (requestedCount === '4+' || requestedCount === 4.1) {
      return actualCount >= 4 && actualCount <= 10;
    }
    return actualCount === Number(requestedCount);
  }

  private getLongerNameExamples(isband: boolean): string {
    if (isband) {
      return `LONGER BAND NAME EXAMPLES (7-10 words):
- "The Wild Feathers and the Stormy Night"
- "Brothers Who Dance with Fire and Stone"
- "Children of the Mountain Valley Below"
- "We Are the Voices from Tomorrow's Dream"`;
    } else {
      return `LONGER SONG NAME EXAMPLES (7-10 words):
- "When the Stars Fall Down from Heaven Above"
- "I Remember the Day We Lost Our Way Home" 
- "Dancing Through the Fields of Golden Summer Light"
- "The Story of How We Found Our Hearts Again"`;
    }
  }

  private generateFallbackNames(type: string, genre?: string, mood?: string, count: number = 4): Array<{name: string, isAiGenerated: boolean, source: string}> {
    // Simple fallback names if APIs fail
    const fallbackNames = [
      'Electric Dreams',
      'Midnight Echo',
      'Golden Hour',
      'Neon Lights'
    ];

    return fallbackNames.slice(0, count).map(name => ({
      name,
      isAiGenerated: false,
      source: 'fallback'
    }));
  }
}
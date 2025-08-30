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
      secureLog.debug(`✅ Context gathered successfully for ${wordCount || 'any'} words`);
      
      // 2. Build structured XAI prompt with word count constraints
      // Generate extra names for "4+" to account for potential filtering
      const generateCount = (wordCount === '4+' || wordCount === 4.1) ? Math.max(count + 4, 8) : count;
      const prompt = this.buildXAIPrompt(context, type, genre, mood, generateCount, wordCount);
      secureLog.debug(`✅ Prompt built successfully for ${wordCount || 'any'} words, length: ${prompt.length}`);
      
      // 3. Generate names using XAI with validation
      secureLog.debug(`🚀 About to call XAI for ${wordCount || 'any'} words`);
      const names = await this.generateWithXAI(prompt, generateCount, wordCount);
      secureLog.debug(`✅ XAI returned ${names.length} names for ${wordCount || 'any'} words`);
      
      // 4. Return only the requested count, taking the best ones first
      const finalNames = names.slice(0, count);
      
      return finalNames.map(name => ({
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
    
    // Apply context improvements: rotation, weighting, and repetition avoidance
    const processedContext = this.processContextForVariety(context, genre);
    
    if (isband) {
      // Creative, humorous band name generation
      return `You are a wildly creative and humorous AI specializing in generating unique, entertaining, and fun band names. Your goal is to craft names that are clever, punny, absurd, or delightfully unexpected, while tying into the specified genre and mood. Ensure all names are original and not direct copies of existing bands—use inspiration from the provided context to remix ideas in fresh ways.

User inputs:
- Genre: ${genre || 'general'} (infuse the names with elements typical of this genre)
- Mood: ${mood || 'neutral'} (make the names evoke this emotion through word choice or imagery)
- Word count: ${this.formatWordCount(wordCount)} (strictly adhere to this)

IMPORTANT: Avoid excessive alliteration! Don't make all words start with the same letter. Mix different sounds for natural, varied names.

AVOID REPETITION: ${this.getRepetitionAvoidanceInstructions(genre)} Don't overuse obvious genre terms like "${this.getCommonGenreTerms(genre).join('", "')}" - use them sparingly if at all.

Context for inspiration (curated selection):
- Similar artists/bands in this genre: ${processedContext.artists} (draw subtle influences like themes, styles, or wordplay from these)
- Creative keywords and trends: ${processedContext.keywords} (remix elements into new, fun twists for band names)
- Word associations: ${processedContext.associations} (use these for creative wordplay)

Task:
1. Brainstorm and generate 8 unique band names that fit the genre, mood, and word count. Make them entertaining—aim for humor, irony, or whimsy.
2. Evaluate the 8 names critically based on these criteria:
   - Originality (not too similar to real bands or the context sources)
   - Entertainment value (how fun, clever, or punny they are)
   - Fit to genre and mood (evokes the right style and emotion)
   - Adherence to word count (exact match to ${this.formatWordCount(wordCount)})
   - Overall appeal (memorable and engaging)
3. Select the top 4 best names from the 8 based on your evaluation.
4. Ensure everything is fun and engaging; avoid anything offensive or bland.

Output in strict JSON format for easy parsing:
{
  "band_names": ["Best Band Name 1", "Best Band Name 2", "Best Band Name 3", "Best Band Name 4"]
}

CRITICAL: Return ONLY the JSON object above, no additional text, explanations, or evaluation details. Just the pure JSON.

Be inventive and let the context spark wild ideas!`;
    } else {
      // Creative, humorous song title generation
      return `You are a wildly creative and humorous AI specializing in generating unique, entertaining, and fun song titles. Your goal is to craft titles that are clever, punny, absurd, or delightfully unexpected, while tying into the specified genre and mood. Ensure all titles are original and not direct copies of existing songs—use inspiration from the provided context to remix ideas in fresh ways.

User inputs:
- Genre: ${genre || 'general'} (infuse the titles with elements typical of this genre)
- Mood: ${mood || 'neutral'} (make the titles evoke this emotion through word choice or imagery)
- Word count: ${this.formatWordCount(wordCount)} (strictly adhere to this)

IMPORTANT: Avoid excessive alliteration! Don't make all words start with the same letter. Mix different sounds for natural, varied titles.

AVOID REPETITION: ${this.getRepetitionAvoidanceInstructions(genre)} Don't overuse obvious genre terms like "${this.getCommonGenreTerms(genre).join('", "')}" - use them sparingly if at all.

Context for inspiration (curated selection):
- Similar artists/bands in this genre: ${processedContext.artists} (draw subtle influences like themes, styles, or wordplay from these)
- Creative keywords and trends: ${processedContext.keywords} (remix elements into new, fun twists for song titles)
- Word associations: ${processedContext.associations} (use these for creative wordplay)

Task:
1. Brainstorm and generate 8 unique song titles that fit the genre, mood, and word count. Make them entertaining—aim for humor, irony, or whimsy.
2. Evaluate the 8 titles critically based on these criteria:
   - Originality (not too similar to real songs or the context sources)
   - Entertainment value (how fun, clever, or punny they are)
   - Fit to genre and mood (evokes the right style and emotion)
   - Adherence to word count (exact match to ${this.formatWordCount(wordCount)})
   - Overall appeal (memorable and engaging, as if from a hit album)
3. Select the top 4 best titles from the 8 based on your evaluation.
4. Ensure everything is fun and engaging; avoid anything offensive or bland.

Output in strict JSON format for easy parsing:
{
  "song_titles": ["Best Song Title 1", "Best Song Title 2", "Best Song Title 3", "Best Song Title 4"]
}

CRITICAL: Return ONLY the JSON object above, no additional text, explanations, or evaluation details. Just the pure JSON.

Be inventive and let the context spark wild ideas!`;
    }
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
    return `Each name should be ${wordCount} words (count carefully, aim for exactly ${wordCount} words)`;
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
      classical: ['orchestral arrangements', 'composed structure', 'formal precision', 'timeless elegance'],
      'jam band': ['improvisation', 'extended jams', 'psychedelic elements', 'festival culture']
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
      secureLog.info(`📝 FULL XAI PROMPT FOR ${wordCount || 'any'} WORDS:\n${prompt}\n--- END PROMPT ---`);
      const response = await this.openai.chat.completions.create({
        model: "grok-3",
        messages: [{ role: "user", content: prompt }],
        temperature: 1.1, // Higher creativity for longer names
        max_tokens: 300 // More space for longer names
      });

      const content = response.choices[0].message.content?.trim();
      secureLog.debug(`Raw XAI response: "${content}"`);
      
      if (!content) {
        throw new Error('No content generated by XAI');
      }

      // Parse the response - handle JSON format for bands, line format for songs
      let names: string[] = [];
      
      // Check if this is JSON format (bands or songs)
      if (content.includes('"band_names"') || content.includes('"song_titles"')) {
        try {
          // Find the JSON object more robustly
          let jsonContent = content;
          
          // Try to extract just the JSON part if there's extra text
          const jsonStart = content.indexOf('{');
          const jsonEnd = content.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            jsonContent = content.substring(jsonStart, jsonEnd + 1);
          }
          
          const parsed = JSON.parse(jsonContent);
          if (parsed.band_names && Array.isArray(parsed.band_names)) {
            names = parsed.band_names.map((name: string) => name.trim());
            secureLog.debug(`Parsed ${names.length} band names from JSON: ${names.join(', ')}`);
          } else if (parsed.song_titles && Array.isArray(parsed.song_titles)) {
            names = parsed.song_titles.map((name: string) => name.trim());
            secureLog.debug(`Parsed ${names.length} song titles from JSON: ${names.join(', ')}`);
          }
        } catch (error) {
          secureLog.debug(`Failed to parse JSON (${error instanceof Error ? error.message : 'Unknown error'}), falling back to line parsing`);
        }
      }
      
      // Fallback to line-by-line parsing for songs or failed JSON
      if (names.length === 0) {
        names = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.match(/^\d+\./) && line.length < 150) // Allow longer names
          .map(line => line.replace(/^[-•]\s*/, '')) // Remove bullet points
          .filter(line => line.length > 0);
        
        secureLog.debug(`Parsed ${names.length} names from line format: ${names.join(', ')}`);
      }

      // Word count validation if specified
      if (wordCount) {
        secureLog.debug(`Generated names before filtering: ${names.join(', ')}`);
        
        const validNames = names.filter(name => {
          const actualWordCount = name.split(/\s+/).length;
          const isValid = this.isValidWordCount(actualWordCount, wordCount);
          secureLog.debug(`Name "${name}" has ${actualWordCount} words, valid: ${isValid}`);
          return isValid;
        });

        if (validNames.length < count) {
          secureLog.warn(`Word count mismatch: requested ${this.formatWordCount(wordCount)} words, got ${names.length - validNames.length} invalid names`);
          
          // For "4+" generation, try to salvage results by being more lenient
          if (wordCount === '4+' || wordCount === 4.1) {
            // Include names that are close to the range (3-11 words instead of strict 4-10)
            const lenientNames = names.filter(name => {
              const actualWordCount = name.split(/\s+/).length;
              return actualWordCount >= 3 && actualWordCount <= 11;
            });
            
            if (lenientNames.length >= count) {
              names = lenientNames.slice(0, count);
            } else if (lenientNames.length > validNames.length) {
              names = lenientNames;
            } else {
              names = validNames;
            }
          } else {
            // For exact word counts, be more lenient if we have no valid names
            if (validNames.length === 0) {
              secureLog.warn(`No exact matches for ${wordCount} words, using all generated names`);
              names = names.slice(0, count); // Use all names regardless of word count
            } else {
              names = validNames;
            }
          }
        } else {
          names = validNames;
        }
      }

      // Remove duplicates and take only what we need
      const uniqueNames = [...new Set(names)].slice(0, count);

      if (uniqueNames.length === 0) {
        throw new Error('No valid names parsed from XAI response');
      }

      // If we didn't get enough names, try a quick retry with a simpler prompt
      if (uniqueNames.length < count) {
        secureLog.warn(`Only got ${uniqueNames.length} names instead of ${count}, attempting quick retry...`);
        try {
          const retryPrompt = `Generate ${count - uniqueNames.length} more ${prompt.includes('band_names') ? 'band names' : 'song titles'} in the same style. Return only JSON format: ${prompt.includes('band_names') ? '{"band_names": ["Name1", "Name2"]}' : '{"song_titles": ["Title1", "Title2"]}'}`;
          
          const retryResponse = await this.openai.chat.completions.create({
            model: "grok-3",
            messages: [{ role: "user", content: retryPrompt }],
            temperature: 0.9,
            max_tokens: 150
          });

          const retryContent = retryResponse.choices[0].message.content?.trim();
          if (retryContent) {
            try {
              const parsed = JSON.parse(retryContent);
              const additionalNames = (parsed.band_names || parsed.song_titles || []).map((name: string) => name.trim());
              
              if (additionalNames.length > 0) {
                uniqueNames.push(...additionalNames.slice(0, count - uniqueNames.length));
                secureLog.info(`✅ Retry successful, added ${additionalNames.length} more names`);
              }
            } catch (retryError) {
              secureLog.debug('Retry parsing failed, using fallback names');
            }
          }
        } catch (retryError) {
          secureLog.debug('Retry request failed, using fallback names');
        }
      }

      // Final fallback: if we still don't have enough, add simple fallback names
      if (uniqueNames.length < count) {
        const neededCount = count - uniqueNames.length;
        const fallbackNames = [
          'Midnight Echo', 'Golden Hour', 'Electric Dreams', 'Silver Rain',
          'Cosmic Light', 'Rising Storm', 'Ocean Waves', 'Mountain Peaks'
        ];
        
        for (let i = 0; i < neededCount && i < fallbackNames.length; i++) {
          if (!uniqueNames.includes(fallbackNames[i])) {
            uniqueNames.push(fallbackNames[i]);
          }
        }
        
        secureLog.info(`Added ${neededCount} fallback names to reach ${count} total`);
      }

      secureLog.info(`✅ XAI returned ${uniqueNames.length} names for ${wordCount || 'any'} words`);
      return uniqueNames.slice(0, count); // Ensure we don't exceed the requested count

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
    
    const targetCount = Number(requestedCount);
    // Be more lenient for exact word counts (allow ±1 word difference for small counts, ±2 for larger)
    // This prevents all names from being filtered out due to minor parsing differences
    const tolerance = targetCount <= 3 ? 1 : 2;
    return Math.abs(actualCount - targetCount) <= tolerance;
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

  private processContextForVariety(context: GenerationContext, genre?: string): {artists: string, keywords: string, associations: string} {
    // Shuffle and limit context to reduce repetition
    const shuffleArray = <T>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Weight context terms - deprioritize overly common genre terms
    const allKeywords = [...context.genreKeywords, ...context.genreTags, ...context.moodWords];
    const commonTerms = this.getCommonGenreTerms(genre);
    
    // Separate common from unique terms
    const uniqueTerms = allKeywords.filter(term => !commonTerms.includes(term.toLowerCase()));
    const someCommonTerms = shuffleArray(allKeywords.filter(term => commonTerms.includes(term.toLowerCase()))).slice(0, 2);
    
    // Prioritize unique terms, add only a few common ones
    const weightedKeywords = [...shuffleArray(uniqueTerms).slice(0, 8), ...someCommonTerms];
    
    return {
      artists: shuffleArray(context.relatedArtists).slice(0, 4).join(', '),
      keywords: shuffleArray(weightedKeywords).slice(0, 10).join(', '),
      associations: shuffleArray(context.wordAssociations).slice(0, 6).join(', ')
    };
  }

  private getRepetitionAvoidanceInstructions(genre?: string): string {
    const genreSpecific: { [key: string]: string } = {
      blues: "Avoid overusing 'delta', 'mississippi', 'soul' repeatedly.",
      rock: "Don't repeatedly use 'electric', 'thunder', 'metal'.",
      jazz: "Avoid constantly using 'swing', 'bebop', 'smooth'.",
      country: "Don't overuse 'nashville', 'honky', 'barn' in every name.",
      folk: "Avoid repetitive use of 'acoustic', 'roots', 'mountain'.",
      indie: "Don't constantly use 'alternative', 'underground', 'indie'."
    };
    
    return genreSpecific[genre || ''] || "Avoid repetitive use of the most obvious genre keywords.";
  }

  private getCommonGenreTerms(genre?: string): string[] {
    const commonTerms: { [key: string]: string[] } = {
      blues: ['delta', 'mississippi', 'soul', 'deep', 'raw', 'authentic'],
      rock: ['electric', 'thunder', 'metal', 'heavy', 'hard', 'wild'],
      jazz: ['swing', 'bebop', 'smooth', 'cool', 'hot', 'blue'],
      country: ['nashville', 'honky', 'barn', 'whiskey', 'highway', 'southern'],
      folk: ['acoustic', 'roots', 'mountain', 'traditional', 'american', 'old'],
      indie: ['alternative', 'underground', 'indie', 'hipster', 'cool', 'artsy'],
      pop: ['radio', 'hit', 'chart', 'mainstream', 'catchy', 'commercial'],
      hip_hop: ['urban', 'street', 'flow', 'beat', 'rap', 'hood'],
      electronic: ['digital', 'synth', 'electronic', 'techno', 'beat', 'dance']
    };
    
    return commonTerms[genre || ''] || [];
  }
}
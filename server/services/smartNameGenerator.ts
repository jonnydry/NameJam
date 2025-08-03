/**
 * Smart Name Generator - Genre-first approach with natural language patterns
 * Based on analysis of real successful band/song names
 */

import type { GenerateNameRequest } from "@shared/schema";
import { secureLog } from "../utils/secureLogger";

interface GenreConfig {
  bandPatterns: Array<() => string>;
  songPatterns: Array<() => string>;
  vocabulary: {
    adjectives: string[];
    nouns: string[];
    verbs: string[];
    connectors: string[];
    modifiers: string[];
  };
  mood: {
    [key: string]: {
      adjectives: string[];
      verbs: string[];
      modifiers: string[];
    };
  };
}

export class SmartNameGeneratorService {
  private genreConfigs: { [key: string]: GenreConfig } = {
    rock: {
      bandPatterns: [
        () => this.thePattern('rock'),
        () => this.singleWord('rock'),
        () => this.colorNoun('rock'),
        () => this.animalName('rock'),
        () => this.compoundWord('rock')
      ],
      songPatterns: [
        () => this.simpleStatement('rock'),
        () => this.commandForm('rock'),
        () => this.questionForm('rock'),
        () => this.feelingPhrase('rock')
      ],
      vocabulary: {
        adjectives: ['wild', 'electric', 'burning', 'loud', 'raw', 'heavy', 'blazing', 'raging'],
        nouns: ['thunder', 'lightning', 'fire', 'steel', 'iron', 'stone', 'storm', 'rebel'],
        verbs: ['rock', 'roll', 'burn', 'blaze', 'thunder', 'rage', 'roar', 'shake'],
        connectors: ['and', 'of', 'in', 'through'],
        modifiers: ['tonight', 'forever', 'again', 'away', 'hard', 'loud']
      },
      mood: {
        energetic: {
          adjectives: ['electric', 'blazing', 'wild', 'explosive'],
          verbs: ['ignite', 'explode', 'thunder', 'roar'],
          modifiers: ['tonight', 'now', 'loud', 'hard']
        },
        dark: {
          adjectives: ['black', 'shadow', 'burning', 'raging'],
          verbs: ['burn', 'rage', 'storm', 'break'],
          modifiers: ['forever', 'deep', 'away', 'down']
        }
      }
    },
    
    pop: {
      bandPatterns: [
        () => this.singleWord('pop'),
        () => this.colorNoun('pop'),
        () => this.numberName('pop'),
        () => this.thePattern('pop')
      ],
      songPatterns: [
        () => this.loveStatement('pop'),
        () => this.feelingPhrase('pop'),
        () => this.simpleStatement('pop'),
        () => this.timePhrase('pop')
      ],
      vocabulary: {
        adjectives: ['bright', 'sweet', 'perfect', 'beautiful', 'shining', 'golden', 'pure', 'amazing'],
        nouns: ['heart', 'love', 'dream', 'star', 'light', 'heaven', 'angel', 'rainbow'],
        verbs: ['love', 'shine', 'dance', 'sing', 'dream', 'fly', 'glow', 'sparkle'],
        connectors: ['and', 'of', 'in', 'with'],
        modifiers: ['tonight', 'forever', 'again', 'together', 'always', 'now']
      },
      mood: {
        happy: {
          adjectives: ['bright', 'shining', 'golden', 'sweet'],
          verbs: ['dance', 'sing', 'shine', 'sparkle'],
          modifiers: ['tonight', 'together', 'always', 'now']
        },
        romantic: {
          adjectives: ['beautiful', 'perfect', 'sweet', 'golden'],
          verbs: ['love', 'dream', 'glow', 'shine'],
          modifiers: ['forever', 'always', 'together', 'tonight']
        }
      }
    },

    indie: {
      bandPatterns: [
        () => this.animalName('indie'),
        () => this.thePattern('indie'),
        () => this.compoundWord('indie'),
        () => this.ironic('indie')
      ],
      songPatterns: [
        () => this.nostalgicPhrase('indie'),
        () => this.conversationalTitle('indie'),
        () => this.metaphoricalPhrase('indie'),
        () => this.introspectiveStatement('indie')
      ],
      vocabulary: {
        adjectives: ['vintage', 'faded', 'honest', 'quiet', 'gentle', 'indie', 'velvet', 'golden'],
        nouns: ['fox', 'wolf', 'deer', 'ocean', 'mountain', 'forest', 'garden', 'library'],
        verbs: ['remember', 'forget', 'whisper', 'drift', 'wander', 'discover', 'wonder', 'hope'],
        connectors: ['and', 'of', 'in', 'through', 'with'],
        modifiers: ['softly', 'slowly', 'gently', 'quietly', 'deeply', 'carefully']
      },
      mood: {
        melancholy: {
          adjectives: ['faded', 'quiet', 'gentle', 'soft'],
          verbs: ['remember', 'forget', 'drift', 'fade'],
          modifiers: ['softly', 'slowly', 'quietly', 'away']
        },
        dreamy: {
          adjectives: ['golden', 'velvet', 'gentle', 'soft'],
          verbs: ['dream', 'drift', 'float', 'wonder'],
          modifiers: ['softly', 'gently', 'slowly', 'peacefully']
        }
      }
    }
  };

  async generateNames(request: GenerateNameRequest): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { type, genre = 'general', mood, count = 4 } = request;
    
    secureLog.info(`🎯 Smart generation: ${count} ${type} names for ${genre} genre, ${mood || 'neutral'} mood`);
    
    const results: Array<{name: string, isAiGenerated: boolean, source: string}> = [];
    const usedNames = new Set<string>();
    
    // Get genre config or fallback to general
    const config = this.genreConfigs[genre] || this.createGeneralConfig();
    const patterns = type === 'band' ? config.bandPatterns : config.songPatterns;
    
    // Generate names using genre-specific patterns
    let attempts = 0;
    while (results.length < count && attempts < count * 5) {
      attempts++;
      
      try {
        // Select pattern based on mood if available
        const pattern = this.selectPatternByMood(patterns, config, mood);
        const name = pattern();
        
        // Ensure uniqueness
        if (!usedNames.has(name.toLowerCase())) {
          usedNames.add(name.toLowerCase());
          results.push({
            name,
            isAiGenerated: false,
            source: 'smart'
          });
        }
      } catch (error) {
        secureLog.debug('Pattern generation error:', error);
      }
    }
    
    secureLog.info(`✅ Generated ${results.length} smart names`);
    return results;
  }

  private selectPatternByMood(patterns: Array<() => string>, config: GenreConfig, mood?: string): () => string {
    // If no mood specified, use random pattern
    if (!mood || !config.mood[mood]) {
      return patterns[Math.floor(Math.random() * patterns.length)];
    }
    
    // Weight patterns based on mood appropriateness
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  // Classic "The [Adjective] [Noun]" pattern - most successful band name format
  private thePattern(genre: string): string {
    const config = this.genreConfigs[genre];
    const adj = this.getRandomWord(config.vocabulary.adjectives);
    const noun = this.getRandomWord(config.vocabulary.nouns);
    return `The ${this.capitalize(adj)} ${this.capitalize(this.pluralize(noun))}`;
  }

  // Single memorable word
  private singleWord(genre: string): string {
    const config = this.genreConfigs[genre];
    const words = [...config.vocabulary.nouns, ...config.vocabulary.adjectives];
    return this.capitalize(this.getRandomWord(words));
  }

  // Color + Noun (Black Keys, White Stripes, Red Hot Chili Peppers)
  private colorNoun(genre: string): string {
    const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Silver', 'Golden'];
    const config = this.genreConfigs[genre];
    const color = this.getRandomWord(colors);
    const noun = this.getRandomWord(config.vocabulary.nouns);
    return `${color} ${this.capitalize(this.pluralize(noun))}`;
  }

  // Animal names (very popular in indie)
  private animalName(genre: string): string {
    const animals = ['Fox', 'Wolf', 'Bear', 'Deer', 'Eagle', 'Tiger', 'Lion', 'Hawk'];
    const config = this.genreConfigs[genre];
    
    if (Math.random() > 0.5) {
      // Single animal
      return this.getRandomWord(animals);
    } else {
      // Adjective + Animal
      const adj = this.getRandomWord(config.vocabulary.adjectives);
      const animal = this.getRandomWord(animals);
      return `${this.capitalize(adj)} ${animal}`;
    }
  }

  // Compound word creation
  private compoundWord(genre: string): string {
    const config = this.genreConfigs[genre];
    const word1 = this.getRandomWord([...config.vocabulary.nouns, ...config.vocabulary.adjectives]);
    const word2 = this.getRandomWord(config.vocabulary.nouns);
    return this.capitalize(word1) + this.capitalize(word2);
  }

  // Number in name (very successful pattern)
  private numberName(genre: string): string {
    const numbers = ['One', 'Two', 'Three', 'Five', 'Seven', 'Twenty', '21', '182'];
    const config = this.genreConfigs[genre];
    const number = this.getRandomWord(numbers);
    const noun = this.getRandomWord(config.vocabulary.nouns);
    return `${number} ${this.capitalize(this.pluralize(noun))}`;
  }

  // Ironic/unexpected combinations (indie specialty)
  private ironic(genre: string): string {
    const mundane = ['Office', 'Kitchen', 'Parking', 'Library', 'Grocery', 'Laundry'];
    const epic = ['Warriors', 'Heroes', 'Legends', 'Champions', 'Masters', 'Kings'];
    const mundaneWord = this.getRandomWord(mundane);
    const epicWord = this.getRandomWord(epic);
    return `${mundaneWord} ${epicWord}`;
  }

  // Simple statement (most successful song pattern)
  private simpleStatement(genre: string): string {
    const config = this.genreConfigs[genre];
    const subjects = ['I', 'We', 'You', 'They'];
    const subject = this.getRandomWord(subjects);
    const verb = this.getRandomWord(config.vocabulary.verbs);
    const modifier = this.getRandomWord(config.vocabulary.modifiers);
    return `${subject} ${this.capitalize(verb)} ${this.capitalize(modifier)}`;
  }

  // Command form (Don't Stop, Let It Be)
  private commandForm(genre: string): string {
    const config = this.genreConfigs[genre];
    const negatives = ['Don\'t', 'Never', 'Can\'t'];
    const positives = ['Let', 'Make', 'Keep'];
    const commands = Math.random() > 0.5 ? negatives : positives;
    const command = this.getRandomWord(commands);
    const verb = this.getRandomWord(config.vocabulary.verbs);
    const object = this.getRandomWord([...config.vocabulary.nouns, ...config.vocabulary.modifiers]);
    return `${command} ${this.capitalize(verb)} ${this.capitalize(object)}`;
  }

  // Question form
  private questionForm(genre: string): string {
    const config = this.genreConfigs[genre];
    const questions = ['How', 'What', 'Where', 'When', 'Why'];
    const question = this.getRandomWord(questions);
    const verb = this.getRandomWord(config.vocabulary.verbs);
    const noun = this.getRandomWord(config.vocabulary.nouns);
    return `${question} Do ${this.capitalize(noun)} ${this.capitalize(verb)}?`;
  }

  // Love/relationship statements (pop specialty)
  private loveStatement(genre: string): string {
    const starters = ['I Love', 'You Are', 'We Are', 'I Need'];
    const starter = this.getRandomWord(starters);
    const config = this.genreConfigs[genre];
    const noun = this.getRandomWord(config.vocabulary.nouns);
    return `${starter} ${this.capitalize(noun)}`;
  }

  // Feeling phrase
  private feelingPhrase(genre: string): string {
    const config = this.genreConfigs[genre];
    const feelings = ['Feel', 'Know', 'See', 'Hear'];
    const feeling = this.getRandomWord(feelings);
    const adj = this.getRandomWord(config.vocabulary.adjectives);
    const noun = this.getRandomWord(config.vocabulary.nouns);
    return `${feeling} ${this.capitalize(adj)} ${this.capitalize(noun)}`;
  }

  // Time-based phrase
  private timePhrase(genre: string): string {
    const times = ['Tonight', 'Yesterday', 'Tomorrow', 'Forever', 'Now'];
    const time = this.getRandomWord(times);
    const config = this.genreConfigs[genre];
    const verb = this.getRandomWord(config.vocabulary.verbs);
    return `${time} ${this.capitalize(verb)}`;
  }

  // Nostalgic phrase (indie)
  private nostalgicPhrase(genre: string): string {
    const starters = ['Remember', 'Back to', 'Those', 'Old'];
    const starter = this.getRandomWord(starters);
    const config = this.genreConfigs[genre];
    const noun = this.getRandomWord(config.vocabulary.nouns);
    return `${starter} ${this.capitalize(noun)}`;
  }

  // Conversational title (indie)
  private conversationalTitle(genre: string): string {
    const starters = ['Hey', 'Oh', 'Well', 'So'];
    const starter = this.getRandomWord(starters);
    const config = this.genreConfigs[genre];
    const noun = this.getRandomWord(config.vocabulary.nouns);
    return `${starter}, ${this.capitalize(noun)}`;
  }

  // Metaphorical phrase
  private metaphoricalPhrase(genre: string): string {
    const config = this.genreConfigs[genre];
    const noun1 = this.getRandomWord(config.vocabulary.nouns);
    const connector = this.getRandomWord(['Like', 'As', 'Through']);
    const noun2 = this.getRandomWord(config.vocabulary.nouns);
    return `${this.capitalize(noun1)} ${connector} ${this.capitalize(noun2)}`;
  }

  // Introspective statement
  private introspectiveStatement(genre: string): string {
    const starters = ['Maybe', 'Sometimes', 'Always', 'Never'];
    const starter = this.getRandomWord(starters);
    const config = this.genreConfigs[genre];
    const verb = this.getRandomWord(config.vocabulary.verbs);
    return `${starter} ${this.capitalize(verb)}`;
  }

  private createGeneralConfig(): GenreConfig {
    return {
      bandPatterns: [
        () => this.thePattern('rock'),
        () => this.singleWord('pop'),
        () => this.colorNoun('rock')
      ],
      songPatterns: [
        () => this.simpleStatement('pop'),
        () => this.feelingPhrase('rock')
      ],
      vocabulary: {
        adjectives: ['new', 'wild', 'bright', 'dark', 'electric', 'golden'],
        nouns: ['heart', 'dream', 'fire', 'star', 'storm', 'light'],
        verbs: ['love', 'dream', 'rock', 'shine', 'burn', 'fly'],
        connectors: ['and', 'of', 'in'],
        modifiers: ['tonight', 'forever', 'now', 'away']
      },
      mood: {}
    };
  }

  private getRandomWord(words: string[]): string {
    return words[Math.floor(Math.random() * words.length)];
  }

  private capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  private pluralize(word: string): string {
    if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch')) {
      return word + 'es';
    }
    if (word.endsWith('y')) {
      return word.slice(0, -1) + 'ies';
    }
    return word + 's';
  }
}
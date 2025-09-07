import { secureLog } from '../../utils/secureLogger';
import {
  FORMATIONS,
  BAND_MEMBERS,
  STORIES,
  FUN_FACTS,
  INFLUENCES,
  TRADITIONS,
  FALLBACK_CONFIG
} from './bandBioConfig';
import {
  getRandomElement,
  getRandomElements,
  selectRandomMembers,
  getBandType,
  formatMembers,
  getRandomTrait,
  getRandomAchievement,
  getRandomItem,
  getRandomLanguageStyle,
  getRandomLocation,
  getRandomYear,
  getRandomMemberCount
} from './bandBioUtils';

export class FallbackBioGenerator {
  
  generateFallbackBio(bandName: string, genre?: string, mood?: string): string {
    const genreText = genre || 'rock';
    const moodText = mood || 'energetic';
    const year = getRandomYear();
    
    // Select structure type for variety
    const structureGenerators = [
      () => this.generateTraditionalStructure(bandName, genreText, moodText, year),
      () => this.generateStoryFirstStructure(bandName, genreText, moodText, year),
      () => this.generateCharacterFocusedStructure(bandName, genreText, moodText, year)
    ];
    
    const structureIndex = Math.floor(Math.random() * structureGenerators.length);
    secureLog.info(`Using fallback bio structure ${structureIndex + 1} of ${structureGenerators.length}`);
    
    return structureGenerators[structureIndex]();
  }

  private generateTraditionalStructure(
    bandName: string,
    genre: string,
    mood: string,
    year: number
  ): string {
    const memberCount = getRandomMemberCount();
    const selectedMembers = selectRandomMembers(BAND_MEMBERS, memberCount);
    
    // Use indices for logging variety
    const formationIdx = Math.floor(Math.random() * FORMATIONS.length);
    const storyIdx = Math.floor(Math.random() * STORIES.length);
    const funFactIdx = Math.floor(Math.random() * FUN_FACTS.length);
    
    const formation = FORMATIONS[formationIdx];
    const story = STORIES[storyIdx];
    const funFact = FUN_FACTS[funFactIdx];
    
    secureLog.info(`Using indices: formation=${formationIdx}, story=${storyIdx}, funFact=${funFactIdx}`);
    
    const secondParagraphs = [
      `Known for their ${mood} sound that blends ${genre} with unexpected elements, ${bandName} has carved out a unique niche in the music scene.`,
      `With their signature ${mood} approach to ${genre}, ${bandName} quickly gained a reputation for their unpredictable live performances.`,
      `Combining ${mood} energy with raw ${genre} power, ${bandName} refuses to be categorized by industry standards.`,
      `Their ${mood} take on ${genre} has earned ${bandName} a devoted following among those who crave something different.`,
      `Blending ${mood} vibes with classic ${genre} roots, ${bandName} creates music that defies expectations.`
    ];
    
    const secondPara = getRandomElement(secondParagraphs);
    
    return `${bandName} formed in ${year} when ${selectedMembers.length} musicians ${formation}. The ${genre} ${getBandType(selectedMembers.length)} consists of ${formatMembers(selectedMembers)}.

${secondPara} ${story}

Fun fact: ${funFact}`;
  }

  private generateStoryFirstStructure(
    bandName: string,
    genre: string,
    mood: string,
    year: number
  ): string {
    const memberCount = getRandomMemberCount();
    const selectedMembers = selectRandomMembers(BAND_MEMBERS, memberCount);
    const story = getRandomElement(STORIES);
    const influence = getRandomElement(INFLUENCES);
    const tradition = getRandomElement(TRADITIONS);
    
    return `The legend of ${bandName} began with an incident that shook the ${genre} world: ${story} This ${mood} ${getBandType(selectedMembers.length)} features ${formatMembers(selectedMembers)}.

Drawing inspiration from ${influence}, ${bandName} creates a sound that defies categorization. Since forming in ${year}, they've maintained a tradition of ${tradition}.

Industry insiders say their success comes from their unique rehearsal space: a converted ${getRandomLocation()}.`;
  }

  private generateCharacterFocusedStructure(
    bandName: string,
    genre: string,
    mood: string,
    year: number
  ): string {
    const selectedMembers = selectRandomMembers(BAND_MEMBERS, 4);
    const formation = getRandomElement(FORMATIONS);
    const funFact = getRandomElement(FUN_FACTS);
    
    return `Meet ${bandName}: ${selectedMembers[0][0]} (${selectedMembers[0][1]}) is the ${getRandomTrait()} one. ${selectedMembers[1][0]} (${selectedMembers[1][1]}) once ${getRandomAchievement()}. ${selectedMembers[2][0]} (${selectedMembers[2][1]}) refuses to play without their lucky ${getRandomItem()}. And ${selectedMembers[3][0]} (${selectedMembers[3][1]}) speaks only in ${getRandomLanguageStyle()}.

This ${mood} ${genre} quartet ${formation} in ${year} and haven't looked back since. ${funFact}`;
  }
}
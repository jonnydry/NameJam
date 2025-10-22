import { 
  JournalisticStyle, 
  BandBioPrompt, 
  UNIQUE_ELEMENTS, 
  JOURNALISTIC_STYLES, 
  BAND_BIO_CONFIG,
  BAND_MEMBERS,
  FORMATIONS,
  STORIES,
  FUN_FACTS,
  INFLUENCES,
  TRADITIONS,
  RANDOM_TRAITS,
  RANDOM_ACHIEVEMENTS,
  RANDOM_ITEMS,
  RANDOM_LANGUAGE_STYLES,
  RANDOM_LOCATIONS,
  FALLBACK_CONFIG
} from './bandBioConfig';

// Utility functions for random selection
export function getRandomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function getRandomElements<T>(array: readonly T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Dynamic humor system for varied results
const humorProfiles = {
  comedicVoice: [
    { name: 'snarky-observer', weight: 1.0, description: 'Witty commentary on music industry absurdities' },
    { name: 'self-deprecating', weight: 0.9, description: 'Bands poking fun at their own ridiculousness' },
    { name: 'deadpan-absurdist', weight: 1.1, description: 'Straight-faced delivery of insane situations' },
    { name: 'hyperbolic-enthusiast', weight: 0.8, description: 'Comically exaggerated band mythology' }
  ],
  targetFocus: [
    { name: 'institutional-roast', weight: 1.0, description: 'Mocking music industry norms and clichés' },
    { name: 'personal-flaws', weight: 1.2, description: 'Highlighting embarrassing member quirks' },
    { name: 'industry-satire', weight: 0.9, description: 'Poking fun at record labels and venues' },
    { name: 'origin-myth-busting', weight: 1.0, description: 'Undercutting rock-star origin stories' }
  ],
  timingStyle: [
    { name: 'tight-punchy', weight: 1.0, description: 'Quick wit, rapid fire punchlines' },
    { name: 'meandering-ramble', weight: 0.8, description: 'Building to absurd conclusions' },
    { name: 'non-sequitur', weight: 1.1, description: 'Unexpected turns and juxtapositions' },
    { name: 'circular-logic', weight: 0.9, description: 'Ridiculous situations spiraling outward' }
  ]
};

export function generateDynamicHumorStyle(): { voice: string; focus: string; timing: string; description: string } {
  const voice = getWeightedRandomElement(humorProfiles.comedicVoice);
  const focus = getWeightedRandomElement(humorProfiles.targetFocus);
  const timing = getWeightedRandomElement(humorProfiles.timingStyle);

  return {
    voice: voice.name,
    focus: focus.name,
    timing: timing.name,
    description: `${voice.description}, ${focus.description}, with ${timing.description}`
  };
}

function getWeightedRandomElement<T extends { weight: number }>(array: readonly T[]): T {
  const totalWeight = array.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of array) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }

  return array[array.length - 1]; // Fallback
}

// Style selection utilities
export function selectJournalisticStyle(): JournalisticStyle {
  return getRandomElement(JOURNALISTIC_STYLES);
}

export function shouldUseJournalisticStyle(): boolean {
  return Math.random() < BAND_BIO_CONFIG.JOURNALISTIC_STYLE_PROBABILITY;
}

// Prompt building utilities
export function createJournalisticPrompt(
  bandName: string,
  genre: string,
  mood: string,
  style: JournalisticStyle,
  timestamp: number
): BandBioPrompt {
  const randomElement = getRandomElement(UNIQUE_ELEMENTS);
  const dynamicStyle = generateDynamicHumorStyle(); // NEW: Dynamic humor system

  return {
    task: "Generate a consistently varied and high-quality fictional band biography",
    band_info: {
      name: bandName,
      genre: genre,
      mood: mood
    },
    style_requirements: {
      journalistic_style: style.name,
      style_instruction: style.instruction,
      tone: "Wickedly funny, entertaining, witty, and absurd",
      must_avoid: ["Generic band bio clichés", "Boring factual information", "Serious or respectful tone"],
      must_include: ["Outrageous origin story", "Embarrassing moments", "Ridiculous band member quirks", "Absurd traditions or rituals"]
    },
    humor_profile: {  // NEW: Dynamic humor profile for variety
      voice: dynamicStyle.voice,
      focus: dynamicStyle.focus,
      timing: dynamicStyle.timing,
      adaptive_description: dynamicStyle.description
    },
    story_elements: {
      catalyst_event: randomElement,
      required_themes: ["Dysfunction", "Poor life choices", "Embarrassing failures", "Absurd situations"],
      humor_style: "Sharp wit, clever wordplay, unexpected twists, satirical observations"
    },
    format: {
      max_words: BAND_BIO_CONFIG.MAX_WORDS,
      structure: "Narrative biography with punchy sentences",
      emphasis: "Entertainment value over accuracy"
    },
    quality_guarantees: [
      "Each biography must contain at least 3 distinct humorous elements",
      "Humor should escalate from plausible to absurd rather than staying flat",
      "Include specific, memorable details that make the story unique",
      "End with a twist or punchline that surprises the reader"
    ],
    unique_id: timestamp
  };
}

export function createEdgyPrompt(
  bandName: string,
  genre: string,
  mood: string,
  timestamp: number
): BandBioPrompt {
  const randomElement = getRandomElement(UNIQUE_ELEMENTS);
  
  return {
    task: "Generate an edgy, brutally honest band biography",
    band_info: {
      name: bandName,
      genre: genre,
      mood: mood
    },
    style_requirements: {
      tone: "Savage, irreverent, darkly humorous, brutally honest",
      approach: "Roast comedy meets music journalism",
      voice: "Sarcastic music journalist with zero filter",
      must_include: ["Failed relationships", "Poor decisions", "Embarrassing moments", "Dysfunctional dynamics"],
      must_avoid: ["Sanitized industry speak", "Feel-good narratives", "Respectful tone", "Generic band bio templates"]
    },
    story_elements: {
      catalyst_event: randomElement,
      themes: ["Chaos", "Bad judgment", "Public humiliation", "Personal failures"],
      humor_type: "Dark, edgy, uncomfortable truths, savage observations"
    },
    format: {
      max_words: BAND_BIO_CONFIG.MAX_WORDS,
      style: "Exposé format with cutting commentary"
    },
    unique_id: timestamp
  };
}

export function buildPromptString(jsonPrompt: BandBioPrompt, isJournalistic: boolean): string {
  const promptType = isJournalistic ? "Based on these requirements, write a hilarious band biography" : "DARK COMEDY BRIEF";
  const instruction = isJournalistic 
    ? "IMPORTANT: Generate ONLY the biography text itself, not the JSON structure. Write the actual funny biography story in the requested style!"
    : "Write ONLY the biography text based on these requirements. Be RUTHLESS and savagely funny!";
    
  return `${promptType}:\n\n${JSON.stringify(jsonPrompt, null, 2)}\n\n${instruction}`;
}

// System prompt utilities
export function getSystemPrompt(style?: JournalisticStyle): string {
  if (style) {
    return style.systemPrompt;
  }
  
  return "You are a sarcastic music journalist with zero filter and a dark sense of humor. Write band biographies that are brutally honest, wickedly funny, and unapologetically edgy. Think 'roast comedy meets music journalism.' Expose the messy reality behind the facade - failed relationships, poor decisions, embarrassing moments, and dysfunctional dynamics. Be sharp, irreverent, and savagely entertaining while staying clever rather than crude. No sanitized industry speak allowed.";
}

// Request parameter building
export function buildRequestParams(systemPrompt: string, prompt: string): any {
  return {
    model: BAND_BIO_CONFIG.MODEL,
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user", 
        content: prompt
      }
    ],
    max_tokens: BAND_BIO_CONFIG.MAX_TOKENS,
    temperature: BAND_BIO_CONFIG.TEMPERATURE
    // Removed top_p, frequency_penalty, presence_penalty as grok-4-fast doesn't support them
  };
}

// Response parsing utilities
export function parseAIResponse(content: string): string {
  let bioText = content.trim();
  
  try {
    const parsed = JSON.parse(content);
    
    // Check if this looks like the prompt structure being returned
    if (parsed.task && parsed.band_info && parsed.style_requirements) {
      throw new Error('Invalid response format - prompt structure returned');
    }
    
    // Extract biography text from various possible formats
    if (parsed.biography?.text) {
      bioText = parsed.biography.text;
    } else if (parsed.bio) {
      bioText = parsed.bio;
    } else if (parsed.text) {
      bioText = parsed.text;
    } else if (typeof parsed === 'string') {
      bioText = parsed;
    }
  } catch (e) {
    // Not JSON or parse error, use the content as-is
  }
  
  return bioText;
}

// Input validation utilities
export function validateAndNormalize(bandName: string, genre?: string, mood?: string): {
  bandName: string;
  genre: string;
  mood: string;
} {
  if (!bandName || bandName.trim().length === 0) {
    throw new Error('Band name is required');
  }
  
  if (bandName.length > 100) {
    throw new Error('Band name is too long (max 100 characters)');
  }
  
  return {
    bandName: bandName.trim(),
    genre: genre?.trim() || 'rock',
    mood: mood?.trim() || 'energetic'
  };
}

// Fallback generation utilities
export function selectRandomMembers(members: readonly [string, string][], count: number): [string, string][] {
  return getRandomElements(members, count);
}

export function getBandType(memberCount: number): string {
  if (memberCount <= 2) return 'duo';
  if (memberCount === 3) return 'trio';
  if (memberCount === 4) return 'quartet';
  if (memberCount === 5) return 'quintet';
  return 'ensemble';
}

export function formatMembers(members: [string, string][]): string {
  if (members.length <= 2) {
    return members.map(([name, instrument]) => `${name} on ${instrument}`).join(' and ');
  }
  
  const lastMember = members[members.length - 1];
  const otherMembers = members.slice(0, -1);
  
  return otherMembers.map(([name, instrument]) => `${name} on ${instrument}`).join(', ') + 
         ` and ${lastMember[0]} on ${lastMember[1]}`;
}

export function getRandomTrait(): string {
  return getRandomElement(RANDOM_TRAITS);
}

export function getRandomAchievement(): string {
  return getRandomElement(RANDOM_ACHIEVEMENTS);
}

export function getRandomItem(): string {
  return getRandomElement(RANDOM_ITEMS);
}

export function getRandomLanguageStyle(): string {
  return getRandomElement(RANDOM_LANGUAGE_STYLES);
}

export function getRandomLocation(): string {
  return getRandomElement(RANDOM_LOCATIONS);
}

// Fallback bio structure generators
export function generateTraditionalStructure(
  bandName: string, 
  genre: string, 
  mood: string, 
  year: number,
  selectedMembers: [string, string][],
  formationIdx: number,
  storyIdx: number,
  funFactIdx: number
): string {
  const formation = FORMATIONS[formationIdx];
  const story = STORIES[storyIdx];
  const funFact = FUN_FACTS[funFactIdx];
  
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

export function generateStoryFirstStructure(
  bandName: string,
  genre: string, 
  mood: string,
  year: number,
  selectedMembers: [string, string][]
): string {
  const story = getRandomElement(STORIES);
  const influence = getRandomElement(INFLUENCES);
  const tradition = getRandomElement(TRADITIONS);
  
  return `The legend of ${bandName} began with an incident that shook the ${genre} world: ${story} This ${mood} ${getBandType(selectedMembers.length)} features ${formatMembers(selectedMembers)}.

Drawing inspiration from ${influence}, ${bandName} creates a sound that defies categorization. Since forming in ${year}, they've maintained a tradition of ${tradition}.

Industry insiders say their success comes from their unique rehearsal space: a converted ${getRandomLocation()}.`;
}

export function generateCharacterFocusedStructure(
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

export function getRandomYear(): number {
  return FALLBACK_CONFIG.BASE_YEAR + Math.floor(Math.random() * FALLBACK_CONFIG.YEAR_RANGE);
}

export function getRandomMemberCount(): number {
  return FALLBACK_CONFIG.MIN_MEMBERS + Math.floor(Math.random() * (FALLBACK_CONFIG.MAX_ADDITIONAL_MEMBERS + 1));
}

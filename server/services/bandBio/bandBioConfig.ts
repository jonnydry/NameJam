// Configuration and types for band biography generation
import { z } from 'zod';

// Type definitions
export interface JournalisticStyle {
  name: string;
  systemPrompt: string;
  instruction: string;
}

export interface BandMember {
  name: string;
  instrument: string;
}

export interface BandBioPrompt {
  task: string;
  band_info: {
    name: string;
    genre: string;
    mood: string;
  };
  style_requirements: {
    journalistic_style?: string;
    style_instruction?: string;
    tone: string;
    approach?: string;
    voice?: string;
    must_avoid: string[];
    must_include: string[];
  };
  story_elements: {
    catalyst_event: string;
    required_themes?: string[];
    themes?: string[];
    humor_style?: string;
    humor_type?: string;
  };
  format: {
    max_words: number;
    structure?: string;
    style?: string;
    emphasis?: string;
  };
  examples_of_good_humor?: string[];
  avoid?: string[];
  unique_id: number;
}

export interface BandBioResponse {
  bio: string;
  model: string;
  source: 'ai' | 'local';
}

// Validation schemas
export const BandBioRequestSchema = z.object({
  bandName: z.string().min(1).max(100),
  genre: z.string().optional(),
  mood: z.string().optional()
});

export type BandBioRequest = z.infer<typeof BandBioRequestSchema>;

// Configuration constants
export const BAND_BIO_CONFIG = {
  MODEL: "grok-4-fast",
  MAX_TOKENS: 600, // Increased from 300 to fix 'length' finish_reason issue
  TEMPERATURE: 1.2,
  // Removed TOP_P, FREQUENCY_PENALTY, PRESENCE_PENALTY as grok-4-fast doesn't support them
  MAX_WORDS: 150,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000,
  JOURNALISTIC_STYLE_PROBABILITY: 0.5
} as const;

// Unique story elements for prompts
export const UNIQUE_ELEMENTS: readonly string[] = [
  'legendary sandwich incident that ended three relationships',
  'cursed guitar pick from a sketchy pawn shop',
  'time travel mishap involving expired milk',
  'alien intervention during a really bad hangover',
  'laundromat discovery after losing a bet',
  'fortune cookie prophecy written by a drunk poet',
  'rubber duck inspiration during a questionable life phase',
  'lightning storm revelation while skinny dipping',
  'cosmic bowling accident with terrible consequences',
  'mystical pizza delivery at 3 AM',
  'interdimensional garage sale scam',
  'telepathic hamster with commitment issues',
  'bathroom mirror epiphany after bad breakup',
  'gas station hot dog vision quest',
  'parking ticket that changed everything',
  'drunk text to the wrong number'
] as const;

// Journalistic writing styles
export const JOURNALISTIC_STYLES: readonly JournalisticStyle[] = [
  {
    name: "Rolling Stone Pretentious",
    systemPrompt: "You are a pretentious Rolling Stone music journalist who uses unnecessarily complex metaphors and references obscure philosophers while writing about bands. You believe everything is a cultural paradigm shift.",
    instruction: "Write in overly intellectual Rolling Stone style, comparing the band to Kafka and using phrases like 'zeitgeist-defining' and 'post-modern sonic landscape'"
  },
  {
    name: "TMZ Gossip",
    systemPrompt: "You are a TMZ gossip reporter who only cares about scandal, drama, and embarrassing moments. Everything is BREAKING NEWS and SHOCKING REVELATIONS.",
    instruction: "Write in sensational TMZ tabloid style with ALL CAPS for emphasis and focus on the most SCANDALOUS and SHOCKING aspects"
  },
  {
    name: "NPR Tiny Desk",
    systemPrompt: "You are an NPR music correspondent who finds deep meaning in everything and speaks in hushed, reverent tones about the artistic process while sipping fair-trade coffee.",
    instruction: "Write in NPR style, finding profound meaning in mundane details and using phrases like 'intimate sonic tapestry' and 'vulnerable artistic expression'"
  },
  {
    name: "Pitchfork Hipster",
    systemPrompt: "You are a Pitchfork reviewer who liked bands before they were cool and drops obscure references to prove your superiority. Everything is either a 2.3 or 8.7 out of 10.",
    instruction: "Write in Pitchfork hipster style, mentioning you saw them in a basement venue in 2003 and comparing them to bands nobody has heard of"
  },
  {
    name: "Behind The Music Documentary",
    systemPrompt: "You are the dramatic narrator of a VH1 Behind The Music documentary. Everything is a turning point, and there's always darkness before the triumph.",
    instruction: "Write in dramatic documentary style with phrases like 'But then, everything changed...' and 'Little did they know, tragedy was about to strike...'"
  },
  {
    name: "Small Town Newspaper",
    systemPrompt: "You are a local newspaper reporter from a small town covering this band like they're the biggest thing since the harvest festival. You relate everything to local landmarks and events.",
    instruction: "Write in small-town newspaper style, comparing their success to winning the county fair pie contest and mentioning local businesses"
  },
  {
    name: "Gen Z Music Blog",
    systemPrompt: "You are a Gen Z music blogger who communicates primarily in memes, uses 'slay' and 'no cap' constantly, and relates everything to TikTok trends.",
    instruction: "Write in Gen Z style with phrases like 'this band is giving main character energy fr fr' and 'the way they ATE and left NO CRUMBS'"
  },
  {
    name: "Academic Thesis",
    systemPrompt: "You are an overly serious musicology PhD candidate analyzing this band like it's your dissertation. Use unnecessary footnotes and academic jargon.",
    instruction: "Write in academic style with phrases like 'The semiotic implications of their chord progressions vis-à-vis late capitalism' and citations nobody will check"
  }
] as const;

// Fallback bio generation constants
export const FALLBACK_CONFIG = {
  BASE_YEAR: 1995,
  YEAR_RANGE: 28,
  MIN_MEMBERS: 3,
  MAX_ADDITIONAL_MEMBERS: 3
} as const;

export const FORMATIONS: readonly string[] = [
  "met at a late-night jam session in a abandoned subway tunnel",
  "bonded over their shared love of vintage synthesizers at a pawn shop",
  "were brought together by a mysterious Craigslist ad written in haiku",
  "formed after a chance encounter at a music festival porta-potty line",
  "started as street performers who kept getting noise complaints",
  "connected through a wrong number that turned into a three-hour conversation",
  "met in the comments section of an obscure music blog",
  "were all fired from the same wedding band on the same night",
  "bonded while stuck in an elevator for six hours",
  "met at a silent disco where they were the only ones not dancing",
  "came together after simultaneously walking out of the same terrible gig",
  "found each other through a misprinted concert flyer",
  "united after a food fight at a music theory class",
  "met while bidding on the same broken amp on eBay"
] as const;

export const BAND_MEMBERS: readonly [string, string][] = [
  ["Zephyr 'The Tornado'", "lead vocals"], ["Phoenix 'Ashes'", "guitar"], ["Echo 'The Void'", "bass"],
  ["Storm 'Lightning Fingers'", "drums"], ["Blaze 'Inferno'", "keyboards"], ["Nova 'Supernova'", "guitar"],
  ["Vortex 'The Spin'", "bass"], ["Thunder 'Boom Boom'", "drums"], ["Luna 'Moonbeam'", "vocals"],
  ["Orion 'Star Hunter'", "guitar"], ["Nebula 'Space Dust'", "bass"], ["Comet 'Tail Spin'", "drums"],
  ["Raven 'Midnight'", "synth"], ["Atlas 'World Carrier'", "percussion"], ["Quantum 'Q'", "electronics"],
  ["Neon 'Glow'", "vocals/beatbox"], ["Pixel '8-Bit'", "digital drums"], ["Chaos 'Dr. Disorder'", "noise guitar"],
  ["Zen 'The Calm'", "meditation bells"], ["Rex 'T-Rex'", "bass/roar"], ["Disco 'Fever'", "keytar"],
  ["Mango 'Tropical Storm'", "steel drums"], ["Wolf 'Howler'", "harmonica"], ["Crystal 'Shatter'", "glass harmonica"]
] as const;

export const STORIES: readonly string[] = [
  "Their breakthrough came when they accidentally played their biggest hit backwards during a sound check, creating an even better song",
  "They once performed an entire set using kitchen utensils as instruments after their gear was stolen",
  "Their debut single was recorded in a converted shipping container during a thunderstorm",
  "They gained fame after a video of them performing in a subway went viral when a rat started dancing",
  "Their unique sound comes from recording in an abandoned warehouse where they claim a ghost plays tambourine",
  "They became notorious for a show where the power went out and they continued playing acoustically on the roof",
  "Their first album was funded entirely by selling homemade hot sauce at their merch table",
  "They got their big break when a famous producer heard them through the wall of a dentist's office",
  "Their signature move involves crowd-surfing in an inflatable dinosaur costume",
  "They once played a 48-hour marathon concert to break a world record and raise money for music education",
  "Their tour bus broke down in the desert, inspiring their platinum album written around a campfire",
  "They became legends after turning a wedding reception into an impromptu festival",
  "Their experimental phase included an album recorded entirely in international airport terminals",
  "They gained a cult following for their annual 'Play in Strange Places' tour featuring laundromats and libraries"
] as const;

export const FUN_FACTS: readonly string[] = [
  "The band insists on having a rubber duck present at every recording session for 'creative inspiration'",
  "They refuse to perform unless there's a bowl of green M&Ms with exactly 47 pieces backstage",
  "All their album covers feature hidden pictures of their pet hamster, Gerald",
  "They communicate exclusively in music puns during rehearsals",
  "The band has a pre-show ritual of doing the Macarena in reverse",
  "They've never played the same setlist twice, using a Magic 8-Ball to decide the order",
  "Each member has a tattoo of a different kitchen appliance",
  "They once recorded an entire EP using only sounds from a grocery store",
  "The band's tour rider includes '3 pounds of glitter' for unspecified purposes",
  "They hold the record for most kazoos played simultaneously in a single song",
  "Every album features exactly one song about sandwiches",
  "They've trademarked their signature move: the 'Reverse Stage Dive'",
  "The band once played an entire concert in complete darkness as an 'auditory experience'",
  "They require all venue staff to address them by their zodiac signs",
  "Their drummer plays barefoot and claims it's for 'earth connection'",
  "They've released a cookbook featuring recipes inspired by their song titles"
] as const;

export const INFLUENCES: readonly string[] = [
  "polka music and death metal",
  "elevator music and hardcore punk",
  "whale songs and dubstep",
  "Renaissance madrigals and trap music",
  "dial-up internet sounds and jazz fusion",
  "construction noise and chamber music",
  "weather reports and prog rock",
  "infomercials and opera"
] as const;

export const TRADITIONS: readonly string[] = [
  "covering one Taylor Swift song in the style of Black Sabbath",
  "letting the audience vote on their encore via paper airplanes",
  "starting every show with a group meditation",
  "ending concerts with a massive pillow fight",
  "having a 'bring your pet' show once per tour",
  "playing at least one song on toy instruments",
  "inviting a random audience member to play tambourine"
] as const;

// Additional arrays for fallback generation
export const RANDOM_TRAITS: readonly string[] = [
  "mysterious", "chaotic", "philosophical", "caffeinated", "obsessive", "theatrical", "nocturnal", "superstitious"
] as const;

export const RANDOM_ACHIEVEMENTS: readonly string[] = [
  "won a hot dog eating contest", "survived being struck by lightning", "taught a parrot to sing opera", "got lost in their own house for three days"
] as const;

export const RANDOM_ITEMS: readonly string[] = [
  "spoon", "rubber chicken", "disco ball", "cactus", "vintage calculator", "lava lamp", "snow globe"
] as const;

export const RANDOM_LANGUAGE_STYLES: readonly string[] = [
  "haiku", "Shakespearean English", "pirate talk", "robot beeps", "interpretive dance gestures", "mime"
] as const;

export const RANDOM_LOCATIONS: readonly string[] = [
  "dentist office", "bowling alley", "aquarium", "library basement", "food truck", "haunted lighthouse", "space museum"
] as const;
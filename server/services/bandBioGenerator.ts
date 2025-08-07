import OpenAI from "openai";
import { xaiRateLimiter, withRetry } from '../utils/rateLimiter';
import { secureLog } from '../utils/secureLogger';

export class BandBioGeneratorService {
  private openai: OpenAI | null = null;

  constructor() {
    // Initialize OpenAI only if API key is available
    if (process.env.XAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          baseURL: "https://api.x.ai/v1",
          apiKey: process.env.XAI_API_KEY
        });
      } catch (error) {
        secureLog.warn("Failed to initialize OpenAI client:", error);
        this.openai = null;
      }
    }
  }

  async generateBandBio(bandName: string, genre?: string, mood?: string): Promise<string> {
    // If OpenAI client is not available, use fallback
    if (!this.openai) {
      return this.generateFallbackBio(bandName, genre, mood);
    }

    // Use only Grok 3 for consistent quality and simplicity
    const model = "grok-3";
    
    try {
        const genreInfo = genre ? ` ${genre}` : 'rock';
        const moodInfo = mood ? ` ${mood}` : 'energetic';
        
        // Enhanced humor-focused prompts with diverse journalistic styles
        let prompt;
        const timestamp = Date.now();
        const uniqueElements = [
          'legendary sandwich incident that ended three relationships', 'cursed guitar pick from a sketchy pawn shop', 'time travel mishap involving expired milk', 'alien intervention during a really bad hangover', 
          'laundromat discovery after losing a bet', 'fortune cookie prophecy written by a drunk poet', 'rubber duck inspiration during a questionable life phase', 'lightning storm revelation while skinny dipping',
          'cosmic bowling accident with terrible consequences', 'mystical pizza delivery at 3 AM', 'interdimensional garage sale scam', 'telepathic hamster with commitment issues',
          'bathroom mirror epiphany after bad breakup', 'gas station hot dog vision quest', 'parking ticket that changed everything', 'drunk text to the wrong number'
        ];
        const randomElement = uniqueElements[Math.floor(Math.random() * uniqueElements.length)];
        
        // Expanded journalistic styles for variety
        const journalisticStyles = [
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
        ];
        
        // Decide whether to use original edgy style or new journalistic style (50/50 chance)
        const useJournalisticStyle = Math.random() < 0.5;
        let selectedStyle;
        let systemPromptOverride;
        
        if (useJournalisticStyle) {
          // Use new journalistic style with detailed JSON prompt
          selectedStyle = journalisticStyles[Math.floor(Math.random() * journalisticStyles.length)];
          systemPromptOverride = selectedStyle.systemPrompt;
          
          // Create detailed JSON prompt structure
          const jsonPrompt = {
            task: "Generate a hilarious fictional band biography",
            band_info: {
              name: bandName,
              genre: genreInfo,
              mood: moodInfo
            },
            style_requirements: {
              journalistic_style: selectedStyle.name,
              style_instruction: selectedStyle.instruction,
              tone: "Wickedly funny, entertaining, witty, and absurd",
              must_avoid: ["Generic band bio clichés", "Boring factual information", "Serious or respectful tone"],
              must_include: ["Outrageous origin story", "Embarrassing moments", "Ridiculous band member quirks", "Absurd traditions or rituals"]
            },
            story_elements: {
              catalyst_event: randomElement,
              required_themes: ["Dysfunction", "Poor life choices", "Embarrassing failures", "Absurd situations"],
              humor_style: "Sharp wit, clever wordplay, unexpected twists, satirical observations"
            },
            format: {
              max_words: 150,
              structure: "Narrative biography with punchy sentences",
              emphasis: "Entertainment value over accuracy"
            },
            examples_of_good_humor: [
              "Band member names that are ridiculous but believable",
              "Origin stories that escalate from normal to absurd",
              "Mundane events described with dramatic importance",
              "Contradictions and ironic situations"
            ],
            unique_id: timestamp
          };
          
          prompt = `Based on these requirements, write a hilarious band biography:\n\n${JSON.stringify(jsonPrompt, null, 2)}\n\nIMPORTANT: Generate ONLY the biography text itself, not the JSON structure. Write the actual funny biography story in the requested style!`;
          
        } else {
          // Use original edgy prompts - always use the enhanced JSON version for grok-3
          if (false) { // Disabled mini model logic
            // Edgy humor-focused simple prompts
            const humorPrompts = [
              `Write a wickedly funny biography for "${bandName}", a ${genreInfo} band. Include their chaotic origin involving ${randomElement}, questionable life choices, member drama, and their most cringe-worthy public moment. Be EDGY, irreverent, and brutally honest! Under 150 words. Timestamp: ${timestamp}`,
              `Create a no-holds-barred bio for "${bandName}" (${genreInfo}). Focus on their dysfunctional formation story, their terrible decisions, messy relationships, and the most awkward thing that ever happened. Be SAVAGE and witty! Under 150 words. ID: ${timestamp}`,
              `Tell the unfiltered story of "${bandName}" - their ${genreInfo} sound emerged from ${randomElement} and poor judgment. Include messy member backstories, questionable morals, and their most embarrassing performance disaster. Be SHARP and merciless! Under 150 words. Seed: ${timestamp}`
            ];
            prompt = humorPrompts[Math.floor(Math.random() * humorPrompts.length)];
          } else {
            // Enhanced with detailed JSON structure for original style
            const jsonPrompt = {
              task: "Generate an edgy, brutally honest band biography",
              band_info: {
                name: bandName,
                genre: genreInfo,
                mood: moodInfo
              },
              style_requirements: {
                tone: "Savage, irreverent, darkly humorous, brutally honest",
                approach: "Roast comedy meets music journalism",
                voice: "Sarcastic music journalist with zero filter",
                must_include: ["Failed relationships", "Poor decisions", "Embarrassing moments", "Dysfunctional dynamics"]
              },
              story_elements: {
                catalyst_event: randomElement,
                themes: ["Chaos", "Bad judgment", "Public humiliation", "Personal failures"],
                humor_type: "Dark, edgy, uncomfortable truths, savage observations"
              },
              format: {
                max_words: 150,
                style: "Exposé format with cutting commentary"
              },
              avoid: ["Sanitized industry speak", "Feel-good narratives", "Respectful tone", "Generic band bio templates"],
              unique_id: timestamp
            };
            
            prompt = `DARK COMEDY BRIEF:\n\n${JSON.stringify(jsonPrompt, null, 2)}\n\nWrite ONLY the biography text based on these requirements. Be RUTHLESS and savagely funny!`;
          }
        }

        // Configure parameters for maximum creativity and humor
        const requestParams: any = {
          model: model,
          messages: [
            {
              role: "system",
              content: systemPromptOverride || "You are a sarcastic music journalist with zero filter and a dark sense of humor. Write band biographies that are brutally honest, wickedly funny, and unapologetically edgy. Think 'roast comedy meets music journalism.' Expose the messy reality behind the facade - failed relationships, poor decisions, embarrassing moments, and dysfunctional dynamics. Be sharp, irreverent, and savagely entertaining while staying clever rather than crude. No sanitized industry speak allowed."
            },
            {
              role: "user", 
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 1.2 // Increased for maximum creativity
        };

        // Grok 3 parameters - optimized for creativity and humor
        requestParams.top_p = 0.95;
        requestParams.frequency_penalty = 0.6; // Higher to avoid repetition
        requestParams.presence_penalty = 0.4; // Higher to encourage new topics

        const response = await xaiRateLimiter.execute(async () => {
          return withRetry(async () => {
            const resp = await this.openai!.chat.completions.create(requestParams);
            return resp;
          }, 3, 2000);
        });

        const content = response.choices[0]?.message?.content || "";
        
        if (content && content.trim() !== "") {
          secureLog.info(`Successfully generated bio using model: ${model}`);
          secureLog.debug(`Bio generated for ${bandName}:`, content);
          
          // Parse the AI response which may be in JSON format
          let bioText = content.trim();
          try {
            const parsed = JSON.parse(content);
            
            // Check if this looks like the prompt structure being returned
            if (parsed.task && parsed.band_info && parsed.style_requirements) {
              secureLog.warn(`AI returned prompt structure instead of biography for ${bandName}`);
              throw new Error('Invalid response format');
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
            // If it's still an object without recognizable fields, keep original content
          } catch (e) {
            // Not JSON, use the content as-is
          }
          
          return JSON.stringify({
            bio: bioText,
            model: model,
            source: 'ai'
          });
        }
        
        // If we get here, the model returned empty content
        throw new Error('Empty content returned');
        
      } catch (error: any) {
        secureLog.info(`Grok 3 model failed:`, error.message);
        // Fall through to fallback
      }
    
    // If Grok 3 fails, use fallback
    secureLog.info("Grok 3 failed, using fallback bio generator");
    const fallbackBio = this.generateFallbackBio(bandName, genre, mood);
    return JSON.stringify({
      bio: fallbackBio,
      model: 'fallback-template',
      source: 'local'
    });
  }
  
  private generateFallbackBio(bandName: string, genre?: string, mood?: string): string {
    const genreText = genre || 'rock';
    const moodText = mood || 'energetic';
    const year = 1995 + Math.floor(Math.random() * 28);
    
    // Add timestamp-based randomness to ensure variety
    const seed = Date.now() + Math.random();
    
    const formations = [
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
    ];
    
    const members = [
      ["Zephyr 'The Tornado'", "lead vocals"], ["Phoenix 'Ashes'", "guitar"], ["Echo 'The Void'", "bass"], 
      ["Storm 'Lightning Fingers'", "drums"], ["Blaze 'Inferno'", "keyboards"], ["Nova 'Supernova'", "guitar"], 
      ["Vortex 'The Spin'", "bass"], ["Thunder 'Boom Boom'", "drums"], ["Luna 'Moonbeam'", "vocals"], 
      ["Orion 'Star Hunter'", "guitar"], ["Nebula 'Space Dust'", "bass"], ["Comet 'Tail Spin'", "drums"],
      ["Raven 'Midnight'", "synth"], ["Atlas 'World Carrier'", "percussion"], ["Quantum 'Q'", "electronics"],
      ["Neon 'Glow'", "vocals/beatbox"], ["Pixel '8-Bit'", "digital drums"], ["Chaos 'Dr. Disorder'", "noise guitar"],
      ["Zen 'The Calm'", "meditation bells"], ["Rex 'T-Rex'", "bass/roar"], ["Disco 'Fever'", "keytar"],
      ["Mango 'Tropical Storm'", "steel drums"], ["Wolf 'Howler'", "harmonica"], ["Crystal 'Shatter'", "glass harmonica"]
    ];
    
    const stories = [
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
    ];
    
    const funFacts = [
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
    ];
    
    const influences = [
      "polka music and death metal",
      "elevator music and hardcore punk",
      "whale songs and dubstep",
      "Renaissance madrigals and trap music",
      "dial-up internet sounds and jazz fusion",
      "construction noise and chamber music",
      "weather reports and prog rock",
      "infomercials and opera"
    ];
    
    const traditions = [
      "covering one Taylor Swift song in the style of Black Sabbath",
      "letting the audience vote on their encore via paper airplanes",
      "starting every show with a group meditation",
      "ending concerts with a massive pillow fight",
      "having a 'bring your pet' show once per tour",
      "playing at least one song on toy instruments",
      "inviting a random audience member to play tambourine"
    ];
    
    // Use better randomization
    const randomIndex = (arr: any[]) => Math.floor(Math.random() * arr.length);
    
    // Randomly select structure for variety
    const structures = [
      // Structure 1: Traditional
      () => {
        const formationIdx = randomIndex(formations);
        const formation = formations[formationIdx];
        const selectedMembers = this.selectRandomMembers(members, 3 + Math.floor(Math.random() * 3));
        const storyIdx = randomIndex(stories);
        const story = stories[storyIdx];
        const funFactIdx = randomIndex(funFacts);
        const funFact = funFacts[funFactIdx];
        
        // Ensure we're not using the first items repeatedly
        secureLog.info(`Using indices: formation=${formationIdx}, story=${storyIdx}, funFact=${funFactIdx}`);
        
        // Mix up the second paragraph for variety
        const secondParagraphs = [
          `Known for their ${moodText} sound that blends ${genreText} with unexpected elements, ${bandName} has carved out a unique niche in the music scene.`,
          `With their signature ${moodText} approach to ${genreText}, ${bandName} quickly gained a reputation for their unpredictable live performances.`,
          `Combining ${moodText} energy with raw ${genreText} power, ${bandName} refuses to be categorized by industry standards.`,
          `Their ${moodText} take on ${genreText} has earned ${bandName} a devoted following among those who crave something different.`,
          `Blending ${moodText} vibes with classic ${genreText} roots, ${bandName} creates music that defies expectations.`
        ];
        
        const secondPara = secondParagraphs[randomIndex(secondParagraphs)];
        
        return `${bandName} formed in ${year} when ${selectedMembers.length} musicians ${formation}. The ${genreText} ${this.getBandType(selectedMembers.length)} consists of ${this.formatMembers(selectedMembers)}. 

${secondPara} ${story}

Fun fact: ${funFact}`;
      },
      
      // Structure 2: Story-first
      () => {
        const story = stories[Math.floor(Math.random() * stories.length)];
        const selectedMembers = this.selectRandomMembers(members, 3 + Math.floor(Math.random() * 3));
        const influence = influences[Math.floor(Math.random() * influences.length)];
        const tradition = traditions[Math.floor(Math.random() * traditions.length)];
        
        return `The legend of ${bandName} began with an incident that shook the ${genreText} world: ${story} This ${moodText} ${this.getBandType(selectedMembers.length)} features ${this.formatMembers(selectedMembers)}.

Drawing inspiration from ${influence}, ${bandName} creates a sound that defies categorization. Since forming in ${year}, they've maintained a tradition of ${tradition}.

Industry insiders say their success comes from their unique rehearsal space: a converted ${this.getRandomLocation()}.`;
      },
      
      // Structure 3: Character-focused
      () => {
        const selectedMembers = this.selectRandomMembers(members, 4);
        const formation = formations[Math.floor(Math.random() * formations.length)];
        const funFact = funFacts[Math.floor(Math.random() * funFacts.length)];
        
        return `Meet ${bandName}: ${selectedMembers[0][0]} (${selectedMembers[0][1]}) is the ${this.getRandomTrait()} one. ${selectedMembers[1][0]} (${selectedMembers[1][1]}) once ${this.getRandomAchievement()}. ${selectedMembers[2][0]} (${selectedMembers[2][1]}) refuses to play without their lucky ${this.getRandomItem()}. And ${selectedMembers[3][0]} (${selectedMembers[3][1]}) speaks only in ${this.getRandomLanguageStyle()}.

This ${moodText} ${genreText} quartet ${formation} in ${year} and haven't looked back since. ${funFact}`;
      }
    ];
    
    // Ensure we pick a random structure each time
    const structureIndex = Math.floor(Math.random() * structures.length);
    secureLog.info(`Using bio structure ${structureIndex + 1} of ${structures.length}`);
    return structures[structureIndex]();
  }
  
  private selectRandomMembers(members: string[][], count: number): string[][] {
    const selected: string[][] = [];
    const indices = new Set<number>();
    while (indices.size < count && indices.size < members.length) {
      indices.add(Math.floor(Math.random() * members.length));
    }
    indices.forEach(i => selected.push(members[i]));
    return selected;
  }
  
  private formatMembers(members: string[][]): string {
    if (members.length === 1) return `${members[0][0]} on ${members[0][1]}`;
    if (members.length === 2) return `${members[0][0]} on ${members[0][1]} and ${members[1][0]} on ${members[1][1]}`;
    
    const allButLast = members.slice(0, -1).map(m => `${m[0]} on ${m[1]}`).join(', ');
    const last = members[members.length - 1];
    return `${allButLast}, and ${last[0]} on ${last[1]}`;
  }
  
  private getBandType(memberCount: number): string {
    const types: Record<number, string> = {
      1: 'solo project',
      2: 'duo',
      3: 'trio',
      4: 'quartet',
      5: 'quintet',
      6: 'sextet'
    };
    return types[memberCount] || 'ensemble';
  }
  
  private getRandomLocation(): string {
    const locations = [
      'bowling alley', 'submarine', 'treehouse', 'food truck', 'lighthouse',
      'abandoned mall', 'cave system', 'hot air balloon', 'train car', 'greenhouse'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }
  
  private getRandomTrait(): string {
    const traits = [
      'mysterious', 'chaotic', 'methodical', 'spontaneous', 'philosophical',
      'caffeinated', 'nocturnal', 'theatrical', 'minimalist', 'maximalist'
    ];
    return traits[Math.floor(Math.random() * traits.length)];
  }
  
  private getRandomAchievement(): string {
    const achievements = [
      'won a hot dog eating contest', 
      'climbed Mount Everest backwards',
      'invented a new chord', 
      'taught a parrot to beatbox',
      'played 100 shows in 100 hours', 
      'busked on all seven continents',
      'holds the world record for longest guitar solo',
      'once jammed with a symphony orchestra uninvited',
      'got kicked out of music school for being too creative',
      'wrote their first hit song in a dream',
      'can play three instruments simultaneously',
      'started a musical revolution in their hometown',
      'turned a car alarm into a Billboard hit',
      'has perfect pitch but refuses to admit it'
    ];
    return achievements[Math.floor(Math.random() * achievements.length)];
  }
  
  private getRandomItem(): string {
    const items = [
      'rubber chicken', 'lava lamp', 'disco ball', 'garden gnome',
      'inflatable flamingo', 'vintage calculator', 'traffic cone', 'mood ring'
    ];
    return items[Math.floor(Math.random() * items.length)];
  }
  
  private getRandomLanguageStyle(): string {
    const styles = [
      'movie quotes', 'haikus', 'pirate slang', 'weather forecasts',
      'cooking instructions', 'sports commentary', 'fortune cookies', 'palindromes'
    ];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  async generateBandBioWithDetails(
    bandName: string, 
    genre?: string,
    mood?: string,
    details?: any
  ): Promise<string> {
    // Handle special case for generating band name from setlist
    if (details?.promptType === 'bandNameFromSetlist') {
      const { setlistContext, songNames } = details;
      
      // Debug logging to see what songs we're working with
      secureLog.info('Generating band name from setlist with songs:', songNames);
      
      // Try each Grok model in order (Grok 3 prioritized for reliability)
      const models = ['grok-3', 'grok-4', 'grok-3-mini'];
      
      for (const model of models) {
        try {
          secureLog.info(`Attempting model: ${model}`);
          secureLog.info(`Attempting to generate band name with model: ${model}`);
          
          const prompt = `You are a music industry expert tasked with naming a band based on their complete setlist. Analyze the following song titles and create a unique, memorable band name that reflects their artistic identity.

SETLIST SONGS:
${songNames.map((song: string, index: number) => `${index + 1}. "${song}"`).join('\n')}

BAND CONTEXT:
${mood ? `Musical Mood: ${mood}` : 'Musical Mood: Not specified'}
${genre ? `Primary Genre: ${genre}` : 'Primary Genre: Not specified'}

ANALYSIS INSTRUCTIONS:
- Study the themes, emotions, and imagery in these specific song titles
- Look for recurring words, concepts, or emotional patterns
- Consider what type of band would create this exact collection of songs
- Create a name that feels authentic to this particular setlist
- Avoid generic names - make it unique and memorable
- The name should feel like it naturally belongs with these songs

Generate ONE unique band name that captures the essence of this specific setlist.

Respond with ONLY a JSON object in this exact format:
{
  "bandName": "Your Creative Band Name Here"
}`;

          // Configure parameters based on model capabilities (like other Grok services)
          const requestParams: any = {
            model: model,
            messages: [
              {
                role: "system",
                content: "You are an expert band naming specialist with deep knowledge of linguistic patterns, poetic structures, and grammatical consistency. When analyzing setlists to create band names, apply these principles: ensure perfect grammar (subject-verb agreement, proper articles), use poetic flow with natural stress patterns, create memorable word combinations that reflect the musical themes, and avoid duplicate words. Focus on semantic relationships between the setlist songs and generate names with authentic artistic personality."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.9,
            max_tokens: 150
          };

          // Model-specific parameter configuration
          if (model === 'grok-4') {
            // Grok 4 - minimal parameters, plain text response
            requestParams.top_p = 0.95;
            // Update prompt for plain text response
            requestParams.messages[1].content = `You are a creative music expert. Based on these setlist songs, generate ONE unique band name that captures their essence:

SONGS: ${songNames.map((song: string) => `"${song}"`).join(', ')}
${mood ? `MOOD: ${mood}` : ''}
${genre ? `GENRE: ${genre}` : ''}

Respond with ONLY the band name, nothing else.`;
          } else if (model.includes('grok-3')) {
            // Grok 3 variants - full parameter support with JSON
            requestParams.top_p = 0.9;
            requestParams.frequency_penalty = 0.4;
            requestParams.presence_penalty = 0.3;
            requestParams.response_format = { type: "json_object" };
          } else {
            // Other models - basic parameters with JSON
            requestParams.top_p = 0.9;
            requestParams.response_format = { type: "json_object" };
          }

          const response = await xaiRateLimiter.execute(async () => {
            return withRetry(async () => {
              const resp = await this.openai!.chat.completions.create(requestParams);
              return resp;
            }, 3, 2000);
          });

          const content = response.choices[0]?.message?.content || "";
          
          if (content && content.trim() !== "") {
            secureLog.info(`Successfully generated band name using model: ${model}`);
            secureLog.info(`Raw response content: "${content}"`);
            
            // Handle different response formats based on model
            if (model === 'grok-4') {
              // For Grok 4, expect plain text response
              const cleanName = content.trim().replace(/^["']|["']$/g, '');
              return JSON.stringify({
                bandName: cleanName || 'The Unnamed Collective',
                model: model,
                source: 'ai'
              });
            } else {
              // For other models, expect JSON
              try {
                const parsed = JSON.parse(content);
                return JSON.stringify({
                  bandName: parsed.bandName || 'The Unnamed Collective',
                  model: model,
                  source: 'ai'
                });
              } catch (parseError) {
                // If JSON parsing fails, extract band name from text
                const match = content.match(/"bandName":\s*"([^"]+)"/);
                if (match && match[1]) {
                  return JSON.stringify({
                    bandName: match[1],
                    model: model,
                    source: 'ai'
                  });
                }
                // Fallback to plain text for other models too
                const cleanName = content.trim().replace(/^["']|["']$/g, '');
                return JSON.stringify({
                  bandName: cleanName || 'The Unnamed Collective',
                  model: model,
                  source: 'ai'
                });
              }
            }
          }
          
          secureLog.info(`Model ${model} returned empty content, trying next model...`);
          
        } catch (error: any) {
          secureLog.info(`Model ${model} failed with error:`, error.message);
          secureLog.info(`Error details:`, error.response?.data || error.code || 'No additional details');
          // Continue to next model
        }
      }
      
      // Fallback will be handled in the route
      return JSON.stringify({
        bandName: '',
        model: 'fallback',
        source: 'fallback'
      });
    }
    
    // For regular bio generation, use existing method
    return this.generateBandBio(bandName, genre, mood);
  }

  async generateBandBioWithDetailsOld(
    bandName: string, 
    options: {
      genre?: string;
      mood?: string;
      wordCount?: number;
    }
  ): Promise<{
    bio: string;
    members?: string[];
    formationYear?: string;
    genre?: string;
  }> {
    try {
      const { genre, mood } = options;
      const genreInfo = genre ? ` in the ${genre} genre` : '';
      const moodInfo = mood ? ` with a ${mood} vibe` : '';
      
      const prompt = `Create a detailed biography for a fictional band called "${bandName}"${genreInfo}${moodInfo}. 
      
      Respond in JSON format with the following structure:
      {
        "bio": "A 150-200 word entertaining biography",
        "members": ["Member 1 name and instrument", "Member 2 name and instrument", ...],
        "formationYear": "Year they formed",
        "genre": "Their primary musical genre",
        "funFact": "One quirky or humorous fact about the band"
      }
      
      Make it creative, entertaining, and slightly humorous. Include interesting formation story and breakthrough moment.`;

      const response = await this.openai!.chat.completions.create({
        model: "grok-3-mini",
        messages: [
          {
            role: "system",
            content: "You are a creative music journalist. Respond only in valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 400,
        temperature: 0.8
      });

      const content = response.choices[0].message.content || "{}";
      const parsedResponse = JSON.parse(content);
      
      return {
        bio: parsedResponse.bio || "Biography unavailable at this time.",
        members: parsedResponse.members || [],
        formationYear: parsedResponse.formationYear || "Unknown",
        genre: parsedResponse.genre || genre || "Alternative"
      };
    } catch (error) {
      console.error("Error generating detailed band bio:", error);
      // Return a fallback response instead of throwing
      return {
        bio: `${bandName} emerged from the underground music scene with their unique sound. Known for their energetic performances and devoted fanbase, they continue to push musical boundaries.`,
        genre: options.genre || "Alternative"
      };
    }
  }
}
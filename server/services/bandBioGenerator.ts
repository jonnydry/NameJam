import OpenAI from "openai";
import { xaiRateLimiter, withRetry } from '../utils/rateLimiter';
import { logger } from '../utils/logger';

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
        logger.warn("Failed to initialize OpenAI client:", error);
        this.openai = null;
      }
    }
  }

  async generateBandBio(bandName: string, genre?: string, mood?: string): Promise<string> {
    // If OpenAI client is not available, use fallback
    if (!this.openai) {
      return this.generateFallbackBio(bandName, genre, mood);
    }

    // Try different models in order of preference (Grok 3 prioritized for reliability)
    const models = ["grok-3", "grok-4", "grok-3-mini"];
    
    for (const model of models) {
      try {
        const genreInfo = genre ? ` ${genre}` : 'rock';
        const moodInfo = mood ? ` ${mood}` : 'energetic';
        
        // Enhanced humor-focused prompts with anti-formulaic instructions
        let prompt;
        const timestamp = Date.now();
        const uniqueElements = [
          'legendary sandwich incident that ended three relationships', 'cursed guitar pick from a sketchy pawn shop', 'time travel mishap involving expired milk', 'alien intervention during a really bad hangover', 
          'laundromat discovery after losing a bet', 'fortune cookie prophecy written by a drunk poet', 'rubber duck inspiration during a questionable life phase', 'lightning storm revelation while skinny dipping',
          'cosmic bowling accident with terrible consequences', 'mystical pizza delivery at 3 AM', 'interdimensional garage sale scam', 'telepathic hamster with commitment issues',
          'bathroom mirror epiphany after bad breakup', 'gas station hot dog vision quest', 'parking ticket that changed everything', 'drunk text to the wrong number'
        ];
        const randomElement = uniqueElements[Math.floor(Math.random() * uniqueElements.length)];
        
        if (model === 'grok-3-mini' || model === 'grok-3-mini-fast') {
          // Edgy humor-focused simple prompts
          const humorPrompts = [
            `Write a wickedly funny biography for "${bandName}", a ${genreInfo} band. Include their chaotic origin involving ${randomElement}, questionable life choices, member drama, and their most cringe-worthy public moment. Be EDGY, irreverent, and brutally honest! Under 150 words. Timestamp: ${timestamp}`,
            `Create a no-holds-barred bio for "${bandName}" (${genreInfo}). Focus on their dysfunctional formation story, their terrible decisions, messy relationships, and the most awkward thing that ever happened. Be SAVAGE and witty! Under 150 words. ID: ${timestamp}`,
            `Tell the unfiltered story of "${bandName}" - their ${genreInfo} sound emerged from ${randomElement} and poor judgment. Include messy member backstories, questionable morals, and their most embarrassing performance disaster. Be SHARP and merciless! Under 150 words. Seed: ${timestamp}`
          ];
          prompt = humorPrompts[Math.floor(Math.random() * humorPrompts.length)];
        } else {
          // Edgy, R-rated humor prompts with no-holds-barred approach
          const advancedHumorPrompts = [
            `EDGY COMEDY: Write a brutally honest, darkly funny biography for "${bandName}", a ${genreInfo} band. Feature: ${randomElement}, dysfunctional member relationships, terrible life choices, and their most spectacularly embarrassing meltdown. AVOID all sanitized band bio clichés. Be SAVAGE, witty, and unapologetically honest about their messy reality! Max 150 words. Chaos ID: ${timestamp}`,
            
            `NO-FILTER MODE: Create a wickedly funny exposé of "${bandName}" (${genreInfo}, ${moodInfo}). Include: their chaotic formation via ${randomElement}, members with questionable morals and worse judgment, plus their most cringe-inducing public disaster. REJECT all wholesome music industry BS! Be SHARP, irreverent, and mercilessly entertaining! Max 150 words. Anarchy seed: ${timestamp}`,
            
            `DARK HUMOR ALERT: Document the trainwreck story of "${bandName}" - ${moodInfo} ${genreInfo} disasters. Start with ${randomElement}, add member drama involving bad decisions and worse relationships, include their most mortifying tradition. DESTROY all feel-good bio templates! Be EDGY, sarcastic, and brutally amusing! Max 150 words. Mayhem code: ${timestamp}`,
            
            `SAVAGE ROAST MODE: Chronicle the messy reality of "${bandName}" in ${genreInfo}. Feature: ${randomElement} catalyst, members with commitment issues and substance problems, their most awkward public humiliation. BURN all generic music bios! Make it CUTTING, honest, and hilariously uncomfortable! Max 150 words. Destruction level: ${timestamp}`,
            
            `UNHINGED COMEDY: Tell the unvarnished truth about "${bandName}" - ${genreInfo} degenerates with ${moodInfo} energy. Include: ${randomElement} as the turning point, spectacularly dysfunctional band dynamics, and their most embarrassing personal failures made public. TORCH all sanitized storytelling! Be RUTHLESS and savagely funny! Max 150 words. Chaos maximum: ${timestamp}`
          ];
          prompt = advancedHumorPrompts[Math.floor(Math.random() * advancedHumorPrompts.length)];
        }

        // Configure parameters for maximum creativity and humor
        const requestParams: any = {
          model: model,
          messages: [
            {
              role: "system",
              content: "You are a sarcastic music journalist with zero filter and a dark sense of humor. Write band biographies that are brutally honest, wickedly funny, and unapologetically edgy. Think 'roast comedy meets music journalism.' Expose the messy reality behind the facade - failed relationships, poor decisions, embarrassing moments, and dysfunctional dynamics. Be sharp, irreverent, and savagely entertaining while staying clever rather than crude. No sanitized industry speak allowed."
            },
            {
              role: "user", 
              content: prompt
            }
          ],
          max_tokens: model === 'grok-3-mini' ? 500 : 300,
          temperature: 1.2 // Increased for maximum creativity
        };

        // Model-specific parameter configuration optimized for humor and uniqueness
        if (model === 'grok-4') {
          // Grok 4 - minimal parameters for maximum compatibility
          requestParams.top_p = 0.98; // Higher for more randomness
        } else if (model === 'grok-3') {
          // Grok 3 full - supports all parameters, optimize for creativity
          requestParams.top_p = 0.95;
          requestParams.frequency_penalty = 0.6; // Higher to avoid repetition
          requestParams.presence_penalty = 0.4; // Higher to encourage new topics
        } else if (model === 'grok-3-mini') {
          // Grok 3 mini - limited parameter support but maximize creativity
          requestParams.top_p = 0.95;
          // No frequency_penalty or presence_penalty for mini
        } else {
          // Other models - optimize for uniqueness
          requestParams.top_p = 0.95;
          requestParams.frequency_penalty = 0.4;
          requestParams.presence_penalty = 0.3;
        }

        const response = await xaiRateLimiter.execute(async () => {
          return withRetry(async () => {
            const resp = await this.openai!.chat.completions.create(requestParams);
            return resp;
          }, 3, 2000);
        });

        const bio = response.choices[0]?.message?.content || "";
        
        if (bio && bio.trim() !== "") {
          logger.log(`Successfully generated bio using model: ${model}`);
          return JSON.stringify({
            bio: bio.trim(),
            model: model,
            source: 'ai'
          });
        }
        
        // If we get here, the model returned empty content
        console.log(`Model ${model} returned empty content, trying next model...`);
        
      } catch (error: any) {
        console.log(`Model ${model} failed:`, error.message);
        // Continue to next model
      }
    }
    
    // If all models fail, use fallback
    console.log("All Grok models failed, using fallback bio generator");
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
        console.log(`Using indices: formation=${formationIdx}, story=${storyIdx}, funFact=${funFactIdx}`);
        
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
    console.log(`Using bio structure ${structureIndex + 1} of ${structures.length}`);
    return structures[structureIndex]();
  }
  
  private selectRandomMembers(members: string[][], count: number): string[][] {
    const selected = [];
    const indices = new Set();
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
    const types = {
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
      console.log('Generating band name from setlist with songs:', songNames);
      
      // Try each Grok model in order (Grok 3 prioritized for reliability)
      const models = ['grok-3', 'grok-4', 'grok-3-mini'];
      
      for (const model of models) {
        try {
          console.log(`Attempting model: ${model}`);
          console.log(`Attempting to generate band name with model: ${model}`);
          
          const prompt = `You are a music industry expert tasked with naming a band based on their complete setlist. Analyze the following song titles and create a unique, memorable band name that reflects their artistic identity.

SETLIST SONGS:
${songNames.map((song, index) => `${index + 1}. "${song}"`).join('\n')}

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

SONGS: ${songNames.map(song => `"${song}"`).join(', ')}
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
            console.log(`Successfully generated band name using model: ${model}`);
            console.log(`Raw response content: "${content}"`);
            
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
          
          console.log(`Model ${model} returned empty content, trying next model...`);
          
        } catch (error: any) {
          console.log(`Model ${model} failed with error:`, error.message);
          console.log(`Error details:`, error.response?.data || error.code || 'No additional details');
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

      const response = await this.openai.chat.completions.create({
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
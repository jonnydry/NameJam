import OpenAI from "openai";

export class BandBioGeneratorService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey: process.env.XAI_API_KEY
    });
  }

  async generateBandBio(bandName: string, genre?: string, mood?: string): Promise<string> {
    try {
      const genreInfo = genre ? ` ${genre}` : 'rock';
      const moodInfo = mood ? ` ${mood}` : 'energetic';
      
      // Simplified prompt to avoid triggering reasoning tokens
      const prompt = `Band bio for "${bandName}": ${genreInfo} band with ${moodInfo} style. Include formation story, members, and fun fact. 150 words max.`;

      const response = await this.openai.chat.completions.create({
        model: "grok-3-mini",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 250,
        temperature: 0.7
      });

      console.log("Grok API response usage:", response.usage);
      const bio = response.choices[0]?.message?.content || "";
      
      if (!bio || bio.trim() === "") {
        // Fallback to a simple template-based bio if Grok fails
        return this.generateFallbackBio(bandName, genre, mood);
      }
      
      return bio.trim();
    } catch (error) {
      console.error("Error generating band bio:", error);
      // Return fallback bio instead of throwing
      return this.generateFallbackBio(bandName, genre, mood);
    }
  }
  
  private generateFallbackBio(bandName: string, genre?: string, mood?: string): string {
    const genreText = genre || 'rock';
    const moodText = mood || 'energetic';
    const year = 2015 + Math.floor(Math.random() * 8);
    
    const formations = [
      "met at a late-night jam session",
      "bonded over their shared love of vintage synthesizers",
      "were brought together by a mysterious Craigslist ad",
      "formed after a chance encounter at a music festival",
      "started as street performers"
    ];
    
    const members = [
      ["Zephyr", "lead vocals"], ["Phoenix", "guitar"], ["Echo", "bass"], ["Storm", "drums"],
      ["Blaze", "keyboards"], ["Nova", "guitar"], ["Vortex", "bass"], ["Thunder", "drums"],
      ["Luna", "vocals"], ["Orion", "guitar"], ["Nebula", "bass"], ["Comet", "drums"]
    ];
    
    const stories = [
      "Their breakthrough came when they accidentally played their biggest hit backwards during a sound check.",
      "They once performed an entire set using kitchen utensils as instruments.",
      "Their debut single was recorded in a converted shipping container.",
      "They gained fame after a video of them performing in a subway went viral.",
      "Their unique sound comes from recording in an abandoned warehouse."
    ];
    
    const formation = formations[Math.floor(Math.random() * formations.length)];
    const selectedMembers = [];
    const memberIndices = new Set();
    while (memberIndices.size < 4) {
      memberIndices.add(Math.floor(Math.random() * members.length));
    }
    memberIndices.forEach(i => selectedMembers.push(members[i]));
    
    const story = stories[Math.floor(Math.random() * stories.length)];
    
    return `${bandName} formed in ${year} when four musicians ${formation}. The ${genreText} quartet consists of ${selectedMembers[0][0]} on ${selectedMembers[0][1]}, ${selectedMembers[1][0]} on ${selectedMembers[1][1]}, ${selectedMembers[2][0]} on ${selectedMembers[2][1]}, and ${selectedMembers[3][0]} on ${selectedMembers[3][1]}. 

Known for their ${moodText} sound that blends classic ${genreText} with unexpected elements, ${bandName} has carved out a unique niche in the music scene. ${story}

Fun fact: The band insists on having a rubber duck present at every recording session for "creative inspiration."`;
  }

  async generateBandBioWithDetails(
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
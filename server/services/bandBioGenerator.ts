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
    // Try different models in order of preference
    const models = ["grok-2-1212", "grok-2-vision-1212", "grok-3-mini"];
    
    for (const model of models) {
      try {
        const genreInfo = genre ? ` ${genre}` : 'rock';
        const moodInfo = mood ? ` ${mood}` : 'energetic';
        
        const prompt = `Write a fun, creative biography for the fictional band "${bandName}". They're a ${genreInfo} band with ${moodInfo} style. Include how they formed, band members with nicknames, and a funny story. Maximum 150 words. Be imaginative and entertaining!`;

        const response = await this.openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 250,
          temperature: 0.8
        });

        const bio = response.choices[0]?.message?.content || "";
        
        if (bio && bio.trim() !== "") {
          console.log(`Successfully generated bio using model: ${model}`);
          return bio.trim();
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
    return this.generateFallbackBio(bandName, genre, mood);
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
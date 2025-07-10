import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.x.ai/v1",
  apiKey: process.env.XAI_API_KEY
});

async function testBioGeneration() {
  try {
    console.log("Testing Grok bio generation...");
    
    const messages = [
      {
        role: "user",
        content: "Write a short, fun biography for a fictional rock band called 'Thunder Monkeys'. Include how they formed, band members, and a funny story. Keep it under 150 words."
      }
    ];
    
    console.log("Sending request to Grok API...");
    const response = await openai.chat.completions.create({
      model: "grok-3-mini",
      messages: messages,
      max_tokens: 300,
      temperature: 0.7
    });
    
    console.log("\nFull API Response:");
    console.log(JSON.stringify(response, null, 2));
    
    console.log("\nMessage content:");
    console.log(response.choices[0]?.message?.content || "No content");
    
    console.log("\nUsage details:");
    console.log("Prompt tokens:", response.usage?.prompt_tokens);
    console.log("Completion tokens:", response.usage?.completion_tokens);
    console.log("Total tokens:", response.usage?.total_tokens);
    
    if (response.usage?.completion_tokens === 0) {
      console.log("\n⚠️  WARNING: The model returned 0 completion tokens!");
      console.log("This means no text was generated.");
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

testBioGeneration();
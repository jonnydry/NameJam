import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.x.ai/v1",
  apiKey: process.env.XAI_API_KEY
});

async function testBioGeneration() {
  const models = ["grok-2-1212", "grok-2-vision-1212", "grok-beta", "grok-vision-beta", "grok-3-mini"];
  
  for (const model of models) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Testing model: ${model}`);
    console.log("=".repeat(60));
    
    try {
      const messages = [
        {
          role: "user",
          content: "Write a short, fun biography for a fictional rock band called 'Thunder Monkeys'. Include how they formed, band members, and a funny story. Keep it under 150 words."
        }
      ];
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: messages,
        max_tokens: 300,
        temperature: 0.7
      });
      
      console.log("\n✅ Success!");
      console.log("Content:", response.choices[0]?.message?.content || "No content");
      console.log("\nUsage:");
      console.log("- Prompt tokens:", response.usage?.prompt_tokens);
      console.log("- Completion tokens:", response.usage?.completion_tokens);
      console.log("- Total tokens:", response.usage?.total_tokens);
      
      if (response.usage?.completion_tokens === 0) {
        console.log("\n⚠️  WARNING: The model returned 0 completion tokens!");
      }
      
    } catch (error) {
      console.log("\n❌ Error:", error.message);
    }
  }
}

testBioGeneration();
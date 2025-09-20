import OpenAI from "openai";
import { xaiRateLimiter, withRetry } from '../../utils/rateLimiter';
import { secureLog } from '../../utils/secureLogger';
import { 
  BandBioRequest, 
  BandBioResponse, 
  BandBioRequestSchema, 
  BAND_BIO_CONFIG 
} from './bandBioConfig';
import {
  validateAndNormalize,
  shouldUseJournalisticStyle,
  selectJournalisticStyle,
  createJournalisticPrompt,
  createEdgyPrompt,
  buildPromptString,
  getSystemPrompt,
  buildRequestParams,
  parseAIResponse
} from './bandBioUtils';
import { FallbackBioGenerator } from './fallbackBioGenerator';

export class BandBioGenerator {
  private openai: OpenAI | null = null;
  private fallbackGenerator: FallbackBioGenerator;

  constructor() {
    this.fallbackGenerator = new FallbackBioGenerator();
    
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
    // Input validation and normalization
    const request = this.validateInput(bandName, genre, mood);
    
    // If OpenAI client is not available, use fallback
    if (!this.openai) {
      return this.generateFallbackResponse(request);
    }

    try {
      const bioText = await this.generateAIBio(request);
      return this.formatSuccessResponse(bioText, BAND_BIO_CONFIG.MODEL);
    } catch (error: any) {
      secureLog.info(`${BAND_BIO_CONFIG.MODEL} failed:`, error.message);
      return this.generateFallbackResponse(request);
    }
  }

  private validateInput(bandName: string, genre?: string, mood?: string): BandBioRequest {
    const normalized = validateAndNormalize(bandName, genre, mood);
    const validationResult = BandBioRequestSchema.safeParse(normalized);
    
    if (!validationResult.success) {
      throw new Error(`Invalid input: ${validationResult.error.message}`);
    }
    
    return validationResult.data;
  }

  private async generateAIBio(request: BandBioRequest): Promise<string> {
    const timestamp = Date.now();
    
    // Determine which style to use
    const useJournalistic = shouldUseJournalisticStyle();
    let selectedStyle;
    let systemPrompt;
    let prompt;

    if (useJournalistic) {
      selectedStyle = selectJournalisticStyle();
      systemPrompt = getSystemPrompt(selectedStyle);
      const jsonPrompt = createJournalisticPrompt(
        request.bandName, 
        request.genre || 'rock', 
        request.mood || 'energetic', 
        selectedStyle, 
        timestamp
      );
      prompt = buildPromptString(jsonPrompt, true);
    } else {
      systemPrompt = getSystemPrompt();
      const jsonPrompt = createEdgyPrompt(
        request.bandName, 
        request.genre || 'rock', 
        request.mood || 'energetic', 
        timestamp
      );
      prompt = buildPromptString(jsonPrompt, false);
    }

    // Build request parameters
    const requestParams = buildRequestParams(systemPrompt, prompt);

    // Make API call with retry logic
    const response = await this.executeAIRequest(requestParams);
    
    // Parse and validate response
    const content = response.choices[0]?.message?.content || "";
    if (!content || content.trim() === "") {
      throw new Error('Empty content returned');
    }

    return parseAIResponse(content);
  }

  private async executeAIRequest(requestParams: any): Promise<any> {
    return await xaiRateLimiter.execute(async () => {
      return withRetry(async () => {
        secureLog.info(`🤖 Calling grok-4-fast with params:`, {
          model: requestParams.model,
          temperature: requestParams.temperature,
          max_tokens: requestParams.max_tokens,
          messages_count: requestParams.messages?.length,
          system_prompt_length: requestParams.messages?.[0]?.content?.length,
          user_prompt_length: requestParams.messages?.[1]?.content?.length
        });
        
        const resp = await this.openai!.chat.completions.create(requestParams);
        
        secureLog.info(`🤖 grok-4-fast response:`, {
          id: resp.id,
          model: resp.model,
          choices_count: resp.choices?.length,
          content_length: resp.choices?.[0]?.message?.content?.length,
          finish_reason: resp.choices?.[0]?.finish_reason,
          usage: resp.usage
        });
        
        return resp;
      }, BAND_BIO_CONFIG.RETRY_ATTEMPTS, BAND_BIO_CONFIG.RETRY_DELAY);
    });
  }

  private formatSuccessResponse(bioText: string, model: string): string {
    secureLog.info(`Successfully generated bio using model: ${model}`);
    
    const response: BandBioResponse = {
      bio: bioText,
      model: model,
      source: 'ai'
    };
    
    return JSON.stringify(response);
  }

  private generateFallbackResponse(request: BandBioRequest): string {
    secureLog.info("Using fallback bio generator");
    const fallbackBio = this.fallbackGenerator.generateFallbackBio(
      request.bandName, 
      request.genre, 
      request.mood
    );
    
    const response: BandBioResponse = {
      bio: fallbackBio,
      model: 'fallback-template',
      source: 'local'
    };
    
    return JSON.stringify(response);
  }

}
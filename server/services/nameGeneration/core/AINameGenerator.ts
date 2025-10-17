/**
 * AI Name Generator with Connection Pooling
 * Extracted from UnifiedNameGeneratorService for better performance and maintainability
 */

import OpenAI from "openai";
import { secureLog } from "../../../utils/secureLogger";
import { CircuitBreaker } from "../../../utils/circuitBreaker";

interface ConnectionPool {
  client: OpenAI;
  inUse: boolean;
  lastUsed: number;
  requestCount: number;
}

interface GenerationRequest {
  prompt: string;
  temperature: number;
  maxTokens: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

export class AINameGenerator {
  private connectionPool: ConnectionPool[] = [];
  private requestQueue: GenerationRequest[] = [];
  private readonly POOL_SIZE = 5;
  private readonly REQUEST_TIMEOUT = 15000; // 15 seconds
  private readonly CONNECTION_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker('aiNameGenerator', {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      successThreshold: 3
    });
    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < this.POOL_SIZE; i++) {
      this.connectionPool.push({
        client: new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          timeout: this.CONNECTION_TIMEOUT,
          maxRetries: 0 // We handle retries ourselves
        }),
        inUse: false,
        lastUsed: 0,
        requestCount: 0
      });
    }
    secureLog.info(`Initialized OpenAI connection pool with ${this.POOL_SIZE} connections`);
  }

  private getAvailableConnection(): ConnectionPool | null {
    return this.connectionPool.find(conn => !conn.inUse) || null;
  }

  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) return;

    const connection = this.getAvailableConnection();
    if (!connection) return;

    const request = this.requestQueue.shift();
    if (!request) return;

    // Check if request has expired
    if (Date.now() - request.timestamp > this.REQUEST_TIMEOUT) {
      request.reject(new Error('Request timeout'));
      this.processQueue(); // Process next request
      return;
    }

    connection.inUse = true;
    connection.lastUsed = Date.now();
    connection.requestCount++;

    try {
      const result = await this.executeRequest(connection.client, request);
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      connection.inUse = false;
      // Process next request in queue
      setImmediate(() => this.processQueue());
    }
  }

  private async executeRequest(client: OpenAI, request: GenerationRequest): Promise<any> {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a creative name generator for bands and songs. Generate unique, memorable names that fit the given context. Return only the names, one per line, without explanations or formatting."
        },
        {
          role: "user",
          content: request.prompt
        }
      ],
      temperature: request.temperature,
      max_tokens: request.maxTokens
    });

    return response.choices[0]?.message?.content || "";
  }

  async generateNames(
    request: any,
    context: any,
    strategy: any
  ): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { type, genre, mood, wordCount, count = 4 } = request;
    
    // Build prompt based on context and strategy
    const prompt = this.buildPrompt(request, context, strategy);
    
    try {
      const response = await this.generateWithAI(prompt, 0.8, 150);
      const names = this.parseAIResponseRobustly(response);
      
      return names.map(name => ({
        name,
        isAiGenerated: true,
        source: 'ai'
      }));
    } catch (error) {
      secureLog.error('AI name generation failed:', error);
      return [];
    }
  }

  private buildPrompt(request: any, context: any, strategy: any): string {
    const { type, genre, mood, wordCount } = request;
    
    let prompt = `Generate ${request.count || 4} unique ${type} names`;
    
    if (genre) {
      prompt += ` for ${genre} music`;
    }
    
    if (mood) {
      prompt += ` with a ${mood} mood`;
    }
    
    if (wordCount) {
      prompt += ` (${wordCount} words each)`;
    }
    
    prompt += `. Make them creative, memorable, and suitable for the music industry. Return only the names, one per line, without explanations.`;
    
    return prompt;
  }

  async generateWithAI(
    prompt: string,
    temperature: number = 0.8,
    maxTokens: number = 150
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const request: GenerationRequest = {
        prompt,
        temperature,
        maxTokens,
        resolve,
        reject,
        timestamp: Date.now()
      };

      // Add to queue
      this.requestQueue.push(request);

      // Process queue
      setImmediate(() => this.processQueue());
    });
  }

  async generateWithOptimizedXAI(
    prompt: string,
    temperature: number = 0.8,
    maxTokens: number = 150
  ): Promise<string[]> {
    // For now, fallback to regular AI generation
    // This can be enhanced with Grok API integration later
    return this.generateWithAI(prompt, temperature, maxTokens);
  }

  parseAIResponseRobustly(response: string): string[] {
    if (!response || typeof response !== 'string') {
      return [];
    }

    // Multiple parsing strategies for robustness
    const strategies = [
      // Strategy 1: Split by newlines and clean
      (text: string) => text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.match(/^\d+\./))
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0),

      // Strategy 2: Look for numbered lists
      (text: string) => text.split('\n')
        .map(line => line.trim())
        .filter(line => line.match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0),

      // Strategy 3: Split by common separators
      (text: string) => text.split(/[,;|]/)
        .map(item => item.trim())
        .filter(item => item.length > 0),

      // Strategy 4: Extract quoted strings
      (text: string) => {
        const quoted = text.match(/"([^"]+)"/g);
        return quoted ? quoted.map(q => q.replace(/"/g, '').trim()) : [];
      },

      // Strategy 5: Simple word extraction (fallback)
      (text: string) => {
        const words = text.split(/\s+/)
          .filter(word => word.length > 2 && word.length < 50)
          .filter(word => !word.match(/^[0-9]+$/))
          .filter(word => !word.match(/^(the|and|or|but|in|on|at|to|for|of|with|by)$/i));
        return words.slice(0, 10); // Limit to 10 words
      }
    ];

    // Try each strategy and return the one with the most results
    let bestResult: string[] = [];
    let maxCount = 0;

    for (const strategy of strategies) {
      try {
        const result = strategy(response);
        if (result.length > maxCount && result.length > 0) {
          bestResult = result;
          maxCount = result.length;
        }
      } catch (error) {
        secureLog.debug('AI response parsing strategy failed:', error);
      }
    }

    // Clean and validate results
    const cleanedResults = bestResult
      .map(name => name.trim())
      .filter(name => name.length > 0)
      .filter(name => name.length <= 100) // Reasonable length limit
      .filter(name => !name.match(/^[^a-zA-Z0-9]+$/)) // Must contain alphanumeric
      .slice(0, 20); // Limit to 20 names

    secureLog.debug(`Parsed ${cleanedResults.length} names from AI response using ${maxCount > 0 ? 'strategy' : 'fallback'}`);
    return cleanedResults;
  }

  getPoolStats() {
    const activeConnections = this.connectionPool.filter(conn => conn.inUse).length;
    const totalRequests = this.connectionPool.reduce((sum, conn) => sum + conn.requestCount, 0);
    
    return {
      poolSize: this.connectionPool.length,
      activeConnections,
      availableConnections: this.connectionPool.length - activeConnections,
      queuedRequests: this.requestQueue.length,
      totalRequests,
      averageRequestsPerConnection: totalRequests / this.connectionPool.length
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const connection = this.getAvailableConnection();
      if (!connection) {
        return false; // No available connections
      }

      // Test with a simple request
      const testResponse = await connection.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 1
      });

      return !!testResponse.choices[0]?.message?.content;
    } catch (error) {
      secureLog.error('OpenAI health check failed:', error);
      return false;
    }
  }
}

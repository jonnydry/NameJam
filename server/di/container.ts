/**
 * Simple Dependency Injection Container
 * Provides basic DI functionality for better testability and maintainability
 */

import { secureLog } from "../utils/secureLogger";
import { config } from "../config";

// Service factory type (can be sync or async)
type ServiceFactory<T> = () => T | Promise<T>;

// Service registration type
type ServiceRegistration<T> = {
  factory: ServiceFactory<T>;
  singleton: boolean;
  instance?: T;
};

export class DIContainer {
  private services = new Map<string, ServiceRegistration<any>>();

  /**
   * Register a service in the container
   */
  register<T>(name: string, factory: ServiceFactory<T>, singleton: boolean = true): void {
    this.services.set(name, {
      factory,
      singleton,
      instance: undefined
    });
    secureLog.debug(`Registered service: ${name} (singleton: ${singleton})`);
  }

  /**
   * Get a service from the container (async)
   */
  async get<T>(name: string): Promise<T> {
    const registration = this.services.get(name);
    
    if (!registration) {
      throw new Error(`Service '${name}' not found in container`);
    }

    // Return existing instance if singleton
    if (registration.singleton && registration.instance) {
      return registration.instance;
    }

    // Create new instance (await in case it's async)
    const instance = await registration.factory();
    
    // Store instance if singleton
    if (registration.singleton) {
      registration.instance = instance;
    }

    return instance;
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    secureLog.debug('DIContainer cleared');
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get container statistics
   */
  getStats() {
    const singletonInstances = Array.from(this.services.values())
      .filter(reg => reg.singleton && reg.instance)
      .length;
    
    return {
      totalServices: this.services.size,
      singletonInstances,
      serviceNames: this.getServiceNames()
    };
  }
}

// Global container instance
export const container = new DIContainer();

/**
 * Initialize the container with all application services
 */
export function initializeContainer(): void {
  secureLog.info('Initializing dependency injection container...');

  // Register configuration
  container.register('config', () => config, true);

  // Register core services
  container.register('unifiedNameGenerator', async () => {
    const { UnifiedNameGeneratorService } = await import('../services/unifiedNameGenerator');
    return new UnifiedNameGeneratorService();
  }, true);

  container.register('qualityRankingSystem', async () => {
    const { qualityRankingSystem } = await import('../services/qualityScoring/qualityRankingSystem');
    return qualityRankingSystem;
  }, true);

  container.register('parallelVerificationService', async () => {
    const { parallelVerificationService } = await import('../services/parallelVerification');
    return parallelVerificationService;
  }, true);

  container.register('unifiedWordFilter', async () => {
    const { unifiedWordFilter } = await import('../services/nameGeneration/unifiedWordFilter');
    return unifiedWordFilter;
  }, true);

  container.register('optimizedContextService', async () => {
    const { optimizedContextService } = await import('../services/optimizedContextService');
    return optimizedContextService;
  }, true);

  container.register('backgroundQueue', async () => {
    const { backgroundQueue } = await import('../api/services/BackgroundQueue');
    return backgroundQueue;
  }, true);

  container.register('requestDeduplicationService', async () => {
    const { requestDeduplicationService } = await import('../api/middleware/requestDeduplication');
    return requestDeduplicationService;
  }, true);

  // Register handlers
  container.register('nameGenerationHandler', async () => {
    const { NameGenerationHandler } = await import('../api/handlers/NameGenerationHandler');
    const nameGenerator = await container.get('unifiedNameGenerator');
    return new NameGenerationHandler(nameGenerator);
  }, true);

  container.register('generationOrchestrator', async () => {
    const { GenerationOrchestrator } = await import('../api/services/GenerationOrchestrator');
    const nameGenerator = await container.get('unifiedNameGenerator');
    return new GenerationOrchestrator(nameGenerator);
  }, true);

  // Register AI services
  container.register('aiNameGenerator', async () => {
    const { AINameGenerator } = await import('../services/nameGeneration/core/AINameGenerator');
    return new AINameGenerator();
  }, true);

  // Register new focused services
  container.register('patternNameGenerator', async () => {
    const { PatternNameGenerator } = await import('../services/nameGeneration/core/PatternNameGenerator');
    return new PatternNameGenerator();
  }, true);

  container.register('contextEnricher', async () => {
    const { ContextEnricher } = await import('../services/nameGeneration/core/ContextEnricher');
    return new ContextEnricher();
  }, true);

  container.register('varietyOptimizer', async () => {
    const { VarietyOptimizer } = await import('../services/nameGeneration/core/VarietyOptimizer');
    return new VarietyOptimizer();
  }, true);

  container.register('nameGenerationCoordinator', async () => {
    const { NameGenerationCoordinator } = await import('../services/nameGeneration/core/NameGenerationCoordinator');
    const aiGenerator = await container.get('aiNameGenerator');
    const patternGenerator = await container.get('patternNameGenerator');
    const contextEnricher = await container.get('contextEnricher');
    const varietyOptimizer = await container.get('varietyOptimizer');
    return new NameGenerationCoordinator(aiGenerator, patternGenerator, contextEnricher, varietyOptimizer);
  }, true);

  // Register new unified name generator
  container.register('newUnifiedNameGenerator', async () => {
    const { NewUnifiedNameGeneratorService } = await import('../services/nameGeneration/NewUnifiedNameGenerator');
    return new NewUnifiedNameGeneratorService();
  }, true);

  // Register additional handlers
  container.register('bandBioHandler', async () => {
    const { BandBioHandler } = await import('../api/handlers/BandBioHandler');
    return new BandBioHandler();
  }, true);

  container.register('lyricHandler', async () => {
    const { LyricHandler } = await import('../api/handlers/LyricHandler');
    return new LyricHandler();
  }, true);

  container.register('stashHandler', async () => {
    const { StashHandler } = await import('../api/handlers/StashHandler');
    return new StashHandler();
  }, true);

  container.register('errorLoggingHandler', async () => {
    const { ErrorLoggingHandler } = await import('../api/handlers/ErrorLoggingHandler');
    return new ErrorLoggingHandler();
  }, true);

  secureLog.info(`Dependency injection container initialized with ${container.getStats().totalServices} services`);
}

/**
 * Helper function to get a service with type safety (async)
 */
export async function getService<T>(name: string): Promise<T> {
  return await container.get<T>(name);
}

/**
 * Helper function to check if a service exists
 */
export function hasService(name: string): boolean {
  return container.has(name);
}

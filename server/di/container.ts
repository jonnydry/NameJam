/**
 * Simple Dependency Injection Container
 * Provides basic DI functionality for better testability and maintainability
 */

import { secureLog } from "../utils/secureLogger";
import { config } from "../config";

// Service factory type
type ServiceFactory<T> = () => T;

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
   * Get a service from the container
   */
  get<T>(name: string): T {
    const registration = this.services.get(name);
    
    if (!registration) {
      throw new Error(`Service '${name}' not found in container`);
    }

    // Return existing instance if singleton
    if (registration.singleton && registration.instance) {
      return registration.instance;
    }

    // Create new instance
    const instance = registration.factory();
    
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
  container.register('unifiedNameGenerator', () => {
    const { UnifiedNameGeneratorService } = require('../services/unifiedNameGenerator');
    return new UnifiedNameGeneratorService();
  }, true);

  container.register('qualityRankingSystem', () => {
    const { qualityRankingSystem } = require('../services/qualityScoring/qualityRankingSystem');
    return qualityRankingSystem;
  }, true);

  container.register('parallelVerificationService', () => {
    const { parallelVerificationService } = require('../services/parallelVerification');
    return parallelVerificationService;
  }, true);

  container.register('unifiedWordFilter', () => {
    const { unifiedWordFilter } = require('../services/nameGeneration/unifiedWordFilter');
    return unifiedWordFilter;
  }, true);

  container.register('optimizedContextService', () => {
    const { optimizedContextService } = require('../services/optimizedContextService');
    return optimizedContextService;
  }, true);

  container.register('backgroundQueue', () => {
    const { backgroundQueue } = require('../api/services/BackgroundQueue');
    return backgroundQueue;
  }, true);

  container.register('requestDeduplicationService', () => {
    const { requestDeduplicationService } = require('../api/middleware/requestDeduplication');
    return requestDeduplicationService;
  }, true);

  // Register handlers
  container.register('nameGenerationHandler', () => {
    const { NameGenerationHandler } = require('../api/handlers/NameGenerationHandler');
    const nameGenerator = container.get('unifiedNameGenerator');
    return new NameGenerationHandler(nameGenerator);
  }, true);

  container.register('generationOrchestrator', () => {
    const { GenerationOrchestrator } = require('../api/services/GenerationOrchestrator');
    const nameGenerator = container.get('unifiedNameGenerator');
    return new GenerationOrchestrator(nameGenerator);
  }, true);

  // Register AI services
  container.register('aiNameGenerator', () => {
    const { AINameGenerator } = require('../services/nameGeneration/core/AINameGenerator');
    return new AINameGenerator();
  }, true);

  // Register new focused services
  container.register('patternNameGenerator', () => {
    const { PatternNameGenerator } = require('../services/nameGeneration/core/PatternNameGenerator');
    return new PatternNameGenerator();
  }, true);

  container.register('contextEnricher', () => {
    const { ContextEnricher } = require('../services/nameGeneration/core/ContextEnricher');
    return new ContextEnricher();
  }, true);

  container.register('varietyOptimizer', () => {
    const { VarietyOptimizer } = require('../services/nameGeneration/core/VarietyOptimizer');
    return new VarietyOptimizer();
  }, true);

  container.register('nameGenerationCoordinator', () => {
    const { NameGenerationCoordinator } = require('../services/nameGeneration/core/NameGenerationCoordinator');
    const aiGenerator = container.get('aiNameGenerator');
    const patternGenerator = container.get('patternNameGenerator');
    const contextEnricher = container.get('contextEnricher');
    const varietyOptimizer = container.get('varietyOptimizer');
    return new NameGenerationCoordinator(aiGenerator, patternGenerator, contextEnricher, varietyOptimizer);
  }, true);

  // Register new unified name generator
  container.register('newUnifiedNameGenerator', () => {
    const { NewUnifiedNameGeneratorService } = require('../services/nameGeneration/NewUnifiedNameGenerator');
    return new NewUnifiedNameGeneratorService();
  }, true);

  // Register additional handlers
  container.register('bandBioHandler', () => {
    const { BandBioHandler } = require('../api/handlers/BandBioHandler');
    return new BandBioHandler();
  }, true);

  container.register('lyricHandler', () => {
    const { LyricHandler } = require('../api/handlers/LyricHandler');
    return new LyricHandler();
  }, true);

  container.register('stashHandler', () => {
    const { StashHandler } = require('../api/handlers/StashHandler');
    return new StashHandler();
  }, true);

  container.register('errorLoggingHandler', () => {
    const { ErrorLoggingHandler } = require('../api/handlers/ErrorLoggingHandler');
    return new ErrorLoggingHandler();
  }, true);

  secureLog.info(`Dependency injection container initialized with ${container.getStats().totalServices} services`);
}

/**
 * Helper function to get a service with type safety
 */
export function getService<T>(name: string): T {
  return container.get<T>(name);
}

/**
 * Helper function to check if a service exists
 */
export function hasService(name: string): boolean {
  return container.has(name);
}
